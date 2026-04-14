import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const REPO = '/Users/brian/foodcourt/foodcourt';

export async function readFile(filePath: string): Promise<string> {
  const full = path.join(REPO, filePath);
  if (!fs.existsSync(full)) return `File not found: ${filePath}`;
  return fs.readFileSync(full, 'utf8');
}

export async function writeFile(filePath: string, content: string): Promise<string> {
  const full = path.join(REPO, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return `Written: ${filePath}`;
}

export async function runCommand(cmd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: REPO, timeout: 60000 });
    return (stdout + stderr).trim().slice(0, 1500);
  } catch (err: any) {
    return (err.stdout + err.stderr).trim().slice(0, 1500);
  }
}

export async function buildProject(): Promise<{ ok: boolean; output: string }> {
  const output = await runCommand('npm run build 2>&1');
  const ok = !output.includes('Error') && !output.includes('error TS');
  return { ok, output: output.slice(0, 800) };
}

export async function gitCommit(message: string): Promise<string> {
  await runCommand('git add -A');
  return runCommand(`git commit -m "${message}"`);
}

export async function gitRevert(): Promise<string> {
  return runCommand('git revert HEAD --no-edit');
}

export async function gitDiff(): Promise<string> {
  return runCommand('git diff HEAD~1 --stat');
}

export async function listFiles(dir: string = ''): Promise<string> {
    return runCommand(`find ${REPO} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \\) | grep -v node_modules | grep -v .next | grep -v dist | grep -v .claude`);
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';

async function askOllama(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      think: false,
      options: { temperature: 0.2, num_predict: 2000 },
    }),
  });
  const data = await res.json() as { response: string };
  return data.response.trim();
}

export async function runCodingTask(task: string, sendUpdate: (msg: string) => void): Promise<string> {
  sendUpdate(`Starting task: ${task}`);

  // Step 1: figure out which files are relevant
  const allFiles = await listFiles();
  const fileListPrompt = `You are a coding assistant working on a Next.js app called Food Court.
Here are the source files:
${allFiles}

The task is: "${task}"

List only the 1-3 most relevant file paths to read. One per line, no explanation.`;

  const relevantRaw = await askOllama(fileListPrompt);
  const relevantFiles = relevantRaw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.endsWith('.ts') || l.endsWith('.tsx') || l.endsWith('.css'))
    .slice(0, 3);

  sendUpdate(`Reading: ${relevantFiles.join(', ')}`);

  // Step 2: read the files
  const fileContents: Record<string, string> = {};
  for (const f of relevantFiles) {
    const relativePath = f.replace(REPO + '/', '').replace(REPO, '');
    fileContents[relativePath] = await readFile(relativePath);
  }

  // Step 3: ask Ollama for the fix
  const codePrompt = `You are a senior TypeScript/React developer working on a Next.js app called Food Court.
Product rule: NEVER add chat features. NEVER add goals or timers. Keep it ambient.

Task: "${task}"

Current file contents:
${Object.entries(fileContents).map(([f, c]) => `=== ${f} ===\n${c}`).join('\n\n')}

Respond with ONLY the edited files in this exact format — no explanation, no markdown:
=== path/to/file.tsx ===
<full file content here>

Only include files you actually changed.`;

  sendUpdate('Asking Ollama for solution...');
  const response = await askOllama(codePrompt);

  // Step 4: parse and write the files
  const fileBlocks = response.split(/^=== /m).filter(b => b.trim());
  const written: string[] = [];

  for (const block of fileBlocks) {
    const newline = block.indexOf('\n');
    if (newline === -1) continue;
    const filePath = block.slice(0, newline).replace(' ===', '').trim();
    const content = block.slice(newline + 1).trim();
    if (filePath && content && (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css'))) {
      await writeFile(filePath, content);
      written.push(filePath);
    }
  }

  if (written.length === 0) {
    return 'Ollama could not produce a valid file edit. Try rephrasing the task.';
  }

  sendUpdate(`Wrote: ${written.join(', ')} — running build...`);

  // Step 5: build
  const { ok, output } = await buildProject();

  if (ok) {
    await gitCommit(`hermes: ${task}`);
    return `Done. Build passed.\nFiles changed: ${written.join(', ')}\nCommitted.`;
  } else {
    // Step 6: attempt one auto-fix
    sendUpdate('Build failed. Attempting auto-fix...');

    const fixPrompt = `The build failed after this change. Fix the TypeScript errors.

Task was: "${task}"
Files written: ${written.join(', ')}

Build errors:
${output}

Current file contents:
${written.map(f => `=== ${f} ===\n${fs.readFileSync(path.join(REPO, f), 'utf8')}`).join('\n\n')}

Respond with ONLY the fixed files in this format:
=== path/to/file.tsx ===
<full corrected content>`;

    const fixResponse = await askOllama(fixPrompt);
    const fixBlocks = fixResponse.split(/^=== /m).filter(b => b.trim());

    for (const block of fixBlocks) {
      const newline = block.indexOf('\n');
      if (newline === -1) continue;
      const filePath = block.slice(0, newline).replace(' ===', '').trim();
      const content = block.slice(newline + 1).trim();
      if (filePath && content) await writeFile(filePath, content);
    }

    const retry = await buildProject();
    if (retry.ok) {
      await gitCommit(`hermes: ${task}`);
      return `Done after auto-fix. Build passed.\nFiles: ${written.join(', ')}\nCommitted.`;
    }

    // revert if both attempts failed
    await runCommand('git checkout -- .');
    return `Build failed after two attempts. Changes reverted.\nErrors:\n${retry.output}`;
  }
}
