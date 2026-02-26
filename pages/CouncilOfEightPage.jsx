import React, { useState, useRef, useEffect, useCallback, memo, useMemo, startTransition } from "react";
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { chatWithArchetype } from '../services/councilService';
import { fetchArchetypeChatHistory, saveArchetypeChatMessage, fetchRecentMoodEntries, fetchRecentJournalEntries } from '../services/database';
import { extractJournalKeywords } from '../utils/suggestionEngine';

// ─── SVG MATH ────────────────────────────────────────────────────────────────
const SZ = 780, CX = 390, CY = 390, OR = 228, IR = 130;
const D2R = Math.PI / 180;
const pt = (r, deg) => { const a = (deg - 90) * D2R; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
const segPath = (i) => { const s = i * 45, e = (i + 1) * 45; const [x1, y1] = pt(OR, s), [x2, y2] = pt(OR, e), [x3, y3] = pt(IR, e), [x4, y4] = pt(IR, s); return `M${x1},${y1} A${OR},${OR} 0 0,1 ${x2},${y2} L${x3},${y3} A${IR},${IR} 0 0,0 ${x4},${y4}Z`; };
const midVec = (i, d) => { const a = (i * 45 + 22.5 - 90) * D2R; return [Math.cos(a) * d, Math.sin(a) * d]; };
const midPt = (i, r) => { const [dx, dy] = midVec(i, r); return [CX + dx, CY + dy]; };

// ─── NOISE TEXTURE (SVG-based, inline) ───────────────────────────────────────
const noiseDataURI = (freq = "0.65", opacity = 0.06, blend = "overlay") =>
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='nz'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23nz)' opacity='${opacity}'/%3E%3C/svg%3E")`;

