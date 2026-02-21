import React, { useEffect, useRef } from 'react';
import './WellnessBackground.css';

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function rgba(r: number, g: number, b: number, a: number) { return `rgba(${r},${g},${b},${a})`; }

const STARS = Array.from({ length: 170 }, () => ({
    x: Math.random(), y: Math.random() * 0.82,
    sz: Math.random() * 2.0 + 0.35,
    spd: 0.00045 + Math.random() * 0.0009,
    ph: Math.random() * Math.PI * 2,
}));

function drawStars(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, op: number) {
    STARS.forEach(s => {
        const fl = Math.sin(t * s.spd + s.ph) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(fl * op * 0.62).toFixed(3)})`;
        ctx.fill();
    });
}

// ══════════════════════════════════════════════════════════════
// THEMES
// ══════════════════════════════════════════════════════════════
type Theme = {
    name: string;
    bg: string;
    blobs: string[];
    blobSizes: string[];
    blobPos: Record<string, string>[];
    particleColor: string;
    ringColor: string;
    dotColor: string;
    dotGlow: string;
    drawFn: (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, mx: number, my: number) => void;
};

const THEMES: Theme[] = [
    // ── 0 · MIDNIGHT OCEAN ─────────────────────────────────────
    {
        name: 'midnight-ocean',
        bg: '#03070d',
        blobs: ['rgba(12,58,80,0.55)', 'rgba(9,74,88,0.47)', 'rgba(18,48,68,0.42)', 'rgba(12,60,85,0.47)', 'rgba(4,47,62,0.35)'],
        blobSizes: ['74vw', '62vw', '68vw', '48vw', '52vw'],
        blobPos: [{ top: '-16%', left: '-20%' }, { top: '36%', right: '-10%' }, { bottom: '-14%', left: '16%' }, { top: '5%', left: '38%' }, { top: '48%', left: '-5%' }],
        particleColor: '#5ecfd8', ringColor: '#4ecdc4', dotColor: '#3dbfb8', dotGlow: 'rgba(78,205,196,0.32)',
        drawFn(ctx, W, H, t, mx, my) {
            ctx.clearRect(0, 0, W, H);
            drawStars(ctx, W, H, t, 0.72);

            const dg = ctx.createRadialGradient(W / 2 + mx * 25, H * 1.05, 0, W / 2, H * 0.85, H * 0.75);
            dg.addColorStop(0, rgba(10, 80, 120, 0.12));
            dg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = dg; ctx.fillRect(0, 0, W, H);

            ctx.save();
            for (let i = 0; i < 28; i++) {
                const bx = ((i * 137.5 + t * 0.008) % 1) * W;
                const baseY = H * (0.55 + ((i * 53) % 7) * 0.04);
                const by = baseY + Math.sin(bx * 0.0012 + t * 0.00006 + i) * H * 0.04;
                const alpha = Math.max(0, Math.sin(t * 0.00090 + i * 0.7)) * 0.55;
                const gr = ctx.createRadialGradient(bx, by, 0, bx, by, 4 + i % 4);
                gr.addColorStop(0, `rgba(100,230,240,${alpha})`);
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(bx, by, 4 + i % 4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.06;
            for (let c = 0; c < 6; c++) {
                const cx2 = W * (0.1 + c * 0.15) + Math.sin(t * 0.000038 + c) * W * 0.04 + mx * 15;
                const cy2 = H * (0.50 + Math.sin(t * 0.000028 + c * 1.3) * 0.06) + my * 10;
                const cr = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 60 + c * 18);
                cr.addColorStop(0, rgba(80, 200, 220, 0.25));
                cr.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = cr; ctx.fillRect(0, 0, W, H);
            }
            ctx.restore();

            const waves = [
                { col: rgba(26, 138, 170, 0.060), a: 0.052, f: 0.00090, sp: 0.000058, y: 0.56 },
                { col: rgba(14, 122, 149, 0.055), a: 0.044, f: 0.00115, sp: 0.000042, y: 0.61 },
                { col: rgba(24, 152, 192, 0.048), a: 0.036, f: 0.00076, sp: 0.000065, y: 0.66 },
                { col: rgba(13, 106, 128, 0.042), a: 0.048, f: 0.00105, sp: 0.000050, y: 0.71 },
                { col: rgba(10, 80, 120, 0.036), a: 0.032, f: 0.00136, sp: 0.000035, y: 0.76 },
                { col: rgba(8, 64, 88, 0.030), a: 0.040, f: 0.00070, sp: 0.000055, y: 0.51 },
            ];
            waves.forEach((w, i) => {
                const by = H * w.y + my * 20;
                ctx.beginPath(); ctx.moveTo(0, H);
                for (let x = 0; x <= W; x += 3) {
                    const y = by
                        + Math.sin(x * w.f + t * w.sp * 1000 + i * 0.9) * H * w.a
                        + Math.sin(x * w.f * 2.1 - t * w.sp * 580 + i * 0.5) * H * w.a * 0.30
                        + Math.sin(x * w.f * 0.48 + t * w.sp * 360) * H * w.a * 0.16;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(W, H); ctx.closePath();
                ctx.fillStyle = w.col; ctx.fill();
            });

            ctx.save();
            const mrx = W * 0.72 + mx * 18; const mry = H * 0.62;
            const mr = ctx.createLinearGradient(mrx, mry - H * 0.22, mrx, mry + H * 0.02);
            mr.addColorStop(0, 'rgba(200,240,255,0)');
            mr.addColorStop(0.4, 'rgba(200,240,255,0.04)');
            mr.addColorStop(1, 'rgba(200,240,255,0)');
            ctx.fillStyle = mr;
            ctx.fillRect(mrx - 12, mry - H * 0.22, 24, H * 0.24);
            ctx.restore();
        }
    },

    // ── 1 · FOREST DAWN ────────────────────────────────────────
    {
        name: 'forest-dawn',
        bg: '#030c04',
        blobs: ['rgba(24,90,32,0.54)', 'rgba(12,74,22,0.47)', 'rgba(35,92,34,0.42)', 'rgba(19,58,26,0.47)', 'rgba(12,72,24,0.35)'],
        blobSizes: ['70vw', '58vw', '64vw', '46vw', '50vw'],
        blobPos: [{ top: '-12%', left: '-16%' }, { top: '40%', right: '-8%' }, { bottom: '-10%', left: '20%' }, { top: '10%', left: '42%' }, { top: '50%', left: '-3%' }],
        particleColor: '#7dd98a', ringColor: '#6ec97a', dotColor: '#5bbf68', dotGlow: 'rgba(91,191,104,0.32)',
        drawFn(ctx, W, H, t, mx, my) {
            ctx.clearRect(0, 0, W, H);
            drawStars(ctx, W, H, t, 0.08);

            const hg = ctx.createLinearGradient(0, H * 0.45, 0, H);
            hg.addColorStop(0, 'rgba(0,0,0,0)');
            hg.addColorStop(0.5, rgba(30, 80, 20, 0.07));
            hg.addColorStop(1, rgba(40, 100, 25, 0.14));
            ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);

            const gg = ctx.createRadialGradient(W / 2 + mx * 22, H * 0.92, 0, W / 2, H * 0.88, H * 0.72);
            gg.addColorStop(0, rgba(26, 106, 32, 0.14));
            gg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.fillStyle = rgba(5, 18, 6, 0.55);
            const trees = 16;
            for (let tr = 0; tr < trees; tr++) {
                const tx = W * (tr / trees) + W * 0.03;
                const sway = Math.sin(t * 0.000040 + tr * 0.55) * W * 0.008 + mx * 8;
                const th2 = H * (0.30 + ((tr * 37) % 10) * 0.03);
                const tw = W * 0.025 + ((tr * 23) % 6) * W * 0.004;
                ctx.fillRect(tx + sway - tw * 0.15, H - H * 0.22, tw * 0.3, H * 0.22);
                for (let lv = 0; lv < 4; lv++) {
                    const ly = H - H * 0.22 - th2 * (0.3 + lv * 0.18);
                    const lw = tw * (2.2 - lv * 0.35);
                    ctx.beginPath();
                    ctx.moveTo(tx + sway, ly - th2 * 0.2);
                    ctx.lineTo(tx + sway - lw, ly + th2 * 0.1);
                    ctx.lineTo(tx + sway + lw, ly + th2 * 0.1);
                    ctx.closePath(); ctx.fill();
                }
            }
            ctx.restore();

            ctx.save();
            for (let f = 0; f < 20; f++) {
                const fx = W * (0.05 + (f * 73.1) % 0.9) + Math.sin(t * 0.000055 + f * 1.2) * W * 0.025 + mx * 10;
                const fy = H * (0.35 + (f * 41.7) % 0.5) + Math.cos(t * 0.000042 + f * 0.9) * H * 0.04;
                const fa = Math.max(0, Math.sin(t * 0.00120 + f * 2.1));
                const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 8);
                fg.addColorStop(0, `rgba(160,255,120,${fa * 0.70})`);
                fg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, 8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            ctx.save(); ctx.lineWidth = 0.8;
            for (let r = 0; r < 16; r++) {
                const bx = W * (0.08 + r / 16 * 0.84) + mx * 12;
                ctx.strokeStyle = `rgba(58,138,56,${0.06 + ((r * 7) % 5) * 0.012})`;
                ctx.beginPath(); ctx.moveTo(bx, H);
                let rx = bx, ry = H;
                const ang = -Math.PI / 2 + (r / 16 - 0.5) * 1.0 + Math.sin(t * 0.000038 + r) * 0.14;
                for (let sg = 0; sg < 9; sg++) {
                    const sw = Math.sin(t * 0.000052 + r * 1.3 + sg * 0.85) * 0.20;
                    rx += Math.cos(ang + sw) * H * 0.058;
                    ry += Math.sin(ang + sw) * H * 0.058;
                    ctx.lineTo(rx, ry);
                }
                ctx.stroke();
            }
            ctx.restore();

            const fog = [
                { col: rgba(42, 138, 48, 0.040), a: 0.022, f: 0.0013, sp: 0.000046, y: 0.83 },
                { col: rgba(26, 122, 34, 0.032), a: 0.016, f: 0.0017, sp: 0.000034, y: 0.88 },
                { col: rgba(16, 96, 24, 0.025), a: 0.020, f: 0.0009, sp: 0.000055, y: 0.93 },
            ];
            fog.forEach((w, i) => {
                const by = H * w.y;
                ctx.beginPath(); ctx.moveTo(0, H);
                for (let x = 0; x <= W; x += 3) {
                    const y = by + Math.sin(x * w.f + t * w.sp * 1000 + i) * H * w.a;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(W, H); ctx.closePath();
                ctx.fillStyle = w.col; ctx.fill();
            });
        }
    },

    // ── 2 · ROSE DUSK ──────────────────────────────────────────
    {
        name: 'rose-dusk',
        bg: '#0b050a',
        blobs: ['rgba(78,22,38,0.55)', 'rgba(62,14,46,0.47)', 'rgba(88,36,56,0.42)', 'rgba(58,18,46,0.47)', 'rgba(72,13,50,0.35)'],
        blobSizes: ['72vw', '58vw', '64vw', '46vw', '48vw'],
        blobPos: [{ top: '-14%', left: '-20%' }, { top: '38%', right: '-12%' }, { bottom: '-13%', left: '17%' }, { top: '8%', left: '40%' }, { top: '47%', left: '-6%' }],
        particleColor: '#e8a8c0', ringColor: '#d490aa', dotColor: '#c87898', dotGlow: 'rgba(200,120,152,0.32)',
        drawFn(ctx, W, H, t, mx, my) {
            ctx.clearRect(0, 0, W, H);

            STARS.forEach(s => {
                const fl = Math.sin(t * s.spd + s.ph) * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(s.x * W, s.y * H, s.sz, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,220,230,${(fl * 0.30 * 0.62).toFixed(3)})`;
                ctx.fill();
            });

            const hb = ctx.createLinearGradient(0, H * 0.4, 0, H);
            hb.addColorStop(0, 'rgba(0,0,0,0)');
            hb.addColorStop(1, rgba(90, 24, 50, 0.12));
            ctx.fillStyle = hb; ctx.fillRect(0, 0, W, H);

            const cx = W / 2 + mx * 14, cy = H / 2 + my * 10;
            for (let r = 1; r <= 16; r++) {
                const phase = t * 0.000016 + r * 0.42;
                const pulse = 1 + Math.sin(phase) * 0.055;
                const rx = (r / 16) * Math.min(W, H) * 0.52 * pulse;
                const ry = rx * (0.52 + Math.sin(t * 0.000011 + r * 0.28) * 0.08);
                const rot = t * 0.0000075 * (r % 2 === 0 ? 1 : -1) + r * 0.14;
                const alpha = (0.055 - r * 0.002) * Math.max(0, Math.sin(t * 0.000013 + r * 0.48) * 0.5 + 0.5);
                ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
                ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(220,140,170,${alpha.toFixed(3)})`;
                ctx.lineWidth = 0.75; ctx.stroke();
                ctx.restore();
            }

            ctx.save(); ctx.lineWidth = 0.6;
            for (let w = 0; w < 8; w++) {
                const wx1 = W * (0.1 + w * 0.11) + Math.sin(t * 0.000030 + w) * W * 0.06 + mx * 16;
                const wy1 = H * (0.3 + w * 0.07) + Math.cos(t * 0.000022 + w) * H * 0.05;
                const wx2 = wx1 + Math.sin(t * 0.000025 + w * 1.4) * W * 0.12;
                const wy2 = wy1 - H * 0.18;
                const alpha = 0.04 + Math.sin(t * 0.000035 + w * 0.8) * 0.03;
                ctx.strokeStyle = `rgba(230,160,190,${alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.moveTo(wx1, wy1);
                ctx.bezierCurveTo(wx1 + W * 0.05, wy1 - H * 0.08, wx2 - W * 0.05, wy2 + H * 0.06, wx2, wy2);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            for (let b = 0; b < 14; b++) {
                const bx = W * (0.05 + (b * 79.3) % 0.9) + Math.sin(t * 0.000028 + b) * W * 0.04 + mx * 12;
                const by = H * (0.1 + (b * 53.7) % 0.8) + Math.cos(t * 0.000020 + b * 1.1) * H * 0.05 + my * 8;
                const brad = 14 + b % 8 * 4;
                const ba = 0.025 + Math.sin(t * 0.000060 + b * 1.7) * 0.015;
                const bg2 = ctx.createRadialGradient(bx, by, 0, bx, by, brad);
                bg2.addColorStop(0, `rgba(240,160,195,${ba})`);
                bg2.addColorStop(0.6, `rgba(200,120,155,${ba * 0.4})`);
                bg2.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(bx, by, brad, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            const hgl = ctx.createLinearGradient(0, H * 0.58, 0, H * 0.72);
            hgl.addColorStop(0, 'rgba(0,0,0,0)');
            hgl.addColorStop(0.5, rgba(160, 60, 90, 0.06));
            hgl.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = hgl; ctx.fillRect(0, H * 0.58, W, H * 0.14);
        }
    },

    // ── 3 · GOLDEN HOUR ────────────────────────────────────────
    {
        name: 'golden-hour',
        bg: '#0b0800',
        blobs: ['rgba(78,56,8,0.55)', 'rgba(62,44,6,0.47)', 'rgba(88,70,24,0.42)', 'rgba(60,42,8,0.47)', 'rgba(74,56,3,0.35)'],
        blobSizes: ['68vw', '54vw', '60vw', '42vw', '46vw'],
        blobPos: [{ top: '-10%', left: '-14%' }, { top: '42%', right: '-7%' }, { bottom: '-9%', left: '22%' }, { top: '12%', left: '44%' }, { top: '51%', left: '-3%' }],
        particleColor: '#f5c840', ringColor: '#e8b030', dotColor: '#daa020', dotGlow: 'rgba(218,160,32,0.32)',
        drawFn(ctx, W, H, t, mx, my) {
            ctx.clearRect(0, 0, W, H);

            STARS.forEach(s => {
                const fl = Math.sin(t * s.spd + s.ph) * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(s.x * W, s.y * H, s.sz, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,220,140,${(fl * 0.04 * 0.62).toFixed(3)})`;
                ctx.fill();
            });

            const sx = W * 0.50 + mx * 28, sy = H * 0.70 + my * 16;
            const sunG = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.12);
            sunG.addColorStop(0, rgba(255, 240, 160, 0.20));
            sunG.addColorStop(0.5, rgba(255, 200, 60, 0.10));
            sunG.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = sunG; ctx.fillRect(0, 0, W, H);

            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const numR = 24;
            for (let i = 0; i < numR; i++) {
                const angle = -Math.PI + (i / (numR - 1)) * Math.PI;
                const flicker = 0.45 + Math.sin(t * 0.000088 + i * 1.8) * 0.55;
                const halfW = (0.038 + Math.sin(t * 0.000058 + i * 0.85) * 0.028) * Math.PI / numR;
                const len = H * 1.5;
                const alpha = 0.024 * flicker;
                const rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
                rg.addColorStop(0, `rgba(255,200,60,${(alpha * 2.2).toFixed(3)})`);
                rg.addColorStop(0.35, `rgba(255,160,20,${alpha.toFixed(3)})`);
                rg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.arc(sx, sy, len, -(angle + halfW / 2), -(angle - halfW / 2));
                ctx.lineTo(sx, sy);
                ctx.fillStyle = rg; ctx.fill();
            }
            ctx.restore();

            ctx.save();
            for (let h = 0; h < 7; h++) {
                const hy = H * (0.52 + h * 0.068);
                const hshift = Math.sin(t * 0.000075 + h * 2.0) * W * 0.014;
                const ha = 0.010 * (1 - h * 0.11);
                const hg = ctx.createLinearGradient(0, hy, 0, hy + H * 0.055);
                hg.addColorStop(0, 'rgba(0,0,0,0)');
                hg.addColorStop(0.5, rgba(200, 130, 10, ha));
                hg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.save(); ctx.translate(hshift, 0);
                ctx.fillStyle = hg; ctx.fillRect(0, hy, W, H * 0.055);
                ctx.restore();
            }
            ctx.restore();

            ctx.save();
            for (let d = 0; d < 18; d++) {
                const da = (d * 137.5 + t * 0.015) % (W * 1.2);
                const dy = H * (0.3 + (d * 53) % 7 * 0.05) + Math.sin(t * 0.000045 + d * 1.3) * H * 0.06;
                const ds = 1 + d % 3;
                const dop = 0.4 + Math.sin(t * 0.00100 + d) * 0.4;
                const dgr = ctx.createRadialGradient(da, dy, 0, da, dy, ds * 3);
                dgr.addColorStop(0, `rgba(255,215,0,${(dop * 0.5).toFixed(3)})`);
                dgr.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = dgr; ctx.beginPath(); ctx.arc(da, dy, ds * 3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            const wh = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.95);
            wh.addColorStop(0, rgba(200, 112, 0, 0.14));
            wh.addColorStop(0.5, rgba(180, 80, 0, 0.06));
            wh.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = wh; ctx.fillRect(0, 0, W, H);
        }
    },

    // ── 4 · VIOLET COSMOS ──────────────────────────────────────
    {
        name: 'violet-cosmos',
        bg: '#060410',
        blobs: ['rgba(40,22,78,0.55)', 'rgba(26,14,64,0.47)', 'rgba(54,38,96,0.42)', 'rgba(32,13,70,0.47)', 'rgba(22,14,78,0.35)'],
        blobSizes: ['76vw', '62vw', '68vw', '48vw', '52vw'],
        blobPos: [{ top: '-18%', left: '-22%' }, { top: '32%', right: '-14%' }, { bottom: '-18%', left: '12%' }, { top: '5%', left: '36%' }, { top: '46%', left: '-8%' }],
        particleColor: '#b898e8', ringColor: '#a880d8', dotColor: '#9870c8', dotGlow: 'rgba(152,112,200,0.32)',
        drawFn(ctx, W, H, t, mx, my) {
            ctx.clearRect(0, 0, W, H);
            drawStars(ctx, W, H, t, 1.0);

            ctx.save();
            const mw = ctx.createLinearGradient(W * 0.1, H * 0.1, W * 0.9, H * 0.9);
            mw.addColorStop(0, 'rgba(0,0,0,0)');
            mw.addColorStop(0.3, rgba(60, 30, 100, 0.06));
            mw.addColorStop(0.5, rgba(80, 40, 130, 0.09));
            mw.addColorStop(0.7, rgba(60, 30, 100, 0.06));
            mw.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = mw; ctx.fillRect(0, 0, W, H);
            ctx.restore();

            const patches = [
                { x: 0.22, y: 0.28, rx: 0.30, col: rgba(58, 26, 96, 0.065) },
                { x: 0.74, y: 0.62, rx: 0.24, col: rgba(32, 16, 80, 0.055) },
                { x: 0.50, y: 0.50, rx: 0.36, col: rgba(40, 16, 96, 0.045) },
                { x: 0.14, y: 0.72, rx: 0.20, col: rgba(24, 8, 56, 0.045) },
                { x: 0.85, y: 0.20, rx: 0.18, col: rgba(70, 30, 110, 0.055) },
            ];
            patches.forEach(p => {
                const gr = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, Math.min(W, H) * p.rx);
                gr.addColorStop(0, p.col);
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
            });

            const ocx = W / 2 + mx * 22, ocy = H / 2 + my * 16;
            const orbits = [
                { r: 0.19, sp: 0.000032, tilt: 0.30, col: rgba(180, 140, 240, 0.055), arc: 0.9 },
                { r: 0.31, sp: -0.000020, tilt: 0.85, col: rgba(140, 100, 220, 0.045), arc: 1.1 },
                { r: 0.43, sp: 0.000016, tilt: 1.55, col: rgba(200, 160, 255, 0.038), arc: 0.8 },
                { r: 0.56, sp: -0.000012, tilt: 0.60, col: rgba(160, 120, 230, 0.032), arc: 1.3 },
            ];
            orbits.forEach(orb => {
                const rad = Math.min(W, H) * orb.r;
                const angle = t * orb.sp;
                ctx.save(); ctx.translate(ocx, ocy); ctx.rotate(orb.tilt);
                ctx.beginPath();
                ctx.ellipse(0, 0, rad, rad * 0.38, 0, angle - orb.arc, angle + orb.arc);
                ctx.strokeStyle = orb.col; ctx.lineWidth = 1.0; ctx.stroke();
                const hx = Math.cos(angle) * rad, hy = Math.sin(angle) * rad * 0.38;
                const mg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
                mg.addColorStop(0, rgba(210, 180, 255, 0.55));
                mg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            });

            const pul = Math.max(0, Math.sin(t * 0.000200));
            if (pul > 0.01) {
                const px = ctx.createRadialGradient(ocx, ocy, 0, ocx, ocy, H * 0.55 * pul);
                px.addColorStop(0, `rgba(180,140,255,${(pul * 0.08).toFixed(3)})`);
                px.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = px; ctx.fillRect(0, 0, W, H);
            }

            ctx.save(); ctx.globalAlpha = 0.04;
            for (let d = 0; d < 5; d++) {
                const dg = ctx.createRadialGradient(
                    W * (0.2 + d * 0.15) + mx * 14, H * (0.15 + d * 0.16) + my * 10, 0,
                    W * (0.2 + d * 0.15), H * (0.15 + d * 0.16), H * 0.18
                );
                dg.addColorStop(0, rgba(100, 60, 180, 0.8));
                dg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = dg; ctx.fillRect(0, 0, W, H);
            }
            ctx.restore();
        }
    },
];

// ══════════════════════════════════════════════════════════════
// BLOB DRIFT
// ══════════════════════════════════════════════════════════════
const BD = [
    { phx: 0.0, phy: 1.3, spx: 0.000078, spy: 0.000060, sA: 0.09 },
    { phx: 2.0, phy: 0.5, spx: 0.000060, spy: 0.000092, sA: 0.07 },
    { phx: 4.2, phy: 3.1, spx: 0.000092, spy: 0.000070, sA: 0.10 },
    { phx: 1.1, phy: 5.2, spx: 0.000070, spy: 0.000080, sA: 0.08 },
    { phx: 3.3, phy: 2.4, spx: 0.000084, spy: 0.000050, sA: 0.11 },
];

function tickBlobs(blobsRef: React.MutableRefObject<HTMLDivElement[]>, t: number, mx: number, my: number) {
    blobsRef.current.forEach((b, i) => {
        if (!b) return;
        const d = BD[i];
        const dx = Math.sin(t * d.spx + d.phx) * 5;
        const dy = Math.cos(t * d.spy + d.phy) * 4;
        const sc = 1 + Math.sin(t * d.spx * 0.58 + d.phx * 1.4) * d.sA;
        b.style.transform = `translate(${dx + mx * 9}vw,${dy + my * 5.5}vh) scale(${sc})`;
    });
}

// ══════════════════════════════════════════════════════════════
// PARTICLES — unique per theme
// ══════════════════════════════════════════════════════════════

// 0 Ocean
function spawnOcean(c: HTMLDivElement) {
    if (!c) return;
    const r = Math.random();
    const el = document.createElement('div');
    if (r < 0.6) {
        const sz = 4 + Math.random() * 12;
        const dur = 18 + Math.random() * 22;
        const anim = ['bubbleUp', 'bubbleSide', 'jellyRise'][Math.floor(Math.random() * 3)];
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (3 + Math.random() * 94) + '%', bottom: '-4%',
            border: `1px solid rgba(94,207,216,${0.2 + Math.random() * 0.35})`,
            boxShadow: `inset 0 0 ${sz}px rgba(80,200,220,0.15),0 0 ${sz * 2}px rgba(78,205,196,0.18)`,
            animation: `${anim} ${dur}s ease-in forwards`, opacity: 0
        });
    } else {
        // bioluminescent streak
        const sz = 2 + Math.random() * 4;
        const dur = 14 + Math.random() * 18;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%', bottom: (Math.random() * 60) + '%',
            background: `rgba(100,230,240,${0.4 + Math.random() * 0.4})`,
            boxShadow: `0 0 ${sz * 5}px rgba(78,205,196,0.6)`,
            filter: 'blur(0.6px)',
            animation: `bubbleUp ${dur}s linear forwards`, opacity: 0
        });
    }
    c.appendChild(el);
    const animDur = parseFloat(el.style.animationDuration || '18');
    setTimeout(() => el.remove(), (animDur + 1) * 1000);
}

// 1 Forest
function spawnForest(c: HTMLDivElement) {
    if (!c) return;
    const r = Math.random();
    const el = document.createElement('div');
    if (r < 0.55) {
        const sz = 2 + Math.random() * 6;
        const dur = 20 + Math.random() * 26;
        const hue = 100 + Math.random() * 50;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%',
            bottom: (Math.random() * 35) + '%',
            background: `hsl(${hue},60%,62%)`,
            boxShadow: `0 0 ${sz * 5}px hsl(${hue},70%,50%)`,
            filter: 'blur(0.8px)',
            animation: `sporeFloat ${dur}s ease-in-out forwards`, opacity: 0
        });
    } else {
        // leaf shape
        const sz = 8 + Math.random() * 18;
        const dur = 14 + Math.random() * 18;
        const hue = 100 + Math.random() * 40;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.55 + 'px',
            borderRadius: '50% 0 50% 0',
            left: (Math.random() * 95) + '%', top: '-4%',
            background: `hsla(${hue},50%,35%,${0.35 + Math.random() * 0.35})`,
            filter: 'blur(0.5px)',
            animation: `leafFall ${dur}s ease-in forwards`,
            transform: `rotate(${Math.random() * 360}deg)`, opacity: 0
        });
    }
    c.appendChild(el);
    const animDur = parseFloat(el.style.animationDuration || '20');
    setTimeout(() => el.remove(), (animDur + 1) * 1000);
}

// 2 Rose
function spawnRose(c: HTMLDivElement) {
    if (!c) return;
    const r = Math.random();
    const el = document.createElement('div');
    if (r < 0.5) {
        const sz = 7 + Math.random() * 16;
        const dur = 12 + Math.random() * 16;
        Object.assign(el.style, {
            position: 'absolute',
            width: sz + 'px', height: sz * 0.42 + 'px',
            borderRadius: '50% 50% 0 50%',
            left: Math.random() * 96 + '%', top: '-4%',
            background: `rgba(${205 + Math.random() * 35},${108 + Math.random() * 45},${148 + Math.random() * 35},${0.28 + Math.random() * 0.35})`,
            filter: 'blur(0.7px)',
            animation: `petalDrift ${dur}s ease-in forwards`,
            transform: `rotate(${Math.random() * 360}deg)`, opacity: 0
        });
    } else {
        const sz = 3 + Math.random() * 7;
        const dur = 16 + Math.random() * 20;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (5 + Math.random() * 90) + '%',
            bottom: (Math.random() * 70) + '%',
            background: `rgba(240,170,200,${0.35 + Math.random() * 0.4})`,
            boxShadow: `0 0 ${sz * 4}px rgba(220,140,170,0.5)`,
            filter: 'blur(1px)',
            animation: `dustMote ${dur}s ease-in-out forwards`, opacity: 0
        });
    }
    c.appendChild(el);
    const animDur = parseFloat(el.style.animationDuration || '14');
    setTimeout(() => el.remove(), (animDur + 1) * 1000);
}

// 3 Golden
function spawnGolden(c: HTMLDivElement) {
    if (!c) return;
    const r = Math.random();
    const el = document.createElement('div');
    if (r < 0.6) {
        const sz = 2 + Math.random() * 7;
        const dur = 10 + Math.random() * 18;
        const hue = 28 + Math.random() * 32;
        const lit = 55 + Math.random() * 22;
        const col = `hsl(${hue},92%,${lit}%)`;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (4 + Math.random() * 92) + '%', bottom: '0%',
            background: col,
            boxShadow: `0 0 ${sz * 5}px ${col}`,
            animation: `emberRise ${dur}s ease-out forwards`, opacity: 0
        });
    } else {
        const w = 1, h = 10 + Math.random() * 30;
        const dur = 6 + Math.random() * 10;
        const hue = 30 + Math.random() * 20;
        Object.assign(el.style, {
            position: 'absolute',
            width: w + 'px', height: h + 'px',
            left: (5 + Math.random() * 90) + '%', bottom: (Math.random() * 50) + '%',
            background: `linear-gradient(to top,transparent,hsl(${hue},90%,70%),transparent)`,
            animation: `sunMote ${dur}s ease-out forwards`, opacity: 0
        });
    }
    c.appendChild(el);
    const animDur = parseFloat(el.style.animationDuration || '12');
    setTimeout(() => el.remove(), (animDur + 1) * 1000);
}

// 4 Cosmos
function spawnCosmos(c: HTMLDivElement) {
    if (!c) return;
    const r = Math.random();
    const el = document.createElement('div');
    if (r < 0.3) {
        const len = 70 + Math.random() * 130;
        const dur = 1.4 + Math.random() * 2.2;
        const startX = Math.random() * 75;
        const angle = 12 + Math.random() * 22;
        Object.assign(el.style, {
            position: 'absolute',
            width: len + 'px', height: '1.5px',
            left: startX + '%', top: (Math.random() * 65) + '%',
            background: 'linear-gradient(90deg,transparent,rgba(210,190,255,0.9),rgba(255,255,255,0.6),transparent)',
            transform: `rotate(-${angle}deg)`,
            animation: `shootStar ${dur}s ease-in forwards`, opacity: 0
        });
    } else if (r < 0.65) {
        const sz = 3 + Math.random() * 9;
        const dur = 20 + Math.random() * 24;
        const hue = 250 + Math.random() * 60;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (4 + Math.random() * 92) + '%',
            bottom: (Math.random() * 70) + '%',
            background: `hsla(${hue},70%,70%,${0.4 + Math.random() * 0.4})`,
            boxShadow: `0 0 ${sz * 4}px hsla(${hue},80%,60%,0.5)`,
            filter: 'blur(0.7px)',
            animation: `nebulaOrb ${dur}s ease-in-out forwards`, opacity: 0
        });
    } else {
        const sz = 1 + Math.random() * 2.5;
        const dur = 12 + Math.random() * 16;
        Object.assign(el.style, {
            position: 'absolute', borderRadius: '50%',
            width: sz + 'px', height: sz + 'px',
            left: (Math.random() * 98) + '%',
            top: (Math.random() * 85) + '%',
            background: `rgba(200,170,255,${0.5 + Math.random() * 0.45})`,
            animation: `cosmicDust ${dur}s linear forwards`, opacity: 0
        });
    }
    c.appendChild(el);
    const animDur = parseFloat(el.style.animationDuration || '16');
    setTimeout(() => el.remove(), (animDur + 1) * 1000);
}

const SPAWN_FNS = [spawnOcean, spawnForest, spawnRose, spawnGolden, spawnCosmos];
const SPAWN_RATES = [1800, 1500, 1100, 800, 2000];
const SPAWN_BURST = [9, 11, 8, 13, 12];

const WellnessBackground: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
    const pLayersRef = useRef<(HTMLDivElement | null)[]>([]);
    const blobsRef = useRef<(HTMLDivElement | null)[]>([]);
    const bcRef = useRef<HTMLDivElement>(null);
    const brsRef = useRef<(HTMLDivElement | null)[]>([]);
    const veilRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        let idx = 0;
        let theme = THEMES[0];
        let W = window.innerWidth, H = window.innerHeight, t = 0;
        let mx = 0, my = 0, tmx = 0, tmy = 0;
        const pIntervals: { ti: number, iv: NodeJS.Timeout }[] = [];
        let themeCycleInterval: NodeJS.Timeout;

        // Apply the current theme
        const applyTheme = (th: Theme, i: number) => {
            if (containerRef.current) containerRef.current.style.background = th.bg;

            blobsRef.current.forEach((b, bi) => {
                if (!b) return;
                const pos = th.blobPos[bi];
                b.style.background = `radial-gradient(circle,${th.blobs[bi]} 0%,transparent 70%)`;
                b.style.width = th.blobSizes[bi]; b.style.height = th.blobSizes[bi];
                b.style.top = pos.top || 'unset'; b.style.left = pos.left || 'unset';
                b.style.right = pos.right || 'unset'; b.style.bottom = pos.bottom || 'unset';
            });

            if (bcRef.current) {
                bcRef.current.style.background = th.dotColor;
                bcRef.current.style.boxShadow = `0 0 28px ${th.dotGlow},0 0 55px ${th.dotGlow}`;
            }

            brsRef.current.forEach(r => { if (r) r.style.borderColor = th.ringColor; });
            canvasesRef.current.forEach((c, ci) => { if (c) c.style.opacity = ci === i ? '1' : '0'; });
            pLayersRef.current.forEach((p, pi) => { if (p) p.style.opacity = pi === i ? '1' : '0'; });
        };

        // Particle control
        const startParticles = (ti: number) => {
            for (let i = 0; i < SPAWN_BURST[ti]; i++) {
                setTimeout(() => pLayersRef.current[ti] && SPAWN_FNS[ti](pLayersRef.current[ti]!), i * 180);
            }
            const iv = setInterval(() => {
                if (pLayersRef.current[ti]) SPAWN_FNS[ti](pLayersRef.current[ti]!);
            }, SPAWN_RATES[ti]);
            pIntervals.push({ ti, iv });
        };

        const stopParticles = (ti: number) => {
            for (let i = pIntervals.length - 1; i >= 0; i--) {
                if (pIntervals[i].ti === ti) {
                    clearInterval(pIntervals[i].iv);
                    pIntervals.splice(i, 1);
                }
            }
        };

        // Window Resize
        const resize = () => {
            W = window.innerWidth;
            H = window.innerHeight;
            canvasesRef.current.forEach(c => {
                if (c) {
                    c.width = W;
                    c.height = H;
                }
            });
        };
        resize();
        window.addEventListener('resize', resize);

        // Mouse Move
        const handleMouseMove = (e: MouseEvent) => {
            tmx = (e.clientX / window.innerWidth - 0.5) * 2;
            tmy = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Theme Cycling
        const HOLD = 22000, FADE = 2900;
        const nextTheme = () => {
            if (veilRef.current) veilRef.current.classList.add('fade');
            const prev = idx;
            setTimeout(() => {
                stopParticles(prev);
                idx = (idx + 1) % THEMES.length;
                theme = THEMES[idx];
                applyTheme(theme, idx);
                startParticles(idx);
                if (veilRef.current) {
                    setTimeout(() => {
                        if (veilRef.current) veilRef.current.classList.remove('fade');
                    }, 380);
                }
            }, FADE * 0.50);
        };
        themeCycleInterval = setInterval(nextTheme, HOLD);

        // Main animation loop
        const loop = (ts: number) => {
            t = ts;
            mx += (tmx - mx) * 0.030;
            my += (tmy - my) * 0.030;

            const ctx = canvasesRef.current[idx]?.getContext('2d');
            if (ctx) {
                theme.drawFn(ctx, W, H, t, mx, my);
            }

            tickBlobs(blobsRef, t, mx, my);
            animationFrameId = requestAnimationFrame(loop);
        };

        // Initialization
        applyTheme(theme, 0);
        startParticles(0);
        animationFrameId = requestAnimationFrame(loop);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(themeCycleInterval);
            cancelAnimationFrame(animationFrameId);
            pIntervals.forEach(p => clearInterval(p.iv));
        };
    }, []);

    return (
        <div className="wellness-bg-container" ref={containerRef}>
            <div id="veil" ref={veilRef}></div>

            {THEMES.map((th, i) => (
                <canvas key={`c${i}`} className="layer" ref={el => canvasesRef.current[i] = el}></canvas>
            ))}

            <div id="aurora">
                {THEMES.map((_, i) => (
                    <div key={`b${i}`} className="blob" ref={el => blobsRef.current[i] = el}></div>
                ))}
            </div>

            {THEMES.map((_, i) => (
                <div key={`p${i}`} className="pLayer" ref={el => pLayersRef.current[i] = el}></div>
            ))}

            <div id="vig"></div>
            <div className="grain"></div>

            <div id="breath">
                <div className="br" ref={el => brsRef.current[0] = el}></div>
                <div className="br" ref={el => brsRef.current[1] = el}></div>
                <div className="br" ref={el => brsRef.current[2] = el}></div>
                <div className="bc" id="bc" ref={bcRef}></div>
            </div>
        </div>
    );
};

export default WellnessBackground;
