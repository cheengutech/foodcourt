import { ollamaChat } from './ollama';
import { narratePrompt, NARRATE_SYSTEM, atmosphereState } from './prompts';
const processedIds = new Set<number>();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const API_BASE = `https://api.telegram.org/bot${TOKEN}`;

let lastUpdateId = 0;

async function sendMessage(chatId: string, text: string) {
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

async function getRoomStats() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sessions?select=visit_count,last_seen_at,last_status&order=last_seen_at.desc&limit=50`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) return null;
  return await res.json() as Array<{ visit_count: number; last_seen_at: string; last_status: Record<string, string> }>;
}

async function handleIntent(text: string, chatId: string) {
  const lower = text.toLowerCase().trim();

  if (lower.includes('who') || lower.includes('room') || lower.includes('people') || lower.includes('how many')) {
    const sessions = await getRoomStats();
    if (!sessions) return sendMessage(chatId, 'Could not fetch room data.');
    const recent = sessions.filter(s => Date.now() - new Date(s.last_seen_at).getTime() < 30 * 60 * 1000);
    const hour = new Date().getHours();
    const atm = atmosphereState(hour, recent.length);
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
    const narration = await ollamaChat(
      narratePrompt({ totalVisits: sessions?.length || 0, peakCount: 0, longestStay: 0, sampleStatuses }),
      NARRATE_SYSTEM
    );
    return sendMessage(chatId, narration);
  }

  if (lower.includes('atmosphere') || lower.includes('vibe') || lower.includes('mood')) {
    const hour = new Date().getHours();
    const sessions = await getRoomStats();
    const recent = (sessions || []).filter(s => Date.now() - new Date(s.last_seen_at).getTime() < 30 * 60 * 1000);
    const atm = atmosphereState(hour, recent.length);
    return sendMessage(chatId, `*Atmosphere*\nVibe: ${atm.label}\nWarmth: ${Math.round(atm.warmth * 100)}%\nEnergy: ${Math.round(atm.energy * 100)}%\nOccupancy: ${recent.length}`);
  }

  if (lower.includes('ban') || lower.includes('block')) {
    const match = text.match(/(?:ban|block)\s+(?:word[:\s]+)?(.+)/i);
    const word = match?.[1]?.trim();
    if (!word) return sendMessage(chatId, 'Usage: "ban word: crypto"');
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

  const reply = await ollamaChat(`You are Hermes, operator assistant for a digital food court. The operator asks: "${text}". Reply helpfully and briefly.`);
  return sendMessage(chatId, reply);
}

export async function pollTelegram() {
  try {
    const res = await fetch(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`);
    if (!res.ok) return;
    const data = await res.json() as { result: Array<{ update_id: number; message?: { chat: { id: number }; text?: string } }> };
    for (const update of data.result) {
      lastUpdateId = update.update_id;
      if (processedIds.has(update.update_id)) continue;
      processedIds.add(update.update_id);
      const msg = update.message;
      if (!msg?.text) continue;
      const chatId = String(msg.chat.id);
      if (chatId !== ALLOWED_CHAT_ID) { await sendMessage(chatId, 'Private operator bot.'); continue; }
      await handleIntent(msg.text, chatId);
    }
  } catch (err) {
    console.error('[Telegram poll error]', err);
  }
}