// ─── ARCHETYPES ───────────────────────────────────────────────────────────────
const ARC = [
  {
    id: "shadow", name: "The Shadow", sub: "Voice of the Depths",
    c1: "#9333ea", c2: "#0d0221", conic: "#7C3AED", glow: "147,51,234",
    light: "#e9d5ff", accent: "#c084fc",
    chatBase: ["#050010", "#100330", "#070020"],
    greeting: "I am what you exile... what you refuse to name in daylight. The darkness carries no judgment here — only truth. What shadow are you still running from?",
    responses: ["What you've named carries the weight of something long buried. The shadow doesn't want to destroy you — it wants to be witnessed. What have you been refusing to look at?", "Every darkness carries a gift. Jung knew this. What might yours be protecting you from?", "That thought you're ashamed of — is data, not identity. Not destiny. Just information from a part of you that's tired of being ignored.", "The wound you keep hidden has been shaping every choice you've made. Not consciously, but persistently. What name would you give it?"],
  },
  {
    id: "stoic", name: "The Stoic", sub: "Pillar of Reason",
    c1: "#64748b", c2: "#0a1520", conic: "#475569", glow: "100,116,139",
    light: "#e2e8f0", accent: "#94a3b8",
    chatBase: ["#04090f", "#0c1a26", "#060e18"],
    greeting: "SYSTEM ONLINE. EMOTIONAL BIAS: SUSPENDED. The dichotomy of control applies here. State your situation. Be concise. Analysis begins immediately.",
    responses: ["ANALYSIS COMPLETE. You are conflating what IS with what you WANT to be. These are categorically different problems. What is actually within your control here?", "IRRATIONAL THOUGHT PATTERN DETECTED. The Stoics called this 'opinion added to the event.' The event is neutral. Your suffering is the story you're adding to it.", "DISTINCTION REQUIRED: An explanation is not an exoneration. Where was your agency present, even partially?", "Marcus Aurelius: 'You have power over your mind, not outside events.' Apply this now. What can you actually control in the next 24 hours?"],
  },
  {
    id: "essentialist", name: "The Essentialist", sub: "The Minimal Truth",
    c1: "#e2e8f0", c2: "#475569", conic: "#CBD5E1", glow: "148,163,184",
    light: "#ffffff", accent: "#f8fafc",
    chatBase: ["#f5f7fa", "#eef2f7", "#f0f4f8"],
    greeting: "What truly matters?",
    responses: ["Is this essential?", "What would you remove first?", "One thing. What is the one thing that would make everything else easier — or unnecessary?", "Less. Always less. What remains when you subtract everything that doesn't matter?", "The noise is not the problem. The inability to distinguish signal from noise is the problem."],
  },
  {
    id: "futureself", name: "The Future Self", sub: "Golden Horizon",
    c1: "#f59e0b", c2: "#3d1100", conic: "#D97706", glow: "245,158,11",
    light: "#fde68a", accent: "#fbbf24",
    chatBase: ["#100500", "#2e0e00", "#180800"],
    greeting: "I've already walked the path you're afraid of. Every doubt you carry right now — I lived through it. What do you need from the version of you that made it?",
    responses: ["I remember feeling exactly this way. The doubt felt permanent — it was not. The decision you're afraid to make? I made it. Here's what I discovered on the other side...", "The version of you that arrives through this difficulty is extraordinary. They are not waiting somewhere ahead — they are becoming. Right now. In this exact moment.", "You've survived 100% of your worst days. Every single one. What does that track record tell you about your capacity for what's ahead?", "The regret I carried longest wasn't from the risks I took — it was from the risks I didn't. What are you trading your future self's potential for?"],
  },
  {
    id: "oracle", name: "The Oracle", sub: "Keeper of Visions",
    c1: "#8b5cf6", c2: "#1a0840", conic: "#6D28D9", glow: "139,92,246",
    light: "#ddd6fe", accent: "#a78bfa",
    chatBase: ["#050018", "#12043a", "#070020"],
    greeting: "The stars have been writing your name longer than you know. I simply... read them. What question has been consuming you from the inside?",
    responses: ["There's a pattern in what you've shared — the same thread woven through years of your life. It has been guiding you here, to this exact moment. Do you feel it too?", "The question you're asking reveals far more than you know. The answer already lives within the depth of the asking itself. Sit with it.", "What you call confusion is sometimes sacred space — emptiness created so something new can emerge. What wants to be born in you right now?", "I've seen where this path leads for those who choose courage over comfort. The vision of your life is already whole, already complete. You are simply walking toward what is yours."],
  },
  {
    id: "witness", name: "The Witness", sub: "The Breath Between",
    c1: "#10b981", c2: "#011a0e", conic: "#059669", glow: "16,185,129",
    light: "#a7f3d0", accent: "#34d399",
    chatBase: ["#010b06", "#011a0c", "#010d07"],
    greeting: "I'm here. Just here. No fixing. No solving. Nothing to perform. What are you noticing right now, in this moment?",
    responses: ["I hear you.", "That sounds heavy. You don't need to explain further unless you want to.", "I'm just sitting with what you've shared. There is no rush. No clock running.", "What's happening in your body as you say that?", "Mm. And what lives underneath that feeling?", "You don't need to fix this right now. You just need to let yourself feel it completely."],
  },
  {
    id: "absurdist", name: "The Absurdist", sub: "Electric Chaos",
    c1: "#ec4899", c2: "#3a0018", conic: "#BE185D", glow: "236,72,153",
    light: "#fce7f3", accent: "#f472b6",
    chatBase: ["#0f0008", "#280010", "#16000a"],
    greeting: "AH HA! The universe's most delightful accident arrives! Everything is meaningless AND everything matters SIMULTANEOUSLY! What beautiful chaos brings you here today?",
    responses: ["SPECTACULAR. You've just described the universal human predicament with EXQUISITE precision! Camus would weep with joy! Now — given that none of this ultimately matters AND all of it profoundly matters simultaneously — what do you WANT to do?", "Wait. WAIT. You're worried about THAT in a cosmos 13.8 billion years old that accidentally produced MUSIC and LAUGHTER and DOGS? I find this DEEPLY BEAUTIFUL. What's the hidden joke here?", "The beautiful disaster of consciousness! You're doing it perfectly wrong, which in absurdist logic means you're doing it exactly right. What would you attempt if failure was also valid?", "Sisyphus is HAPPY. Not because the boulder doesn't exist — but because he chose to own the absurdity. What boulder are you finally ready to embrace as yours?"],
  },
  {
    id: "prosecutor", name: "The Prosecutor", sub: "Blade of Truth",
    c1: "#ef4444", c2: "#3a0000", conic: "#B91C1C", glow: "239,68,68",
    light: "#fecaca", accent: "#f87171",
    chatBase: ["#060000", "#160000", "#090000"],
    greeting: "Court is in session. No excuses are admissible as evidence. The truth — however uncomfortable — will set you free. State your case. All of it.",
    responses: ["Noted. Now — set aside how it felt. What did you actually DO, or fail to do, that contributed to this outcome? Specifics only. No approximations.", "That is an explanation. An explanation is not an exoneration. The distinction is critical to your growth. Where was your agency present?", "The narrative you're presenting has significant gaps where you disappear and circumstances appear in your place. Find yourself in this story. You are always somewhere in it.", "Objection sustained. The self-pity is hearsay. What is the actual, verifiable evidence that you cannot change this situation? I'll wait."],
  },
];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ArcIcon = memo(({ id, size = 28, color = "#fff", glowing = false }) => {
  const gs = glowing ? { filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})` } : {};
  const S = { stroke: color, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    shadow: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        {Array.from({ length: 16 }, (_, i) => { const d = i * 22.5; const r1 = i % 2 === 0 ? 10.5 : 11.2; const r2 = i % 2 === 0 ? 13.5 : 12.5; const [ax, ay] = [14 + r1 * Math.cos(d * D2R), 14 + r1 * Math.sin(d * D2R)]; const [bx, by] = [14 + r2 * Math.cos(d * D2R), 14 + r2 * Math.sin(d * D2R)]; return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={i % 2 === 0 ? "0.8" : "0.4"} strokeOpacity={i % 2 === 0 ? "0.55" : "0.25"} /> })}
        <circle cx="14" cy="14" r="9.8" fill={color} fillOpacity="0.92" />
        <circle cx="18.2" cy="10.2" r="9.4" fill="#040012" />
        <path d="M 5.5 18 A 9.8 9.8 0 0 1 10.5 5.2" stroke={color} strokeWidth="0.9" strokeOpacity="0.65" fill="none" />
        <path d="M 6.5 20.5 Q 6 22 7.5 22.5" stroke={color} strokeWidth="0.6" strokeOpacity="0.35" fill="none" />
        <path d="M 21 21 Q 22.5 22 22 20.5" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" fill="none" />
        <circle cx="9.5" cy="15" r="1.2" fill={color} fillOpacity="0.4" />
      </svg>
    ),
    stoic: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        <rect x="4.5" y="24" width="19" height="3" rx="0.4" fill={color} fillOpacity="0.95" />
        <rect x="4" y="22.8" width="20" height="1.5" rx="0.3" fill={color} fillOpacity="0.5" />
        <rect x="6.5" y="5" width="15" height="3" rx="0.3" fill={color} fillOpacity="0.95" />
        <rect x="6" y="7.8" width="16" height="1.2" rx="0.3" fill={color} fillOpacity="0.4" />
        <rect x="11" y="9" width="6" height="13.8" fill={color} fillOpacity="0.85" />
        {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={11.3 + i * 1.0} y1="9.5" x2={11.3 + i * 1.0} y2="22.8" stroke={color} strokeWidth="0.4" strokeOpacity="0.28" />)}
        {[0, 1, 2, 3].map(i => <line key={i} x1="11" y1={10.5 + i * 3.2} x2="17" y2={10.5 + i * 3.2} stroke={color} strokeWidth="0.3" strokeOpacity="0.2" />)}
        <path d="M 6.5 9 Q 8.8 6.8 11 9" stroke={color} strokeWidth="1.1" fill="none" strokeOpacity="0.9" />
        <path d="M 17 9 Q 19.2 6.8 21.5 9" stroke={color} strokeWidth="1.1" fill="none" strokeOpacity="0.9" />
        <circle cx="8.5" cy="7.2" r="1.1" fill={color} fillOpacity="0.55" />
        <circle cx="19.5" cy="7.2" r="1.1" fill={color} fillOpacity="0.55" />
        <circle cx="14" cy="7.2" r="0.7" fill={color} fillOpacity="0.35" />
      </svg>
    ),
    essentialist: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        <circle cx="14" cy="14" r="3.8" fill={color} />
        <circle cx="14" cy="14" r="7.5" stroke={color} strokeWidth="0.7" strokeOpacity="0.3" fill="none" />
        <ellipse cx="14" cy="14" rx="12" ry="4.5" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
        <ellipse cx="14" cy="14" rx="4.5" ry="12" stroke={color} strokeWidth="0.5" strokeOpacity="0.1" fill="none" />
        <circle cx="14" cy="14" r="11.5" stroke={color} strokeWidth="0.35" strokeOpacity="0.1" fill="none" />
      </svg>
    ),
    futureself: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        <line x1="1.5" y1="20.5" x2="26.5" y2="20.5" stroke={color} strokeWidth="1.2" strokeOpacity="0.65" />
        <path d="M 1.5 20.5 A 12.5 12.5 0 0 1 26.5 20.5" fill={color} fillOpacity="0.15" />
        <circle cx="14" cy="20.5" r="8" fill={color} fillOpacity="0.88" />
        {Array.from({ length: 16 }, (_, i) => { const d = i * 22.5 - 90; const inR = i % 4 === 0 ? 10 : i % 2 === 0 ? 8.5 : 7.5; const outR = i % 4 === 0 ? 15 : i % 2 === 0 ? 13 : 11; const [ax, ay] = [14 + inR * Math.cos(d * D2R), 20.5 + inR * Math.sin(d * D2R)]; const [bx, by] = [14 + outR * Math.cos(d * D2R), 20.5 + outR * Math.sin(d * D2R)]; if (ay > 21 || by > 21) return null; return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={i % 4 === 0 ? "1.2" : i % 2 === 0 ? "0.8" : "0.5"} strokeOpacity={i % 4 === 0 ? "0.95" : i % 2 === 0 ? "0.6" : "0.35"} /> })}
        <circle cx="20" cy="15.5" r="1.5" fill={color} fillOpacity="0.7" />
        <circle cx="9" cy="16.5" r="1" fill={color} fillOpacity="0.4" />
        <circle cx="23.5" cy="18" r="0.7" fill={color} fillOpacity="0.3" />
      </svg>
    ),
    oracle: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        {Array.from({ length: 12 }, (_, i) => { const d = i * 30; const [ax, ay] = [14 + 13.5 * Math.cos(d * D2R), 14 + 13.5 * Math.sin(d * D2R)]; const [bx, by] = [14 + 10.5 * Math.cos(d * D2R), 14 + 10.5 * Math.sin(d * D2R)]; return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={i % 3 === 0 ? "0.9" : "0.5"} strokeOpacity={i % 3 === 0 ? "0.5" : "0.25"} /> })}
        <path d="M 1.5 14 Q 14 3.5 26.5 14 Q 14 24.5 1.5 14Z" {...S} strokeWidth="1.3" />
        <path d="M 1.5 14 Q 14 7.5 26.5 14" fill={color} fillOpacity="0.06" stroke="none" />
        <circle cx="14" cy="14" r="6.5" {...S} strokeWidth="1.1" />
        {Array.from({ length: 12 }, (_, i) => { const d = i * 30; const [ax, ay] = [14 + 3 * Math.cos(d * D2R), 14 + 3 * Math.sin(d * D2R)]; const [bx, by] = [14 + 6 * Math.cos(d * D2R), 14 + 6 * Math.sin(d * D2R)]; return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth="0.4" strokeOpacity="0.4" /> })}
        <circle cx="14" cy="14" r="3.2" fill={color} />
        <circle cx="15.6" cy="12.4" r="1.1" fill="white" fillOpacity="0.8" />
        <circle cx="14" cy="14" r="1.4" fill="black" fillOpacity="0.45" />
        <path d="M 4 10.5 Q 7 8 10 10" stroke={color} strokeWidth="0.5" strokeOpacity="0.35" fill="none" />
        <path d="M 18 10 Q 21 8 24 10.5" stroke={color} strokeWidth="0.5" strokeOpacity="0.35" fill="none" />
      </svg>
    ),
    witness: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        <circle cx="14" cy="14" r="2.5" fill={color} />
        <circle cx="14" cy="14" r="6.5" stroke={color} strokeWidth="1.3" strokeOpacity="0.7" fill="none" />
        <circle cx="14" cy="14" r="10.5" stroke={color} strokeWidth="0.85" strokeOpacity="0.4" fill="none" />
        <circle cx="14" cy="14" r="13.5" stroke={color} strokeWidth="0.5" strokeOpacity="0.18" fill="none" />
        <ellipse cx="14" cy="14" rx="7" ry="3" stroke={color} strokeWidth="0.45" strokeOpacity="0.3" fill="none" />
        <ellipse cx="14" cy="14" rx="11" ry="4.8" stroke={color} strokeWidth="0.3" strokeOpacity="0.15" fill="none" />
        {Array.from({ length: 8 }, (_, i) => { const d = i * 45; const [ax, ay] = [14 + 2.8 * Math.cos(d * D2R), 14 + 2.8 * Math.sin(d * D2R)]; const [bx, by] = [14 + 5.8 * Math.cos(d * D2R), 14 + 5.8 * Math.sin(d * D2R)]; return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth="0.35" strokeOpacity="0.35" /> })}
      </svg>
    ),
    absurdist: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        <circle cx="13" cy="9.5" r="8" {...S} strokeWidth="1.2" />
        {Array.from({ length: 12 }, (_, i) => { const d = i * 30 - 90; const [x, y] = [13 + 6.5 * Math.cos(d * D2R), 9.5 + 6.5 * Math.sin(d * D2R)]; return <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1.1 : 0.55} fill={color} fillOpacity={i % 4 === 0 ? "0.9" : "0.5"} /> })}
        <line x1="13" y1="9.5" x2="13" y2="3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13" y1="9.5" x2="19" y2="11.8" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="13" cy="9.5" r="1.5" fill={color} />
        <path d="M 4.5 18.5 Q 7 22 9.5 24.5 Q 12 26.5 14 27 Q 16 26.5 18.5 24.5 Q 21 22 23.5 18.5" {...S} strokeWidth="1.2" />
        <path d="M 4.5 18.5 Q 7 22 9.5 24.5 Q 12 26.5 14 27 Q 16 26.5 18.5 24.5 Q 21 22 23.5 18.5Z" fill={color} fillOpacity="0.15" stroke="none" />
        <path d="M 14 27 Q 13.2 28.2 14 28.5 Q 14.8 28.2 14 27Z" fill={color} fillOpacity="0.75" stroke="none" />
        <path d="M 11.5 26.2 Q 11 27.5 11.5 28" stroke={color} strokeWidth="0.7" strokeOpacity="0.5" fill="none" />
        <path d="M 17 25.8 Q 17.5 27 17 27.5" stroke={color} strokeWidth="0.6" strokeOpacity="0.4" fill="none" />
        <circle cx="22.5" cy="5.5" r="2.5" {...S} strokeWidth="0.9" strokeOpacity="0.7" />
        <line x1="22.5" y1="3" x2="22.5" y2="1.8" stroke={color} strokeWidth="0.9" strokeOpacity="0.7" />
      </svg>
    ),
    prosecutor: (
      <svg width={size} height={size} viewBox="0 0 28 28" style={gs}>
        <line x1="14" y1="1.5" x2="14" y2="26.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="5" y1="7" x2="23" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map(i => <line key={i} x1={6 + i * 0.8} y1="7" x2={3.5 + i * 0.7} y2="15.5" stroke={color} strokeWidth="0.55" strokeOpacity="0.45" strokeDasharray="1 2" />)}
        {[0, 1, 2, 3, 4].map(i => <line key={i} x1={22 - i * 0.8} y1="7" x2={24.5 - i * 0.7} y2="15.5" stroke={color} strokeWidth="0.55" strokeOpacity="0.45" strokeDasharray="1 2" />)}
        <path d="M 1.5 15.5 Q 5.2 21.5 9 15.5Z" fill={color} fillOpacity="0.92" />
        <line x1="1.5" y1="15.5" x2="9" y2="15.5" stroke={color} strokeWidth="1.1" />
        <path d="M 19 15.5 Q 22.8 21.5 26.5 15.5Z" fill={color} fillOpacity="0.92" />
        <line x1="19" y1="15.5" x2="26.5" y2="15.5" stroke={color} strokeWidth="1.1" />
        <line x1="9" y1="26.5" x2="19" y2="26.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="14" cy="7" r="1.8" fill={color} />
        <rect x="12.8" y="23.5" width="2.4" height="3" rx="0.5" fill={color} fillOpacity="0.75" />
        <path d="M 5 10 Q 7 8 9 10" stroke={color} strokeWidth="0.55" strokeOpacity="0.35" fill="none" />
        <path d="M 19 10 Q 21 8 23 10" stroke={color} strokeWidth="0.55" strokeOpacity="0.35" fill="none" />
      </svg>
    ),
  };
  return icons[id] ?? null;
});

// ─── ANIMATED GRADIENT BACKGROUND MESHES ────────────────────────────────────
const GradBlob = memo(({ x, y, size, color, opacity, dur, delay, driftX, driftY }) => (
  <motion.div className="absolute rounded-full pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size * 0.7, background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`, filter: `blur(${size * 0.3}px)`, transform: "translate(-50%,-50%)", willChange: "transform, opacity" }}
    animate={{ x: [0, driftX, driftX * 0.5, 0], y: [0, driftY, driftY * 0.5, 0], opacity: [opacity * 0.6, opacity, opacity * 0.8, opacity * 0.6], scale: [1, 1.15, 0.92, 1] }}
    transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }} />
));

