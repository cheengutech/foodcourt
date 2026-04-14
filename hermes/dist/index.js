"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const ollama_1 = require("./ollama");
const prompts_1 = require("./prompts");
const telegram_1 = require("./telegram");
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
        const raw = await (0, ollama_1.ollamaChat)((0, prompts_1.suggestPrompt)(now.getHours(), now.toLocaleDateString('en-US', { weekday: 'long' })), prompts_1.SUGGEST_SYSTEM);
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const suggestions = JSON.parse(cleaned);
        res.json({ suggestions: suggestions.slice(0, 3) });
    }
    catch {
        res.json({ suggestions: ['something quiet · just existing · tea', 'lo-fi · not much · whatever\'s nearby', 'silence · winding down · water'] });
    }
});
app.post('/moderate', async (req, res) => {
    const { status } = req.body;
    if (!status?.trim())
        return res.json({ ok: true });
    try {
        const raw = await (0, ollama_1.ollamaChat)((0, prompts_1.moderatePrompt)(status), prompts_1.MODERATE_SYSTEM);
        const cleaned = raw.replace(/```json|```/g, '').trim();
        return res.json(JSON.parse(cleaned));
    }
    catch {
        return res.json({ ok: true });
    }
});
app.post('/narrate', async (req, res) => {
    const { stats } = req.body;
    try {
        const narration = await (0, ollama_1.ollamaChat)((0, prompts_1.narratePrompt)(stats), prompts_1.NARRATE_SYSTEM);
        res.json({ narration });
    }
    catch {
        res.status(500).json({ error: 'narration failed' });
    }
});
app.get('/atmosphere', (req, res) => {
    const hour = new Date().getHours();
    const occupancy = parseInt(String(req.query.occupancy || '0'), 10);
    res.json((0, prompts_1.atmosphereState)(hour, occupancy));
});
app.listen(PORT, () => {
    console.log(`Hermes running on http://localhost:${PORT}`);
    console.log(`Model: ${process.env.OLLAMA_MODEL || 'qwen3.5:9b'}`);
});
setInterval(telegram_1.pollTelegram, 2000);
(0, telegram_1.pollTelegram)();
