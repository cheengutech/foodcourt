"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NARRATE_SYSTEM = exports.MODERATE_SYSTEM = exports.SUGGEST_SYSTEM = void 0;
exports.suggestPrompt = suggestPrompt;
exports.moderatePrompt = moderatePrompt;
exports.narratePrompt = narratePrompt;
exports.atmosphereState = atmosphereState;
exports.SUGGEST_SYSTEM = `You are a warm, laid-back presence in a late-night digital food court.
Generate exactly 3 short status suggestions for someone who just joined.
Each suggestion has 3 parts separated by " · ": music, activity, food/drink.
Keep it honest, warm, and human. Not corporate. Not productivity-speak.
Respond ONLY with a JSON array of 3 strings. No explanation. No markdown.
Example: ["lo-fi beats · reading nothing important · chamomile tea", "rain sounds · spacing out · cold pizza", "tv static · job hunting · black coffee"]`;
function suggestPrompt(hour, dayOfWeek) {
    const timeContext = hour < 6 ? 'very late night, almost sunrise'
        : hour < 12 ? 'morning'
            : hour < 17 ? 'afternoon'
                : hour < 21 ? 'evening'
                    : 'late night';
    return `It is ${timeContext} on a ${dayOfWeek}. Suggest 3 status options for someone joining the food court right now.`;
}
exports.MODERATE_SYSTEM = `You are a quiet moderator for a chill ambient social space.
Check if the given status text is acceptable.
Reject ONLY: hate speech, slurs, explicit sexual content, spam, personal attacks.
Allow: sadness, frustration, casual profanity, weird humor, anything honest and human.
Respond ONLY with valid JSON: {"ok": true} or {"ok": false, "reason": "one short sentence"}`;
function moderatePrompt(status) {
    return `Status to check: "${status}"`;
}
exports.NARRATE_SYSTEM = `You are the quiet narrator of a late-night digital food court.
Write a short, warm, human paragraph (3-4 sentences) about what happened in the room today.
Write like you are describing a coffee shop you watched from the corner. Observational, a little poetic, never clinical.
Do not use numbers or analytics language. Just describe the feeling of who was there.`;
function narratePrompt(stats) {
    return `Today's room data:
- ${stats.totalVisits} people came through
- Peak occupancy: ${stats.peakCount} at once
- Longest stay: ${stats.longestStay} minutes
- Sample statuses seen: ${stats.sampleStatuses.slice(0, 5).join(' / ')}

Write the narration.`;
}
function atmosphereState(hour, occupancy) {
    if (hour >= 23 || hour < 4) {
        return { vibe: 'late-night', warmth: 0.85, energy: occupancy > 3 ? 0.7 : 0.4, label: 'late night' };
    }
    else if (hour < 8) {
        return { vibe: 'early-morning', warmth: 0.5, energy: 0.3, label: 'early morning' };
    }
    else if (hour < 12) {
        return { vibe: 'morning', warmth: 0.4, energy: 0.6, label: 'morning' };
    }
    else if (hour < 17) {
        return { vibe: 'afternoon', warmth: 0.35, energy: 0.7, label: 'afternoon' };
    }
    else if (hour < 20) {
        return { vibe: 'golden-hour', warmth: 0.75, energy: 0.8, label: 'golden hour' };
    }
    else {
        return { vibe: 'evening', warmth: 0.8, energy: occupancy > 5 ? 0.9 : 0.6, label: 'evening' };
    }
}