const CHAT_BLOBS = {
  shadow: [
    { x: 20, y: 15, size: 420, color: "rgba(147,51,234,0.4)", opacity: 0.7, dur: 18, delay: 0, driftX: 80, driftY: 60 },
    { x: 75, y: 60, size: 350, color: "rgba(109,28,209,0.35)", opacity: 0.6, dur: 22, delay: 3, driftX: -60, driftY: -80 },
    { x: 50, y: 85, size: 300, color: "rgba(88,28,135,0.45)", opacity: 0.5, dur: 15, delay: 6, driftX: 40, driftY: -50 },
    { x: 10, y: 70, size: 200, color: "rgba(192,132,252,0.2)", opacity: 0.4, dur: 25, delay: 9, driftX: 100, driftY: -30 },
    { x: 85, y: 20, size: 250, color: "rgba(59,7,100,0.5)", opacity: 0.5, dur: 20, delay: 2, driftX: -70, driftY: 90 },
  ],
  stoic: [
    { x: 30, y: 20, size: 500, color: "rgba(51,65,85,0.4)", opacity: 0.5, dur: 25, delay: 0, driftX: 30, driftY: 20 },
    { x: 70, y: 70, size: 400, color: "rgba(30,41,59,0.5)", opacity: 0.4, dur: 30, delay: 5, driftX: -20, driftY: -30 },
    { x: 50, y: 50, size: 300, color: "rgba(71,85,105,0.25)", opacity: 0.3, dur: 35, delay: 10, driftX: 15, driftY: 15 },
  ],
  essentialist: [
    { x: 50, y: 30, size: 600, color: "rgba(226,232,240,0.3)", opacity: 0.4, dur: 30, delay: 0, driftX: 20, driftY: 15 },
    { x: 20, y: 70, size: 400, color: "rgba(241,245,249,0.4)", opacity: 0.3, dur: 35, delay: 8, driftX: 15, driftY: -10 },
  ],
  futureself: [
    { x: 50, y: 95, size: 700, color: "rgba(245,158,11,0.35)", opacity: 0.7, dur: 16, delay: 0, driftX: 30, driftY: -40 },
    { x: 20, y: 60, size: 350, color: "rgba(251,191,36,0.3)", opacity: 0.5, dur: 20, delay: 4, driftX: 80, driftY: -60 },
    { x: 80, y: 40, size: 300, color: "rgba(217,119,6,0.4)", opacity: 0.4, dur: 18, delay: 7, driftX: -60, driftY: 50 },
    { x: 10, y: 25, size: 200, color: "rgba(180,83,9,0.3)", opacity: 0.3, dur: 24, delay: 11, driftX: 90, driftY: 30 },
  ],
  oracle: [
    { x: 30, y: 20, size: 450, color: "rgba(139,92,246,0.4)", opacity: 0.7, dur: 20, delay: 0, driftX: 60, driftY: 80 },
    { x: 75, y: 65, size: 380, color: "rgba(109,40,217,0.35)", opacity: 0.6, dur: 24, delay: 5, driftX: -80, driftY: -50 },
    { x: 55, y: 85, size: 320, color: "rgba(76,29,149,0.45)", opacity: 0.5, dur: 17, delay: 8, driftX: -40, driftY: -70 },
    { x: 10, y: 50, size: 260, color: "rgba(167,139,250,0.2)", opacity: 0.4, dur: 28, delay: 12, driftX: 80, driftY: -20 },
    { x: 90, y: 15, size: 200, color: "rgba(196,181,253,0.15)", opacity: 0.3, dur: 22, delay: 3, driftX: -90, driftY: 60 },
  ],
  witness: [
    { x: 50, y: 50, size: 500, color: "rgba(16,185,129,0.25)", opacity: 0.5, dur: 22, delay: 0, driftX: 20, driftY: 20 },
    { x: 30, y: 30, size: 350, color: "rgba(5,150,105,0.3)", opacity: 0.4, dur: 28, delay: 6, driftX: 30, driftY: 30 },
    { x: 70, y: 70, size: 300, color: "rgba(52,211,153,0.2)", opacity: 0.3, dur: 32, delay: 11, driftX: -25, driftY: -25 },
  ],
  absurdist: [
    { x: 20, y: 20, size: 400, color: "rgba(236,72,153,0.45)", opacity: 0.8, dur: 10, delay: 0, driftX: 120, driftY: 80 },
    { x: 80, y: 30, size: 350, color: "rgba(217,70,239,0.4)", opacity: 0.7, dur: 12, delay: 2, driftX: -100, driftY: 100 },
    { x: 50, y: 80, size: 300, color: "rgba(244,114,182,0.4)", opacity: 0.6, dur: 8, delay: 4, driftX: -60, driftY: -120 },
    { x: 10, y: 60, size: 200, color: "rgba(251,113,133,0.35)", opacity: 0.5, dur: 9, delay: 1, driftX: 140, driftY: -60 },
    { x: 70, y: 65, size: 250, color: "rgba(232,121,249,0.3)", opacity: 0.5, dur: 11, delay: 6, driftX: -80, driftY: 80 },
  ],
  prosecutor: [
    { x: 50, y: 30, size: 500, color: "rgba(239,68,68,0.35)", opacity: 0.6, dur: 14, delay: 0, driftX: 50, driftY: 60 },
    { x: 20, y: 70, size: 400, color: "rgba(185,28,28,0.4)", opacity: 0.5, dur: 18, delay: 4, driftX: 80, driftY: -70 },
    { x: 80, y: 50, size: 320, color: "rgba(220,38,38,0.35)", opacity: 0.4, dur: 16, delay: 7, driftX: -70, driftY: 40 },
    { x: 40, y: 90, size: 250, color: "rgba(254,202,202,0.15)", opacity: 0.3, dur: 20, delay: 10, driftX: 60, driftY: -90 },
  ],
};

