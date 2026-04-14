import 'dotenv/config';
import express from 'express';
import { ollamaChat } from './ollama';
import { SUGGEST_SYSTEM, suggestPrompt, MODERATE_SYSTEM, moderatePrompt, narratePrompt, NARRATE_SYSTEM, atmosphereState } from './prompts';
import { pollTelegram } from './telegram';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3101;

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: process.env.OLLAMA_MODEL });
});

app.post('/suggest', async (_req, res) => {
  try {
    const now = new Date();
    const raw = await ollamaChat(suggestPrompt(now.getHours(), now.toLocaleDateString('en-US', { weekday: 'long' })), SUGGEST_SYSTEM);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const suggestions: string[] = JSON.parse(cleaned);
    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch {
    res.json({ suggestions: ['something quiet · just existing · tea', 'lo-fi · not much · whatever\'s nearby', 'silence · winding down · water'] });
  }
});

app.post('/moderate', async (req, res) => {
  const { status } = req.body as { status: string };
  if (!status?.trim()) return res.json({ ok: true });
  try {
    const raw = await ollamaChat(moderatePrompt(status), MODERATE_SYSTEM);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return res.json(JSON.parse(cleaned));
  } catch {
    return res.json({ ok: true });
  }
});

app.post('/narrate', async (req, res) => {
  const { stats } = req.body as { stats: { totalVisits: number; peakCount: number; longestStay: number; sampleStatuses: string[] } };
  try {
    const narration = await ollamaChat(narratePrompt(stats), NARRATE_SYSTEM);
    res.json({ narration });
  } catch {
    res.status(500).json({ error: 'narration failed' });
  }
});

app.get('/atmosphere', (req, res) => {
  const hour = new Date().getHours();
  const occupancy = parseInt(String(req.query.occupancy || '0'), 10);
  res.json(atmosphereState(hour, occupancy));
});

app.listen(PORT, () => {
  console.log(`Hermes running on http://localhost:${PORT}`);
  console.log(`Model: ${process.env.OLLAMA_MODEL || 'qwen3.5:9b'}`);
});

setInterval(pollTelegram, 2000);
pollTelegram();
