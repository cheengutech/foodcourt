"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollTelegram = pollTelegram;
const coder_1 = require("./coder");
const ollama_1 = require("./ollama");
const prompts_1 = require("./prompts");
const processedIds = new Set();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE = `https://api.telegram.org/bot${TOKEN}`;
let lastUpdateId = 0;
async function sendMessage(chatId, text) {
    await fetch(`${API_BASE}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
}
async function getRoomStats() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sessions?select=visit_count,last_seen_at,last_status&order=last_seen_at.desc&limit=50`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (!res.ok)
        return null;
    return await res.json();
}
async function handleIntent(text, chatId) {
    const lower = text.toLowerCase().trim();
    if (lower.includes('who') || lower.includes('room') || lower.includes('people') || lower.includes('how many')) {
        const sessions = await getRoomStats();
        if (!sessions)
            return sendMessage(chatId, 'Could not fetch room data.');
        const recent = sessions.filter(s => Date.now() - new Date(s.last_seen_at).getTime() < 30 * 60 * 1000);
        const hour = new Date().getHours();
        const atm = (0, prompts_1.atmosphereState)(hour, recent.length);
        const statusList = recent
            .map(s => [s.last_status?.music, s.last_status?.doing, s.last_status?.having].filter(Boolean).join(' · '))
            .filter(Boolean).slice(0, 5).map(s => `• ${s}`).join('\n');
        return sendMessage(chatId, `*Food Court — ${atm.label}*\n${recent.length} people in last 30 min\n\n${statusList || 'No statuses set'}`);
    }
    if (lower.includes('narrat') || lower.includes('story') || lower.includes('today') || lower.includes('recap')) {
        await sendMessage(chatId, 'Writing narration...');
        const sessions = await getRoomStats();
        const sampleStatuses = (sessions || [])
            .map(s => [s.last_status?.music, s.last_status?.doing].filter(Boolean).join(' · '))
            .filter(Boolean).slice(0, 8);
        const narration = await (0, ollama_1.ollamaChat)((0, prompts_1.narratePrompt)({ totalVisits: sessions?.length || 0, peakCount: 0, longestStay: 0, sampleStatuses }), prompts_1.NARRATE_SYSTEM);
        return sendMessage(chatId, narration);
    }
    if (lower.includes('atmosphere') || lower.includes('vibe') || lower.includes('mood')) {
        const hour = new Date().getHours();
        const sessions = await getRoomStats();
        const recent = (sessions || []).filter(s => Date.now() - new Date(s.last_seen_at).getTime() < 30 * 60 * 1000);
        const atm = (0, prompts_1.atmosphereState)(hour, recent.length);
        return sendMessage(chatId, `*Atmosphere*\nVibe: ${atm.label}\nWarmth: ${Math.round(atm.warmth * 100)}%\nEnergy: ${Math.round(atm.energy * 100)}%\nOccupancy: ${recent.length}`);
    }
    if (lower.includes('ban') || lower.includes('block')) {
        const match = text.match(/(?:ban|block)\s+(?:word[:\s]+)?(.+)/i);
        const word = match?.[1]?.trim();
        if (!word)
            return sendMessage(chatId, 'Usage: "ban word: crypto"');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/moderation_rules`, {
            method: 'POST',
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({ word: word.toLowerCase(), added_at: new Date().toISOString() }),
        });
        return res.ok ? sendMessage(chatId, `Done. "${word}" added to moderation rules.`) : sendMessage(chatId, 'Failed to add rule.');
    }
    if (lower === 'help' || lower === '?') {
        return sendMessage(chatId, `*Hermes commands*\n\n• "who's in the room"\n• "write today's narration"\n• "what's the vibe"\n• "ban word: [word]"\n• "help"`);
    }
    if (lower.startsWith('fix:') || lower.startsWith('task:') || lower.startsWith('build:')) {
        const task = text.replace(/^(fix|task|build):\s*/i, '').trim();
        await sendMessage(chatId, `Starting task: "${task}"`);
        const result = await (0, coder_1.runCodingTask)(task, (update) => sendMessage(chatId, update));
        return sendMessage(chatId, result);
    }
    if (lower === 'revert' || lower === 'revert last') {
        const result = await (0, coder_1.gitRevert)();
        return sendMessage(chatId, result || 'Reverted last commit.');
    }
    if (lower === 'what changed' || lower === 'diff') {
        const result = await (0, coder_1.gitDiff)();
        return sendMessage(chatId, result || 'Nothing to show.');
    }
    if (lower === 'build' || lower === 'build status') {
        const { ok, output } = await (0, coder_1.buildProject)();
        return sendMessage(chatId, `Build ${ok ? 'passed' : 'failed'}:\n${output}`);
    }
    if (lower.startsWith('run:')) {
        const cmd = text.replace(/^run:\s*/i, '').trim();
        const result = await (0, coder_1.runCommand)(cmd);
        return sendMessage(chatId, result);
    }
    const reply = await (0, ollama_1.ollamaChat)(`You are Hermes, operator assistant for a digital food court. The operator asks: "${text}". Reply helpfully and briefly.`);
    return sendMessage(chatId, reply);
}
async function pollTelegram() {
    try {
        const res = await fetch(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
        if (!res.ok)
            return;
        const data = await res.json();
        for (const update of data.result) {
            lastUpdateId = update.update_id;
            if (processedIds.has(update.update_id))
                continue;
            processedIds.add(update.update_id);
            const msg = update.message;
            if (!msg?.text)
                continue;
            const chatId = String(msg.chat.id);
            if (chatId !== ALLOWED_CHAT_ID) {
                await sendMessage(chatId, 'Private operator bot.');
                continue;
            }
            await handleIntent(msg.text, chatId);
        }
    }
    catch (err) {
        console.error('[Telegram poll error]', err);
    }
}