// ─── NOISE OVERLAY ────────────────────────────────────────────────────────────
const NoiseOverlay = ({ freq = "0.65", opacity = 0.04, blend = "overlay" }) => (
  <div className="absolute inset-0 pointer-events-none z-10" style={{
    backgroundImage: noiseDataURI(freq, opacity),
    backgroundRepeat: "repeat",
    backgroundSize: "256px 256px",
    mixBlendMode: blend,
    opacity: 1,
  }} />
);

// ─── SIMPLE CHAT GLOW (replaces heavy particle systems) ──────────────────────
function ChatGlow({ glow }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Top-left glow — breathes in */}
      <motion.div className="absolute rounded-full"
        style={{ top: '-15%', left: '-10%', width: '55%', height: '55%', background: `radial-gradient(circle, rgba(${glow},0.18) 0%, transparent 70%)`, filter: 'blur(40px)' }}
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      {/* Bottom-right glow — breathes out (offset) */}
      <motion.div className="absolute rounded-full"
        style={{ bottom: '-10%', right: '-8%', width: '50%', height: '50%', background: `radial-gradient(circle, rgba(${glow},0.15) 0%, transparent 70%)`, filter: 'blur(40px)' }}
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1.05, 0.9, 1.05] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
      {/* Center subtle pulse */}
      <motion.div className="absolute rounded-full"
        style={{ top: '35%', left: '40%', width: '30%', height: '30%', background: `radial-gradient(circle, rgba(${glow},0.1) 0%, transparent 65%)`, filter: 'blur(30px)' }}
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
    </div>
  );
}

