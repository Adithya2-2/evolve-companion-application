import React, { useEffect, useRef } from 'react';
import './WellnessBackgroundLight.css';

// ── Shared Helper Functions ──
const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r},${g},${b},${a})`;
const hA = (h: number, s: number, l: number, a: number) => `hsla(${h},${s}%,${l}%,${a})`;

interface Theme {
    bg: string;
    blobPos: { top?: string; bottom?: string; left?: string; right?: string }[];
    blobSizes: string[];
    blobs: string[];
    dotColor: string;
    dotGlow: string;
    ringColor: string;
    drawFn: (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, mx: number, my: number) => void;
}

const THEMES: Theme[] = [
    {
        // 0. Sakura Twilight (Light blush, soft rose, cream)
        bg: '#f8f1f4',
        blobPos: [
            { top: '-25%', left: '-15%' }, { top: '-15%', right: '-10%' },
            { bottom: '-20%', left: '-10%' }, { bottom: '-30%', right: '-20%' },
            { top: '30%', left: '35%' }
        ],
        blobSizes: ['110vw', '100vw', '130vw', '120vw', '100vw'],
        blobs: [
            rgba(242, 218, 225, 0.45), rgba(250, 235, 238, 0.50),
            rgba(235, 205, 215, 0.40), rgba(245, 222, 230, 0.45),
            rgba(255, 245, 248, 0.55)
        ],
        dotColor: '#e0c0cc',
        dotGlow: 'rgba(230, 190, 205, 0.6)',
        ringColor: 'rgba(230, 190, 205, 0.35)',
        drawFn: (ctx, W, H, t, mx, my) => {
            const grad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
            grad.addColorStop(0, rgba(248, 241, 244, 0.9));
            grad.addColorStop(1, rgba(255, 255, 255, 0));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Subtle morning mist
            const mist = [
                { y: 0.65, a: 0.08, f: 0.003, sp: 0.15, col: 'rgba(255,248,250,0.15)' },
                { y: 0.75, a: 0.10, f: 0.004, sp: -0.12, col: 'rgba(240,225,230,0.12)' }
            ];
            mist.forEach((w, i) => {
                const by = H * w.y + my * 8;
                ctx.beginPath(); ctx.moveTo(0, H);
                for (let x = 0; x <= W; x += 4) {
                    const y = by + Math.sin(x * w.f + t * w.sp + i * 2) * H * w.a;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(W, H); ctx.closePath();
                ctx.fillStyle = w.col; ctx.fill();
            });
        }
    },
    {
        // 1. Misty Forest (Soft sage, pale mint, cream)
        bg: '#eff3f0',
        blobPos: [
            { top: '-25%', left: '-15%' }, { top: '-15%', right: '-10%' },
            { bottom: '-20%', left: '-10%' }, { bottom: '-30%', right: '-20%' },
            { top: '30%', left: '35%' }
        ],
        blobSizes: ['110vw', '100vw', '130vw', '120vw', '100vw'],
        blobs: [
            rgba(215, 230, 220, 0.45), rgba(235, 245, 240, 0.50),
            rgba(200, 225, 210, 0.40), rgba(225, 235, 228, 0.45),
            rgba(245, 250, 248, 0.55)
        ],
        dotColor: '#c0d0c5',
        dotGlow: 'rgba(180, 205, 190, 0.55)',
        ringColor: 'rgba(180, 205, 190, 0.35)',
        drawFn: (ctx, W, H, t, mx, my) => {
            const hBg = ctx.createLinearGradient(0, H * 0.3, 0, H);
            hBg.addColorStop(0, 'rgba(255,255,255,0)');
            hBg.addColorStop(1, hA(135, 15, 88, 0.35));
            ctx.fillStyle = hBg; ctx.fillRect(0, 0, W, H);
        }
    },
    {
        // 2. Amber Autumn (Soft peach, warm cream, pale gold)
        bg: '#fdf7f2',
        blobPos: [
            { top: '-25%', left: '-15%' }, { top: '-15%', right: '-10%' },
            { bottom: '-20%', left: '-10%' }, { bottom: '-30%', right: '-20%' },
            { top: '30%', left: '35%' }
        ],
        blobSizes: ['110vw', '100vw', '130vw', '120vw', '100vw'],
        blobs: [
            rgba(250, 225, 205, 0.45), rgba(255, 240, 225, 0.50),
            rgba(245, 218, 195, 0.40), rgba(252, 232, 212, 0.45),
            rgba(255, 250, 245, 0.55)
        ],
        dotColor: '#e0c8b5',
        dotGlow: 'rgba(225, 190, 160, 0.55)',
        ringColor: 'rgba(225, 190, 160, 0.35)',
        drawFn: (ctx, W, H, t, mx, my) => {
            const gw = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, H * 0.7);
            gw.addColorStop(0, hA(35, 30, 92, 0.45));
            gw.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gw; ctx.fillRect(0, 0, W, H);
        }
    },
    {
        // 3. Silver Rain (Pale blue-grey, slate, white)
        bg: '#f0f3f5',
        blobPos: [
            { top: '-25%', left: '-15%' }, { top: '-15%', right: '-10%' },
            { bottom: '-20%', left: '-10%' }, { bottom: '-30%', right: '-20%' },
            { top: '30%', left: '35%' }
        ],
        blobSizes: ['110vw', '100vw', '130vw', '120vw', '100vw'],
        blobs: [
            rgba(215, 225, 232, 0.45), rgba(235, 242, 248, 0.50),
            rgba(200, 215, 225, 0.40), rgba(220, 230, 238, 0.45),
            rgba(245, 250, 252, 0.55)
        ],
        dotColor: '#c5d0db',
        dotGlow: 'rgba(180, 200, 215, 0.55)',
        ringColor: 'rgba(180, 200, 215, 0.35)',
        drawFn: (ctx, W, H, t, mx, my) => {
            const hg = ctx.createLinearGradient(0, 0, 0, H);
            hg.addColorStop(0, hA(205, 12, 85, 0.25));
            hg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
        }
    },
    {
        // 4. Lavender Dusk (Soft lilac, pale mauve, cream)
        bg: '#f4f1f6',
        blobPos: [
            { top: '-25%', left: '-15%' }, { top: '-15%', right: '-10%' },
            { bottom: '-20%', left: '-10%' }, { bottom: '-30%', right: '-20%' },
            { top: '30%', left: '35%' }
        ],
        blobSizes: ['110vw', '100vw', '130vw', '120vw', '100vw'],
        blobs: [
            rgba(230, 220, 240, 0.45), rgba(245, 240, 250, 0.50),
            rgba(220, 205, 235, 0.40), rgba(235, 225, 245, 0.45),
            rgba(250, 248, 255, 0.55)
        ],
        dotColor: '#cdbedc',
        dotGlow: 'rgba(195, 175, 215, 0.55)',
        ringColor: 'rgba(195, 175, 215, 0.35)',
        drawFn: (ctx, W, H, t, mx, my) => {
            const mist = [
                { y: 0.60, a: 0.08, f: 0.003, sp: 0.12, col: 'rgba(235,225,245,0.18)' },
                { y: 0.72, a: 0.12, f: 0.005, sp: -0.10, col: 'rgba(225,210,235,0.15)' }
            ];
            mist.forEach((w, i) => {
                const by = H * w.y + my * 10;
                ctx.beginPath(); ctx.moveTo(0, H);
                for (let x = 0; x <= W; x += 3) {
                    const y = by + Math.sin(x * w.f + t * w.sp * 1000 + i) * H * w.a;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(W, H); ctx.closePath();
                ctx.fillStyle = w.col; ctx.fill();
            });

            const haze = ctx.createLinearGradient(0, H * 0.50, 0, H * 0.72);
            haze.addColorStop(0, 'rgba(255,255,255,0)');
            haze.addColorStop(0.5, rgba(200, 185, 225, 0.12));
            haze.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H);
        }
    }
];

// Blob movement parameters
const BD = [
    { phx: 0.0, phy: 1.3, spx: 0.000072, spy: 0.000055, sA: 0.08 },
    { phx: 2.0, phy: 0.5, spx: 0.000055, spy: 0.000085, sA: 0.07 },
    { phx: 4.2, phy: 3.1, spx: 0.000085, spy: 0.000065, sA: 0.09 },
    { phx: 1.1, phy: 5.2, spx: 0.000065, spy: 0.000075, sA: 0.07 },
    { phx: 3.3, phy: 2.4, spx: 0.000078, spy: 0.000046, sA: 0.10 },
];

const HOLD = 22000;
const FADE = 3200;

// Particle Spawn Helpers for Light Mode
const getDuration = (el: HTMLDivElement, defaultDuration: number) => {
    return (parseFloat(el.style.animationDuration || String(defaultDuration)) + 1) * 1000;
};

function spawnSakura(c: HTMLDivElement) {
    const el = document.createElement('div');
    if (Math.random() < 0.65) {
        const sz = 6 + Math.random() * 16;
        const dur = 12 + Math.random() * 16;
        const anim = Math.random() < 0.55 ? 'petalFall' : 'petalDrift';
        const hue = 330 + Math.random() * 35;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.46 + 'px',
            borderRadius: '50% 50% 0 50%',
            left: Math.random() * 96 + '%', top: '-3%',
            background: `hsla(${hue},42%,72%,${0.55 + Math.random() * 0.32})`,
            filter: 'blur(0.5px)',
            animation: `${anim} ${dur}s ease-in forwards`,
            transform: `rotate(${Math.random() * 360}deg)`, opacity: '0'
        });
    } else {
        const sz = 1.5 + Math.random() * 3.5;
        const dur = 16 + Math.random() * 18;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%', top: (Math.random() * 75) + '%',
            background: `rgba(205,172,182,${0.45 + Math.random() * 0.35})`,
            animation: `driftMote ${dur}s ease-in-out forwards`, opacity: '0'
        });
    }
    c.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, getDuration(el, 14));
}

function spawnForest(c: HTMLDivElement) {
    const el = document.createElement('div');
    const r = Math.random();
    if (r < 0.45) {
        const sz = 2 + Math.random() * 5;
        const dur = 18 + Math.random() * 22;
        const hue = 100 + Math.random() * 45;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%', bottom: (Math.random() * 38) + '%',
            background: `hsla(${hue},38%,52%,${0.45 + Math.random() * 0.35})`,
            boxShadow: `0 0 ${sz * 3}px hsla(${hue},45%,48%,0.25)`,
            filter: 'blur(0.6px)',
            animation: `sporeRise ${dur}s ease-in-out forwards`, opacity: '0'
        });
    } else if (r < 0.72) {
        const sz = 7 + Math.random() * 15;
        const dur = 12 + Math.random() * 16;
        const hue = 105 + Math.random() * 35;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.52 + 'px',
            borderRadius: '50% 0 50% 0',
            left: Math.random() * 95 + '%', top: '-3%',
            background: `hsla(${hue},38%,40%,${0.35 + Math.random() * 0.30})`,
            animation: `leafSpin ${dur}s ease-in forwards`,
            transform: `rotate(${Math.random() * 360}deg)`, opacity: '0'
        });
    } else {
        const sz = 18 + Math.random() * 36;
        const dur = 20 + Math.random() * 24;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz * 0.38 + 'px',
            left: (Math.random() * 88) + '%', bottom: (Math.random() * 32) + '%',
            background: `rgba(185,200,180,${0.10 + Math.random() * 0.12})`,
            filter: 'blur(5px)',
            animation: `floatUpLight ${dur}s ease-in-out forwards`, opacity: '0'
        });
    }
    c.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, getDuration(el, 18));
}

function spawnAutumn(c: HTMLDivElement) {
    const el = document.createElement('div');
    if (Math.random() < 0.60) {
        const sz = 8 + Math.random() * 20;
        const dur = 10 + Math.random() * 16;
        const hue = 15 + Math.random() * 35;
        const sat = 45 + Math.random() * 20;
        const lit = 38 + Math.random() * 18;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.55 + 'px',
            borderRadius: '50% 0 50% 0',
            left: Math.random() * 96 + '%', top: '-3%',
            background: `hsla(${hue},${sat}%,${lit}%,${0.50 + Math.random() * 0.32})`,
            filter: 'blur(0.4px)',
            animation: `leafSpin ${dur}s ease-in forwards`,
            transform: `rotate(${Math.random() * 360}deg)`, opacity: '0'
        });
    } else {
        const sz = 2 + Math.random() * 5;
        const dur = 14 + Math.random() * 18;
        const hue = 30 + Math.random() * 25;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%', bottom: (Math.random() * 50) + '%',
            background: `hsla(${hue},55%,55%,${0.45 + Math.random() * 0.38})`,
            boxShadow: `0 0 ${sz * 3}px hsla(${hue},60%,50%,0.3)`,
            animation: `emberFloat ${dur}s ease-out forwards`, opacity: '0'
        });
    }
    c.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, getDuration(el, 14));
}

function spawnRain(c: HTMLDivElement) {
    const el = document.createElement('div');
    const r = Math.random();
    if (r < 0.48) {
        const w = 0.8, h = 10 + Math.random() * 24;
        const dur = 0.7 + Math.random() * 1.2;
        Object.assign(el.style, {
            position: 'absolute',
            width: w + 'px', height: h + 'px',
            left: (2 + Math.random() * 96) + '%', top: '-2%',
            background: 'linear-gradient(to bottom,rgba(138,162,192,0),rgba(138,162,192,0.55),rgba(138,162,192,0))',
            animation: `raindrop ${dur}s linear forwards`, opacity: '0'
        });
    } else if (r < 0.72) {
        const sz = 5 + Math.random() * 9;
        const dur = 2.2 + Math.random() * 2.8;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.32 + 'px',
            borderRadius: '50%',
            border: '1px solid rgba(115,148,182,0.40)',
            left: (5 + Math.random() * 88) + '%', top: (68 + Math.random() * 26) + '%',
            animation: `rippleOut ${dur}s ease-out forwards`, opacity: '0'
        });
    } else {
        const sz = 16 + Math.random() * 32;
        const dur = 14 + Math.random() * 18;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz * 0.38 + 'px',
            left: (Math.random() * 88) + '%', bottom: (Math.random() * 38) + '%',
            background: `rgba(168,188,212,${0.08 + Math.random() * 0.10})`,
            filter: 'blur(5px)',
            animation: `floatUpLight ${dur}s ease-in-out forwards`, opacity: '0'
        });
    }
    c.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, getDuration(el, 8));
}

function spawnDusk(c: HTMLDivElement) {
    const el = document.createElement('div');
    const r = Math.random();
    if (r < 0.45) {
        const sz = 3 + Math.random() * 5;
        const dur = 12 + Math.random() * 18;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (4 + Math.random() * 92) + '%',
            top: (30 + Math.random() * 58) + '%',
            background: `rgba(190,230,140,${0.55 + Math.random() * 0.38})`,
            boxShadow: `0 0 ${sz * 5}px rgba(175,225,120,0.55)`,
            filter: 'blur(0.6px)',
            animation: `driftMote ${dur}s ease-in-out forwards`, opacity: '0'
        });
    } else if (r < 0.72) {
        const sz = 1.5 + Math.random() * 3;
        const dur = 16 + Math.random() * 20;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%',
            top: (Math.random() * 80) + '%',
            background: `rgba(185,165,210,${0.40 + Math.random() * 0.35})`,
            animation: `driftMote ${dur}s ease-in-out forwards`, opacity: '0'
        });
    } else {
        const sz = 5 + Math.random() * 10;
        const dur = 14 + Math.random() * 18;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.35 + 'px',
            borderRadius: '50%',
            left: (5 + Math.random() * 90) + '%',
            top: (20 + Math.random() * 60) + '%',
            background: `rgba(220,210,235,${0.30 + Math.random() * 0.25})`,
            filter: 'blur(1px)',
            animation: `driftMote ${dur}s ease-in-out forwards`, opacity: '0'
        });
    }
    c.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, getDuration(el, 16));
}

const SPAWN_FNS = [spawnSakura, spawnForest, spawnAutumn, spawnRain, spawnDusk];
const SPAWN_RATES = [900, 1100, 800, 400, 1000];
const SPAWN_BURST = [10, 11, 10, 14, 10];

const WellnessBackgroundLight: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
    const pLayersRef = useRef<(HTMLDivElement | null)[]>([]);
    const blobsRef = useRef<(HTMLDivElement | null)[]>([]);
    const bcRef = useRef<HTMLDivElement>(null);
    const brsRef = useRef<(HTMLDivElement | null)[]>([]);
    const veilRef = useRef<HTMLDivElement>(null);

    // mutable state for animation
    const state = useRef({
        idx: 0,
        theme: THEMES[0],
        W: typeof window !== 'undefined' ? window.innerWidth : 1000,
        H: typeof window !== 'undefined' ? window.innerHeight : 1000,
        t: 0,
        mx: 0, my: 0, tmx: 0, tmy: 0,
        pIntervals: [] as { ti: number; iv: NodeJS.Timeout }[],
        frameId: 0,
        themeIntervalId: null as NodeJS.Timeout | null,
    });

    useEffect(() => {
        if (!containerRef.current) return;
        const s = state.current;

        const resize = () => {
            s.W = window.innerWidth;
            s.H = window.innerHeight;
            canvasesRef.current.forEach(c => {
                if (c) { c.width = s.W; c.height = s.H; }
            });
        };

        const tickBlobs = () => {
            blobsRef.current.forEach((b, i) => {
                if (!b) return;
                const d = BD[i];
                const dx = Math.sin(s.t * d.spx + d.phx) * 4.5;
                const dy = Math.cos(s.t * d.spy + d.phy) * 3.5;
                const sc = 1 + Math.sin(s.t * d.spx * 0.58 + d.phx * 1.4) * d.sA;
                b.style.transform = `translate(${dx + s.mx * 7}vw,${dy + s.my * 4.5}vh) scale(${sc})`;
            });
        };

        const startParticles = (ti: number) => {
            const c = pLayersRef.current[ti];
            if (!c) return;
            for (let i = 0; i < SPAWN_BURST[ti]; i++) {
                setTimeout(() => { if (c) SPAWN_FNS[ti](c); }, i * 170);
            }
            const iv = setInterval(() => { if (c) SPAWN_FNS[ti](c); }, SPAWN_RATES[ti]);
            s.pIntervals.push({ ti, iv });
        };

        const stopParticles = (ti: number) => {
            for (let i = s.pIntervals.length - 1; i >= 0; i--) {
                if (s.pIntervals[i].ti === ti) {
                    clearInterval(s.pIntervals[i].iv);
                    s.pIntervals.splice(i, 1);
                }
            }
        };

        const applyTheme = (th: Theme, i: number) => {
            if (containerRef.current) containerRef.current.style.background = th.bg;

            blobsRef.current.forEach((b, bi) => {
                if (!b) return;
                const pos = th.blobPos[bi];
                b.style.background = `radial-gradient(circle,${th.blobs[bi]} 0%,transparent 70%)`;
                b.style.width = th.blobSizes[bi];
                b.style.height = th.blobSizes[bi];
                b.style.top = pos.top || 'unset';
                b.style.left = pos.left || 'unset';
                b.style.right = pos.right || 'unset';
                b.style.bottom = pos.bottom || 'unset';
            });

            if (bcRef.current) {
                bcRef.current.style.background = th.dotColor;
                bcRef.current.style.boxShadow = `0 0 26px ${th.dotGlow},0 0 50px ${th.dotGlow}`;
            }

            brsRef.current.forEach(r => {
                if (r) r.style.borderColor = th.ringColor;
            });

            canvasesRef.current.forEach((cv, ci) => {
                if (cv) {
                    cv.style.opacity = ci === i ? '1' : '0';
                    cv.parentElement?.classList.toggle('active', ci === i);
                }
            });

            pLayersRef.current.forEach((p, pi) => {
                if (p) {
                    p.style.opacity = pi === i ? '1' : '0';
                    p.classList.toggle('active', pi === i);
                }
            });
        };

        const nextTheme = () => {
            if (veilRef.current) veilRef.current.classList.add('fade');
            const prev = s.idx;
            setTimeout(() => {
                stopParticles(prev);
                s.idx = (s.idx + 1) % THEMES.length;
                s.theme = THEMES[s.idx];
                applyTheme(s.theme, s.idx);
                startParticles(s.idx);
                setTimeout(() => {
                    if (veilRef.current) veilRef.current.classList.remove('fade');
                }, 420);
            }, FADE * 0.50);
        };

        const loop = (ts: number) => {
            s.t = ts;
            s.mx += (s.tmx - s.mx) * 0.028;
            s.my += (s.tmy - s.my) * 0.028;

            const ctx = canvasesRef.current[s.idx]?.getContext('2d');
            if (ctx) {
                s.theme.drawFn(ctx, s.W, s.H, s.t, s.mx, s.my);
            }

            tickBlobs();
            s.frameId = requestAnimationFrame(loop);
        };

        const handleMouseMove = (e: MouseEvent) => {
            s.tmx = (e.clientX / window.innerWidth - 0.5) * 2;
            s.tmy = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        // Initialize
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);

        applyTheme(s.theme, s.idx);
        startParticles(s.idx);
        s.themeIntervalId = setInterval(nextTheme, HOLD);
        s.frameId = requestAnimationFrame(loop);

        // Cleanup
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (s.themeIntervalId) clearInterval(s.themeIntervalId);
            s.pIntervals.forEach(iv => clearInterval(iv.iv));
            s.pIntervals = [];
            cancelAnimationFrame(s.frameId);
        };
    }, []);

    return (
        <div className="wellness-bg-light-container" ref={containerRef}>
            <div id="veil" ref={veilRef}></div>

            {[0, 1, 2, 3, 4].map((i) => (
                <div key={`layer-${i}`} className={`layer ${i === 0 ? 'active' : ''}`}>
                    <canvas ref={el => { canvasesRef.current[i] = el; }}></canvas>
                </div>
            ))}

            <div id="aurora">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={`blob-${i}`} className="blob" ref={el => { blobsRef.current[i] = el; }}></div>
                ))}
            </div>

            {[0, 1, 2, 3, 4].map((i) => (
                <div key={`player-${i}`} className={`pLayer ${i === 0 ? 'active' : ''}`} ref={el => { pLayersRef.current[i] = el; }}></div>
            ))}

            <div id="vig"></div>
            <div className="grain"></div>

            <div id="breath">
                <div className="br" ref={el => { brsRef.current[0] = el; }}></div>
                <div className="br" ref={el => { brsRef.current[1] = el; }}></div>
                <div className="br" ref={el => { brsRef.current[2] = el; }}></div>
                <div className="bc" ref={bcRef}></div>
            </div>
        </div>
    );
};

export default WellnessBackgroundLight;