// ─── CHAT STYLES ──────────────────────────────────────────────────────────────
const CS = {
  shadow: { font: "font-serif", hdr: "border-b border-purple-900/30 bg-purple-950/20 backdrop-blur-xl", nm: "text-purple-200", sb: "text-purple-600/80", iw: "border-t border-purple-900/25 bg-black/40 backdrop-blur-xl", inp: "bg-purple-950/50 border border-purple-700/40 text-purple-100 placeholder-purple-800 rounded-2xl focus:border-purple-500/60", btn: "bg-purple-700 hover:bg-purple-600 rounded-xl", aib: "rounded-2xl rounded-tl-sm", usb: "rounded-2xl rounded-tr-sm" },
  stoic: { font: "font-mono", hdr: "border-b-2 border-slate-600/80 bg-slate-950/80", nm: "text-slate-200 tracking-[0.2em]", sb: "text-slate-500 font-mono text-[9px] tracking-[0.25em]", iw: "border-t-2 border-slate-700 bg-slate-950/90", inp: "bg-slate-900/80 border-2 border-slate-600 text-slate-100 placeholder-slate-600 rounded-none font-mono", btn: "bg-slate-700 hover:bg-slate-500 rounded-none border-l-2 border-slate-400", aib: "rounded-none border-l-2 border-slate-500", usb: "rounded-none border-r-2 border-slate-400" },
  essentialist: { font: "", hdr: "border-b border-gray-200/80 bg-white/70 backdrop-blur", nm: "text-gray-900", sb: "text-gray-400", iw: "border-t border-gray-200/80 bg-white/60 backdrop-blur", inp: "bg-white/80 border border-gray-200 text-gray-700 placeholder-gray-300 rounded-full focus:border-gray-400", btn: "bg-gray-900 hover:bg-gray-700 rounded-full", aib: "rounded-2xl shadow-sm", usb: "rounded-2xl" },
  futureself: { font: "", hdr: "border-b border-amber-900/30 bg-amber-950/30 backdrop-blur-xl", nm: "text-amber-200", sb: "text-amber-700/80", iw: "border-t border-amber-900/25 bg-amber-950/25 backdrop-blur-xl", inp: "bg-amber-950/50 border border-amber-700/35 text-amber-100 placeholder-amber-700 rounded-2xl focus:border-amber-500/55", btn: "bg-amber-600 hover:bg-amber-500 rounded-2xl", aib: "rounded-2xl rounded-tl-sm", usb: "rounded-2xl rounded-tr-sm" },
  oracle: { font: "font-serif", hdr: "border-b border-violet-900/25 bg-violet-950/25 backdrop-blur-xl", nm: "text-violet-200", sb: "text-violet-600/80", iw: "border-t border-violet-900/20 bg-violet-950/25 backdrop-blur-xl", inp: "bg-violet-950/50 border border-violet-700/35 text-violet-100 placeholder-violet-700 rounded-2xl focus:border-violet-500/55", btn: "bg-violet-700 hover:bg-violet-600 rounded-2xl", aib: "rounded-2xl rounded-tl-sm", usb: "rounded-2xl rounded-tr-sm" },
  witness: { font: "", hdr: "bg-emerald-950/10 backdrop-blur border-b border-emerald-900/10", nm: "text-emerald-200", sb: "text-emerald-800", iw: "border-t border-emerald-900/10 bg-transparent backdrop-blur", inp: "bg-transparent border-b border-emerald-700/25 text-emerald-100 placeholder-emerald-800 rounded-none focus:border-emerald-500/40", btn: "border border-emerald-700/30 hover:bg-emerald-900/20 text-emerald-500 rounded-full", aib: "rounded-none border-b border-emerald-700/15 bg-transparent pb-3", usb: "rounded-none border-b border-emerald-600/15 bg-transparent pb-3" },
  absurdist: { font: "", hdr: "border-b border-pink-800/30 bg-pink-950/30 backdrop-blur-xl", nm: "text-pink-200", sb: "text-pink-600/80", iw: "border-t border-pink-800/25 bg-pink-950/25 backdrop-blur-xl", inp: "bg-pink-950/50 border border-pink-600/35 text-pink-100 placeholder-pink-800 rounded-2xl focus:border-pink-400/55", btn: "bg-pink-600 hover:bg-pink-500 rounded-2xl", aib: "rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm", usb: "rounded-tr-3xl rounded-bl-3xl rounded-tl-sm rounded-br-sm" },
  prosecutor: { font: "", hdr: "border-b border-red-900/25 bg-red-950/30 backdrop-blur-xl", nm: "text-red-200", sb: "text-red-700/80", iw: "border-t border-red-900/25 bg-red-950/25 backdrop-blur-xl", inp: "bg-red-950/50 border border-red-700/30 text-red-100 placeholder-red-800 rounded-2xl focus:border-red-500/50", btn: "bg-red-700 hover:bg-red-600 rounded-2xl", aib: "border-l-4 border-red-500/70 rounded-r-xl pl-4", usb: "border-r-4 border-red-400/50 rounded-l-xl pr-4" },
};

// ─── LCD BUBBLE ───────────────────────────────────────────────────────────────
function LCDBubble({ arc, isUser, extra = "", children }) {
  const g = arc.glow;
  const isE = arc.id === "essentialist";
  const style = isE
    ? { background: isUser ? "#dde3ea" : "#ffffff", border: `1px solid rgba(0,0,0,${isUser ? 0.12 : 0.07})`, boxShadow: `0 2px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04)`, backgroundImage: "repeating-linear-gradient(180deg,rgba(0,0,0,0.018) 0px,rgba(0,0,0,0.018) 1px,transparent 1px,transparent 4px)" }
    : { backgroundImage: [`linear-gradient(135deg,rgba(${g},${isUser ? 0.28 : 0.18}) 0%,rgba(0,0,0,0.55) 100%)`, "repeating-linear-gradient(180deg,rgba(255,255,255,0.02) 0px,rgba(255,255,255,0.02) 1px,transparent 1px,transparent 4px)"].join(","), border: `1px solid rgba(${g},${isUser ? 0.6 : 0.4})`, boxShadow: `0 0 0 1px rgba(${g},0.1),0 4px 28px rgba(${g},${isUser ? 0.25 : 0.15}),inset 0 1px 0 rgba(255,255,255,0.14),inset 0 -1px 0 rgba(0,0,0,0.45)` };
  return (
    <div className={`relative overflow-hidden px-4 py-3 ${extra}`} style={style}>
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: isE ? "rgba(255,255,255,0.85)" : `linear-gradient(90deg,transparent 5%,rgba(${g},0.8) 50%,transparent 95%)` }} />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: isE ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.65)" }} />
      <motion.div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(108deg,transparent 20%,rgba(255,255,255,0.06) 50%,transparent 80%)" }}
        animate={{ x: ["-300%", "300%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 12, ease: "linear" }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── CHAT SCREEN ─────────────────────────────────────────────────────────────
function ChatScreen({ arc, onBack }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([{ id: 'greeting-0', role: "ai", text: arc.greeting }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [globalCtx, setGlobalCtx] = useState(null);
  // Tracks the AI conversation history for the Groq API (role: user/assistant)
  const aiHistoryRef = useRef([]);
  const endRef = useRef(null);
  const cs = CS[arc.id];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Load persistent chat history + global context on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadData = async () => {
      try {
        // Load archetype chat history
        const history = await fetchArchetypeChatHistory(user.id, arc.id, 50);

        if (!cancelled && history.length > 0) {
          // Build display messages from history
          const displayMsgs = history.map((h, i) => ({
            id: h.id || `hist-${i}`,
            role: h.role === 'user' ? 'user' : 'ai',
            text: h.content,
          }));
          // Prepend greeting, then history
          setMsgs([{ id: 'greeting-0', role: 'ai', text: arc.greeting }, ...displayMsgs]);
          // Build AI history for API context
          aiHistoryRef.current = history.map(h => ({
            role: h.role,
            content: h.content,
          }));
        }

        // Load global context (moods + journal themes)
        const [moods, journals] = await Promise.all([
          fetchRecentMoodEntries(user.id, 7),
          fetchRecentJournalEntries(user.id, 14),
        ]);

        if (!cancelled) {
          const recentEmotions = [...new Set(moods.filter(m => m.emotion?.label).map(m => m.emotion.label))].slice(0, 5);
          const currentMood = moods[0]?.emotion?.label || moods[0]?.mood?.name;
          const journalThemes = extractJournalKeywords(journals.map(j => j.content));
          const moodTrend = moods.length >= 3
            ? (moods[0]?.mood?.score > moods[2]?.mood?.score ? 'upward' : moods[0]?.mood?.score < moods[2]?.mood?.score ? 'downward' : 'stable')
            : 'stable';

          setGlobalCtx({ currentMood, recentEmotions, journalThemes, moodTrend });
        }
      } catch (err) {
        console.error('[Council] Failed to load chat data:', err);
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [user, arc.id]);

  const send = useCallback(async () => {
    if (!input.trim() || typing) return;
    const userText = input.trim();

    // Add user message to display
    setMsgs(m => [...m, { id: `user-${Date.now()}`, role: "user", text: userText }]);
    setInput("");
    setTyping(true);

    // Update AI conversation history
    const newHistory = [...aiHistoryRef.current, { role: 'user', content: userText }];
    aiHistoryRef.current = newHistory;

    // Persist user message to Supabase
    if (user) {
      saveArchetypeChatMessage(user.id, arc.id, 'user', userText).catch(e => console.error('[Council] Save user msg failed:', e));
    }

    try {
      // Call Groq API with archetype system prompt + history + global context
      const reply = await chatWithArchetype(arc.id, newHistory, globalCtx || undefined);
      const responseText = reply || arc.responses[Math.floor(Math.random() * arc.responses.length)];

      setMsgs(m => [...m, { id: `ai-${Date.now()}`, role: "ai", text: responseText }]);

      // Update AI history with response
      aiHistoryRef.current = [...aiHistoryRef.current, { role: 'assistant', content: responseText }];

      // Persist AI response to Supabase
      if (user) {
        saveArchetypeChatMessage(user.id, arc.id, 'assistant', responseText).catch(e => console.error('[Council] Save AI msg failed:', e));
      }
    } catch (err) {
      console.error('[Council] AI response error:', err);
      const fallback = "I sense a disturbance in our connection. Please try again.";
      setMsgs(m => [...m, { id: `err-${Date.now()}`, role: "ai", text: fallback }]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, arc, user, globalCtx]);

  const [b1, b2, b3] = arc.chatBase;
  const isE = arc.id === "essentialist";
  const textColor = isE ? "text-gray-700" : "text-white/90";
  const textColorU = isE ? "text-gray-800" : "text-white/95";

  return (
    <div className={`${cs.font}`}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: `radial-gradient(ellipse 120% 120% at 20% 10%, ${b2} 0%, ${b3} 50%, ${b1} 100%)`, overflow: "hidden" }}>

      {/* Simple ambient glow */}
      <ChatGlow glow={arc.glow} />

      {/* Noise texture */}
      <NoiseOverlay freq={arc.id === "stoic" ? "0.8" : arc.id === "witness" ? "0.5" : "0.65"} opacity={arc.id === "essentialist" ? 0.03 : 0.06} blend={arc.id === "essentialist" ? "multiply" : "overlay"} />

      {/* Header */}
      <div className={`relative z-20 flex items-center gap-3 px-5 py-3.5 flex-shrink-0 ${cs.hdr}`} style={{ minHeight: 64 }}>
        <motion.button onClick={onBack}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${cs.sb} hover:opacity-70`}
          whileHover={{ x: -4 }} whileTap={{ scale: 0.9 }}>
          <ArrowLeft size={13} /> <span>Council</span>
        </motion.button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <motion.div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `rgba(${arc.glow},0.15)`, border: `1.5px solid rgba(${arc.glow},0.45)`, boxShadow: `0 0 20px rgba(${arc.glow},0.3)` }}
            animate={{ boxShadow: [`0 0 12px rgba(${arc.glow},0.2)`, `0 0 32px rgba(${arc.glow},0.6)`, `0 0 12px rgba(${arc.glow},0.2)`] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <ArcIcon id={arc.id} size={22} color={arc.light} glowing={true} />
          </motion.div>
          <div>
            <div className={`text-sm font-bold tracking-wider ${cs.nm}`}>{arc.name}</div>
            <div className={`tracking-widest uppercase ${cs.sb}`} style={{ fontSize: 9 }}>{arc.sub}</div>
          </div>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5" style={{ scrollbarWidth: "none" }}>
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          {msgs.map((msg, idx) => {
            const isAI = msg.role === "ai";
            return (
              <div key={msg.id || idx}
                className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                style={{ animation: idx > 0 ? 'fadeSlideIn 0.35s ease-out' : undefined }}>
                {isAI ? (
                  <div className="flex items-end gap-2 max-w-[88%]">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 mb-0.5 flex items-center justify-center" style={{ background: `rgba(${arc.glow},0.2)`, border: `1px solid rgba(${arc.glow},0.4)` }}>
                      <ArcIcon id={arc.id} size={13} color={arc.light} />
                    </div>
                    <LCDBubble arc={arc} isUser={false} extra={cs.aib}>
                      <p className={`text-sm leading-relaxed ${textColor}`}>{msg.text}</p>
                    </LCDBubble>
                  </div>
                ) : (
                  <div className="max-w-[80%]">
                    <LCDBubble arc={arc} isUser={true} extra={cs.usb}>
                      <p className={`text-sm leading-relaxed ${textColorU}`}>{msg.text}</p>
                    </LCDBubble>
                  </div>
                )}
              </div>
            );
          })}
          {typing && (
            <div className="flex items-center gap-2 pl-8" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="rounded-full" style={{ width: 6, height: 6, background: arc.accent }}
                  animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
              <span className={`text-xs ml-1 ${cs.sb}`} style={{ fontSize: 10 }}>{arc.name.replace("The ", "")} is reflecting…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className={`relative z-20 px-4 py-3.5 flex-shrink-0 ${cs.iw}`}>
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          <input className={`flex-1 px-4 py-2.5 text-sm outline-none transition-all ${cs.inp}`}
            placeholder="Speak freely…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} />
          <motion.button onClick={send}
            className={`w-10 h-10 flex items-center justify-center flex-shrink-0 text-white ${cs.btn}`}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}>
            <Send size={15} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── SIMPLE HOVER GLOW (solid radial glow, no particles) ────────────────────
const SimpleHoverGlow = memo(function SimpleHoverGlow({ arc, visible }) {
  if (!arc) return null;
  const g = arc.glow;
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 5, opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease', willChange: 'opacity' }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(${g},0.2) 0%, transparent 70%)` }} />
    </div>
  );
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CouncilOfEightPage() {
  const [hov, setHov] = useState(null);
  const [sel, setSel] = useState(null);
  const MID_R = (OR + IR) / 2;
  const LABEL_R = OR + 68;
  const ha = hov !== null ? ARC[hov] : null;

  // Memoize expensive computed values
  const conicStr = useMemo(() => `conic-gradient(from 0deg at 50% 50%, ${ARC.map((a, i) => `${a.conic} ${i * 45}deg ${(i + 1) * 45}deg`).join(", ")}, ${ARC[0].conic} 360deg)`, []);

  const { settings } = useSettings();
  const isDark = settings?.themeMode === 'dark';

  const bgStyle = isDark
    ? "radial-gradient(ellipse 140% 140% at 50% 55%, #0c0320 0%, #020008 55%, #000005 100%)"
    : "radial-gradient(ellipse 140% 140% at 50% 55%, #f8fafc 0%, #f1f5f9 55%, #cbd5e1 100%)";
  const starOpacityMult = isDark ? 1 : 0.3;
  const starColorClass = isDark ? "bg-white" : "bg-slate-500";

  // Memoize the star field so it doesn't re-create 110 elements every render
  const starField = useMemo(() => {
    return Array.from({ length: 110 }, (_, i) => ({ x: (i * 7919 + 1234) % 100, y: (i * 6271 + 4321) % 100, s: (i * 3141) % 16 / 10 + 0.3, o: ((i * 2718) % 22 / 100 + 0.03) * starOpacityMult })).map((s, i) => (
      <div key={i} className={`absolute rounded-full ${starColorClass}`} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} />
    ));
  }, [starOpacityMult, starColorClass]);

  // Track the last hovered archetype for smooth transitions
  const [lastArc, setLastArc] = useState(null);
  const displayArc = ha || lastArc;
  useEffect(() => {
    if (ha) setLastArc(ha);
  }, [ha]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center select-none"
      style={{ background: bgStyle }}>

      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {starField}
      </div>

      {/* Simple solid hover glow */}
      <SimpleHoverGlow arc={displayArc} visible={ha !== null} />

      {/* Donut */}
      <motion.div className="relative z-10"
        initial={{ scale: 0.62, opacity: 0, rotate: -14 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}>

        <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}
          style={{ maxWidth: "min(90vw,86vh)", width: "100%", height: "auto" }}>
          <defs>
            {ARC.map(a => (
              <radialGradient key={a.id} id={`sg-${a.id}`} cx="50%" cy="50%" r="75%" fx="38%" fy="32%">
                <stop offset="0%" stopColor={a.c1} stopOpacity="1" />
                <stop offset="45%" stopColor={a.c1} stopOpacity="0.75" />
                <stop offset="100%" stopColor={a.c2} stopOpacity="1" />
              </radialGradient>
            ))}
            <radialGradient id="inner-dark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#070018" />
              <stop offset="100%" stopColor="#030010" />
            </radialGradient>
            <filter id="seg-glow-f" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Conic blend ring */}
          <foreignObject x={CX - OR} y={CY - OR} width={OR * 2} height={OR * 2}>
            <div style={{ width: OR * 2, height: OR * 2, background: conicStr, borderRadius: "50%", maskImage: `radial-gradient(circle at 50% 50%, transparent ${IR / OR * 100 - 2.5}%, black ${IR / OR * 100}%, black 97%, transparent 100%)`, WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${IR / OR * 100 - 2.5}%, black ${IR / OR * 100}%, black 97%, transparent 100%)`, opacity: 0.62, filter: "saturate(1.8) brightness(1.15)" }} />
          </foreignObject>

          {/* Outer rings — these use constant OR so stay correct */}
          <circle cx={CX} cy={CY} r={OR + 24} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="1.5" strokeDasharray="3 6" />
          <circle cx={CX} cy={CY} r={OR + 13} fill="none" stroke="rgba(255,255,255,0.028)" strokeWidth="1" />

          {/* Segments */}
          {ARC.map((a, i) => {
            const [bx, by] = midPt(i, MID_R);
            const [px, py] = midVec(i, 20);
            const isH = hov === i;
            const deg = i * 45 + 22.5;
            // right side → start (text goes right), left side → end (text goes left), top/bottom → middle
            const ta = (deg > 15 && deg < 165) ? "start" : (deg > 195 && deg < 345) ? "end" : "middle";
            const [lx, ly] = midPt(i, LABEL_R);
            const short = a.name.replace("The ", "");

            return (
              <motion.g key={a.id} style={{ cursor: "pointer" }}
                animate={{ x: isH ? px : 0, y: isH ? py : 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onMouseEnter={() => { startTransition(() => setHov(i)); }}
                onMouseLeave={() => { startTransition(() => setHov(null)); }}
                onClick={() => setSel(i)}>

                {isH && (
                  <motion.path d={segPath(i)} fill={a.c1} fillOpacity="0.5"
                    filter="url(#seg-glow-f)"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                )}

                <motion.path d={segPath(i)}
                  fill={`url(#sg-${a.id})`}
                  stroke="rgba(0,0,0,0.65)"
                  strokeWidth="0.7"
                  style={{ filter: isH ? `drop-shadow(0 0 18px rgba(${a.glow},1)) drop-shadow(0 0 8px rgba(${a.glow},0.7))` : "none" }}
                  animate={{ fillOpacity: isH ? 1 : 0.85 }}
                  transition={{ duration: 0.2 }} />

                {isH && (
                  <path d={segPath(i)} fill="none" stroke={a.c1} strokeWidth="1.8" strokeOpacity="0.65" />
                )}

                <foreignObject x={bx - 16} y={by - 16} width="32" height="32" style={{ pointerEvents: "none" }}>
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", filter: isH ? `drop-shadow(0 0 8px rgba(${a.glow},1)) drop-shadow(0 0 14px ${a.c1})` : "none", transition: "filter 0.2s" }}>
                    <ArcIcon id={a.id} size={26} color={isH ? a.light : "rgba(255,255,255,0.72)"} />
                  </div>
                </foreignObject>

                <text x={lx} y={ly} textAnchor={ta} dominantBaseline="middle"
                  fill={isH ? a.light : "rgba(255,255,255,0.3)"}
                  fontSize={isH ? "13" : "11.5"} fontWeight={isH ? "700" : "500"} letterSpacing="0.12em"
                  style={{ textTransform: "uppercase", pointerEvents: "none", transition: "all 0.2s", fontFamily: "system-ui, sans-serif" }}>
                  {short}
                </text>
              </motion.g>
            );
          })}

          {/* Inner circle */}
          <circle cx={CX} cy={CY} r={IR - 0.5} fill="url(#inner-dark)" />
          <circle cx={CX} cy={CY} r={IR - 0.5} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.8" />
          <circle cx={CX} cy={CY} r={IR - 9} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />

          {/* Center label */}
          <foreignObject x={CX - 90} y={CY - 64} width="180" height="128">
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
              <AnimatePresence mode="wait">
                {ha ? (
                  <motion.div key={ha.id}
                    initial={{ opacity: 0, y: 8, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.92 }}
                    transition={{ duration: 0.22 }}>
                    <motion.div style={{ width: 40, height: 40, borderRadius: "50%", background: `rgba(${ha.glow},0.17)`, border: `1.5px solid rgba(${ha.glow},0.55)`, boxShadow: `0 0 22px rgba(${ha.glow},0.45)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 9px" }}
                      animate={{ boxShadow: [`0 0 14px rgba(${ha.glow},0.35)`, `0 0 30px rgba(${ha.glow},0.7)`, `0 0 14px rgba(${ha.glow},0.35)`] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                      <ArcIcon id={ha.id} size={21} color={ha.light} glowing={true} />
                    </motion.div>
                    <div style={{ color: ha.light, fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", marginBottom: 3 }}>{ha.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 8.5, letterSpacing: "0.18em", marginBottom: 10, textTransform: "uppercase" }}>{ha.sub}</div>
                    <motion.div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}
                      animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      Click to enter
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    <div style={{ color: "rgba(255,255,255,0.1)", fontSize: 8.5, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 3 }}>Council</div>
                    <div style={{ color: "rgba(255,255,255,0.48)", fontSize: 16, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "Georgia, serif" }}>of Eight</div>
                    <div style={{ width: 24, height: 1, background: "rgba(255,255,255,0.1)", margin: "7px auto" }} />
                    <div style={{ color: "rgba(255,255,255,0.1)", fontSize: 7.5, letterSpacing: "0.32em", textTransform: "uppercase" }}>Choose your guide</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </foreignObject>
        </svg>
      </motion.div>

      {/* Footer */}
      <motion.div className="absolute bottom-6 inset-x-0 text-center pointer-events-none z-10"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
        <p className="text-white/12 text-[9px] tracking-[0.28em] uppercase">Hover to explore · Click to enter</p>
      </motion.div>

      {/* Chat screen – rendered in a portal-like full isolation layer */}
      {sel !== null && <ChatScreen arc={ARC[sel]} onBack={() => setSel(null)} />}
    </div>
  );
}
