import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaFlag, FaSync, FaExpand, FaCompress, FaBolt } from 'react-icons/fa';

/* ── helpers ──────────────────────────────────────────────────── */
function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
    });
}

/* ── Module-level shared state ───────────────────────────────────── */
/* ThreeDBackground reads this; SnakeCursor writes it each frame */
const snakeHead = { current: { x: -1000, y: -1000 } };

/* ══ DEEP SPACE BG + FLEEING PREY CREATURES ══════════════════ */
function ThreeDBackground() {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const mouse = useRef({ x: -999, y: -999 });
    const ripples = useRef([]);
    const prey = useRef([]);
    const eatBursts = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        const onMove = e => { mouse.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('mousemove', onMove);
        const onClick = e => ripples.current.push({ x: e.clientX, y: e.clientY, r: 0, alpha: 0.75 });
        window.addEventListener('click', onClick);

        /* Spawn a prey creature */
        const PREY_COLORS = [
            { h: 160, name: 'teal' }, { h: 200, name: 'cyan' },
            { h: 280, name: 'purple' }, { h: 130, name: 'lime' },
            { h: 320, name: 'pink' }, { h: 180, name: 'aqua' },
        ];
        const spawnPrey = (existing) => {
            let x, y, tries = 0;
            do {
                x = 100 + Math.random() * (W - 200);
                y = 100 + Math.random() * (H - 200);
                tries++;
            } while (tries < 20 && existing.some(p => !p.eaten && Math.hypot(p.x - x, p.y - y) < 100));
            const ci = Math.floor(Math.random() * PREY_COLORS.length);
            return {
                x, y, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
                hue: PREY_COLORS[ci].h,
                legPhase: Math.random() * Math.PI * 2,
                eyeDir: 0,   // angle the eyes look
                eaten: false, flash: 0, scared: false,
            };
        };
        for (let i = 0; i < 6; i++) prey.current.push(spawnPrey(prey.current));

        /* Stars */
        const stars = Array.from({ length: 180 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.4 + 0.2,
            tw: Math.random() * Math.PI * 2, spd: Math.random() * 0.03 + 0.008,
        }));
        /* Constellation nodes */
        const nodes = Array.from({ length: 36 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            bx: (Math.random() - 0.5) * 0.3, by: (Math.random() - 0.5) * 0.25,
            r: Math.random() * 1.8 + 0.5,
        }));
        /* Shards */
        const shards = Array.from({ length: 16 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            size: Math.random() * 13 + 4, rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.005,
            vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
            alpha: Math.random() * 0.28 + 0.07,
            sides: [3, 4, 6][Math.floor(Math.random() * 3)],
            hue: 100 + Math.random() * 40,
        }));
        /* Nebulae */
        const nebulae = [
            { cx: 0.15, cy: 0.25, r: 0.28, h: 140, s: 55 },
            { cx: 0.82, cy: 0.6, r: 0.22, h: 165, s: 45 },
            { cx: 0.5, cy: 0.88, r: 0.3, h: 120, s: 60 },
        ];
        const drawPoly = (cx, cy, r, sides, rot) => {
            ctx.beginPath();
            for (let i = 0; i < sides; i++) {
                const a = rot + (i / sides) * Math.PI * 2;
                i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                    : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
            }
            ctx.closePath();
        };

        /* Draw one prey creature */
        const drawCreature = (p, frame) => {
            const spd = Math.hypot(p.vx, p.vy);
            p.legPhase += p.scared ? 0.3 : 0.1;
            /* eye direction: look away from snake */
            const sx = snakeHead.current.x, sy = snakeHead.current.y;
            const edx = p.x - sx, edy = p.y - sy;
            p.eyeDir = Math.atan2(edy, edx);   // look AWAY from snake

            ctx.save(); ctx.translate(p.x, p.y);
            /* glow aura */
            const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            aura.addColorStop(0, `hsla(${p.hue},100%,60%,0.35)`);
            aura.addColorStop(1, `hsla(${p.hue},100%,40%,0)`);
            ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();

            /* tiny legs (4 lines, wiggle) */
            const legLen = p.scared ? 8 : 5;
            ctx.strokeStyle = `hsla(${p.hue},90%,65%,0.75)`; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
            for (let l = 0; l < 4; l++) {
                const baseAng = (l / 4) * Math.PI * 2 + Math.PI * 0.25;
                const wiggle = Math.sin(p.legPhase + l * 1.2) * (p.scared ? 0.5 : 0.28);
                ctx.beginPath();
                ctx.moveTo(Math.cos(baseAng) * 5, Math.sin(baseAng) * 4);
                ctx.lineTo(Math.cos(baseAng + wiggle) * legLen + Math.cos(baseAng) * 5,
                    Math.sin(baseAng + wiggle) * legLen + Math.sin(baseAng) * 4);
                ctx.stroke();
            }

            /* body ellipse */
            ctx.beginPath(); ctx.ellipse(0, 0, 9, 6.5, 0, 0, Math.PI * 2);
            const bg = ctx.createRadialGradient(-3, -2, 0, 0, 0, 9);
            bg.addColorStop(0, `hsla(${p.hue},100%,75%,0.95)`);
            bg.addColorStop(1, `hsla(${p.hue},80%,35%,0.9)`);
            ctx.fillStyle = bg;
            ctx.shadowBlur = p.scared ? 16 : 8;
            ctx.shadowColor = `hsla(${p.hue},100%,60%,0.8)`;
            ctx.fill(); ctx.shadowBlur = 0;
            ctx.strokeStyle = `hsla(${p.hue},100%,80%,0.5)`; ctx.lineWidth = 0.8; ctx.stroke();

            /* eyes — look away from snake */
            const eyeR = 2.5;
            [-1, 1].forEach(side => {
                const ex = Math.cos(p.eyeDir) * 4.5 + side * Math.sin(p.eyeDir) * 3.5;
                const ey = Math.sin(p.eyeDir) * 4.5 - side * Math.cos(p.eyeDir) * 3.5;
                ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
                /* pupil looks TOWARD the snake so body moves away */
                const px = ex + Math.cos(p.eyeDir + Math.PI) * 1.1;
                const py = ey + Math.sin(p.eyeDir + Math.PI) * 1.1;
                ctx.beginPath(); ctx.arc(px, py, eyeR * 0.48, 0, Math.PI * 2);
                ctx.fillStyle = '#050205'; ctx.fill();
            });

            /* scared exclamation when really close */
            if (p.scared) {
                ctx.fillStyle = `hsla(${p.hue},100%,90%,0.9)`;
                ctx.font = 'bold 8px Inter';
                ctx.textAlign = 'center';
                ctx.fillText('!', 0, -14);
            }
            ctx.restore();
        };

        let frame = 0;
        const FLEE_R = 180;  // flee radius
        const EAT_R = 22;   // eat radius
        const MAX_SPD = 5.5;
        const FRICTION = 0.92;

        const draw = () => {
            frame++;
            ctx.fillStyle = '#000401'; ctx.fillRect(0, 0, W, H);

            /* Nebulae */
            nebulae.forEach((nb, i) => {
                const p = Math.sin(frame * 0.007 + i * 2.1) * 0.03 + 0.065;
                const rg = ctx.createRadialGradient(nb.cx * W, nb.cy * H, 0, nb.cx * W, nb.cy * H, nb.r * W);
                rg.addColorStop(0, `hsla(${nb.h},${nb.s}%,20%,${p})`);
                rg.addColorStop(1, 'hsla(120,40%,8%,0)');
                ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
            });

            /* Stars */
            stars.forEach(s => {
                s.tw += s.spd;
                const a = 0.25 + Math.abs(Math.sin(s.tw)) * 0.75;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,255,180,${a})`; ctx.fill();
            });

            /* Nodes */
            const mx = mouse.current.x, my = mouse.current.y;
            nodes.forEach(n => {
                const dx = n.x - mx, dy = n.y - my, d = Math.hypot(dx, dy);
                if (d < 150 && d > 0) { const f = (150 - d) / 150; n.x += (dx / d) * f * 4; n.y += (dy / d) * f * 4; }
                n.x += n.bx; n.y += n.by;
                if (n.x < 0 || n.x > W) n.bx *= -1;
                if (n.y < 0 || n.y > H) n.by *= -1;
                ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(154,205,50,0.55)'; ctx.fill();
            });
            for (let i = 0; i < nodes.length; i++)
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d = Math.hypot(dx, dy);
                    if (d < 130) {
                        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(154,205,50,${0.18 * (1 - d / 130)})`; ctx.lineWidth = 0.7; ctx.stroke();
                    }
                }

            /* Shards */
            shards.forEach(s => {
                s.x += s.vx; s.y += s.vy; s.rot += s.vr;
                if (s.x < -60) s.x = W + 60; if (s.x > W + 60) s.x = -60;
                if (s.y < -60) s.y = H + 60; if (s.y > H + 60) s.y = -60;
                ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
                drawPoly(0, 0, s.size, s.sides, 0);
                ctx.strokeStyle = `hsla(${s.hue},75%,60%,${s.alpha})`; ctx.lineWidth = 1.2; ctx.stroke();
                ctx.restore();
            });

            /* ── Prey creatures ── */
            const hx = snakeHead.current.x, hy = snakeHead.current.y;
            prey.current.forEach((p, pi) => {
                if (p.eaten) {
                    /* eat burst rings */
                    p.flash--;
                    if (p.flash <= 0) {
                        prey.current[pi] = spawnPrey(prey.current);
                    } else {
                        [1, 1.8].forEach(scale => {
                            const br = (1 - p.flash / 20) * 45 * scale;
                            ctx.beginPath(); ctx.arc(p.x, p.y, br, 0, Math.PI * 2);
                            ctx.strokeStyle = `hsla(${p.hue},100%,70%,${p.flash / 20})`;
                            ctx.lineWidth = 2; ctx.stroke();
                        });
                    }
                    return;
                }

                /* Flee physics */
                const fdx = p.x - hx, fdy = p.y - hy;
                const fdist = Math.hypot(fdx, fdy);
                p.scared = fdist < FLEE_R;

                if (fdist < FLEE_R && fdist > 0) {
                    /* Acceleration away from snake — stronger when closer */
                    const strength = Math.pow((FLEE_R - fdist) / FLEE_R, 1.4) * (p.scared ? 1.2 : 0.6);
                    p.vx += (fdx / fdist) * strength * 1.6;
                    p.vy += (fdy / fdist) * strength * 1.6;
                } else {
                    /* Calm: gentle random wander */
                    p.vx += (Math.random() - 0.5) * 0.06;
                    p.vy += (Math.random() - 0.5) * 0.06;
                }

                /* Speed limit + friction */
                const spd = Math.hypot(p.vx, p.vy);
                if (spd > MAX_SPD) { p.vx = (p.vx / spd) * MAX_SPD; p.vy = (p.vy / spd) * MAX_SPD; }
                p.vx *= FRICTION; p.vy *= FRICTION;

                p.x += p.vx; p.y += p.vy;

                /* Wall bounce with cushion */
                const PAD = 30;
                if (p.x < PAD) { p.x = PAD; p.vx = Math.abs(p.vx) * 0.7; }
                if (p.x > W - PAD) { p.x = W - PAD; p.vx = -Math.abs(p.vx) * 0.7; }
                if (p.y < PAD) { p.y = PAD; p.vy = Math.abs(p.vy) * 0.7; }
                if (p.y > H - PAD) { p.y = H - PAD; p.vy = -Math.abs(p.vy) * 0.7; }

                /* Eat check */
                if (fdist < EAT_R) { p.eaten = true; p.flash = 20; return; }

                drawCreature(p, frame);
            });

            /* Click ripples */
            ripples.current = ripples.current.filter(r => r.alpha > 0.02);
            ripples.current.forEach(rip => {
                rip.r += 15; rip.alpha *= 0.89;
                ctx.beginPath(); ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(154,205,50,${rip.alpha})`; ctx.lineWidth = 2.2; ctx.stroke();
                if (rip.r > 22) {
                    ctx.beginPath(); ctx.arc(rip.x, rip.y, rip.r - 16, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(154,205,50,${rip.alpha * 0.35})`; ctx.lineWidth = 1; ctx.stroke();
                }
            });

            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('click', onClick);
        };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ══ SNAKE CURSOR ═══════════════════════════════════════════ */
function SnakeCursor() {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const path = useRef([]);
    const mouse = useRef({ x: -300, y: -300 });
    const tongue = useRef({ out: false, timer: 0 });
    const eatFlash = useRef(0);

    const N_SEGS = 28, SEG_D = 10, HEAD_R = 12;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
        window.addEventListener('resize', onResize);
        const onMove = e => { mouse.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('mousemove', onMove);
        for (let i = 0; i < N_SEGS + 1; i++) path.current.push({ x: -300, y: -300 });

        let frame = 0;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            frame++;

            /* Advance head */
            const head = path.current[0];
            const dx = mouse.current.x - head.x, dy = mouse.current.y - head.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 2) { const s = Math.min(dist, 11); path.current.unshift({ x: head.x + (dx / dist) * s, y: head.y + (dy / dist) * s }); }
            else { path.current.unshift({ ...head }); }

            /* Trim */
            let tot = 0, kept = [path.current[0]];
            for (let i = 1; i < path.current.length; i++) {
                tot += Math.hypot(path.current[i].x - kept[kept.length - 1].x, path.current[i].y - kept[kept.length - 1].y);
                kept.push(path.current[i]);
                if (tot >= SEG_D * N_SEGS) break;
            }
            path.current = kept;

            /* Joints */
            const joints = [];
            for (let i = 0; i <= N_SEGS; i++) {
                const t = (i / N_SEGS) * (path.current.length - 1);
                const lo = Math.floor(t), hi = Math.min(lo + 1, path.current.length - 1), f = t - lo;
                joints.push({
                    x: path.current[lo].x * (1 - f) + path.current[hi].x * f,
                    y: path.current[lo].y * (1 - f) + path.current[hi].y * f
                });
            }
            if (joints.length < 2) { animRef.current = requestAnimationFrame(draw); return; }

            /* Write shared head pos for ThreeDBackground prey */
            snakeHead.current = { x: joints[0].x, y: joints[0].y };

            /* Eat flash from prey being eaten (ThreeDBackground marks them) */
            // just keep eatFlash going for visual glow
            if (eatFlash.current > 0) eatFlash.current--;
            const eating = eatFlash.current > 0;

            /* Body */
            for (let i = N_SEGS; i >= 1; i--) {
                const t = 1 - i / N_SEGS;
                const bR = 3 + t * (HEAD_R - 3), alpha = 0.35 + t * 0.6, green = Math.floor(115 + t * 90);
                const cur = joints[i], prev = joints[i - 1];
                const ang = Math.atan2(prev.y - cur.y, prev.x - cur.x);
                ctx.save(); ctx.translate(cur.x, cur.y); ctx.rotate(ang);
                ctx.beginPath(); ctx.ellipse(0, 0, bR + 2, bR * 0.7 + 1.2, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,20,0,${alpha * 0.8})`; ctx.fill();
                ctx.beginPath(); ctx.ellipse(0, 0, bR, bR * 0.68, 0, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(-bR * 0.25, -bR * 0.22, 0, 0, 0, bR);
                g.addColorStop(0, `rgba(${80},${green},${40},${alpha})`);
                g.addColorStop(0.55, `rgba(20,${Math.floor(green * 0.75)},15,${alpha})`);
                g.addColorStop(1, `rgba(0,${Math.floor(green * 0.4)},0,${alpha})`);
                ctx.fillStyle = g;
                ctx.shadowBlur = 5; ctx.shadowColor = `rgba(80,200,40,${alpha * 0.4})`;
                ctx.fill(); ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.ellipse(0, bR * 0.18, bR * 0.5, bR * 0.2, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(160,255,120,${alpha * 0.13})`; ctx.fill();
                if (i % 2 === 0 && bR > 5) {
                    const sc = bR * 0.42;
                    ctx.beginPath(); ctx.moveTo(0, -sc); ctx.lineTo(sc * 0.55, 0); ctx.lineTo(0, sc); ctx.lineTo(-sc * 0.55, 0); ctx.closePath();
                    ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.3})`; ctx.lineWidth = 0.6; ctx.stroke();
                    ctx.fillStyle = `rgba(40,120,20,${alpha * 0.2})`; ctx.fill();
                }
                ctx.restore();
            }

            /* Head */
            const h0 = joints[0], h1 = joints[1];
            const hAng = Math.atan2(h0.y - h1.y, h0.x - h1.x);
            ctx.save(); ctx.translate(h0.x, h0.y); ctx.rotate(hAng);
            ctx.beginPath(); ctx.ellipse(0, 0, HEAD_R + 2.5, HEAD_R * 0.78 + 2, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,20,0,0.92)'; ctx.fill();
            ctx.beginPath(); ctx.ellipse(0, 0, HEAD_R, HEAD_R * 0.76, 0, 0, Math.PI * 2);
            const hg = ctx.createRadialGradient(-HEAD_R * 0.32, -HEAD_R * 0.28, 0, 0, 0, HEAD_R);
            hg.addColorStop(0, eating ? '#aaff60' : '#82e455');
            hg.addColorStop(0.5, eating ? '#55cc20' : '#3aaa22');
            hg.addColorStop(1, '#165a08');
            ctx.fillStyle = hg;
            ctx.shadowBlur = eating ? 28 : 18; ctx.shadowColor = eating ? 'rgba(150,255,80,0.95)' : 'rgba(100,220,60,0.7)';
            ctx.fill(); ctx.shadowBlur = 0;
            ctx.strokeStyle = eating ? 'rgba(180,255,100,0.9)' : 'rgba(154,205,50,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
            [1, -1].forEach(s => { ctx.beginPath(); ctx.arc(HEAD_R * 0.72, s * HEAD_R * 0.28, 1.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fill(); });
            [1, -1].forEach(s => {
                ctx.beginPath(); ctx.arc(HEAD_R * 0.28, s * HEAD_R * 0.35, 3.4, 0, Math.PI * 2);
                ctx.fillStyle = eating ? '#ccffaa' : '#e0ffc8'; ctx.fill();
                ctx.beginPath(); ctx.arc(HEAD_R * 0.28 + 1.3, s * HEAD_R * 0.35, 1.8, 0, Math.PI * 2);
                ctx.fillStyle = '#030804'; ctx.fill();
                ctx.beginPath(); ctx.arc(HEAD_R * 0.28 + 0.7, s * HEAD_R * 0.35 - 1.1, 0.9, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
            });
            tongue.current.timer++;
            if (tongue.current.timer > (eating ? 12 : 38)) { tongue.current.out = !tongue.current.out; tongue.current.timer = 0; }
            if (tongue.current.out) {
                const TL = eating ? 20 : 13, FK = eating ? 9 : 5;
                ctx.strokeStyle = eating ? '#ff6688' : '#ff2244'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(HEAD_R, 0); ctx.lineTo(HEAD_R + TL, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(HEAD_R + TL, 0); ctx.lineTo(HEAD_R + TL + FK, -FK * 0.5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(HEAD_R + TL, 0); ctx.lineTo(HEAD_R + TL + FK, FK * 0.5); ctx.stroke();
            }
            ctx.restore();
            animRef.current = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', onResize); };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }} />;
}

/* ── Rank Badge ───────────────────────────────────────────────── */
// No yellow/gold. Rank 1=neon green, Rank 2=cyan, Rank 3=violet
const RANK_CFG = {
    1: { color: '#39FF14', glow: '#39FF1488', label: '1ST' },
    2: { color: '#00e5ff', glow: '#00e5ff88', label: '2ND' },
    3: { color: '#c084fc', glow: '#c084fc88', label: '3RD' },
};
function RankBadge({ rank }) {
    const cfg = RANK_CFG[rank];
    if (cfg) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {rank === 1
                ? <FaTrophy style={{ color: cfg.color, fontSize: '1rem', filter: `drop-shadow(0 0 8px ${cfg.glow})` }} />
                : <FaMedal style={{ color: cfg.color, fontSize: '0.95rem', filter: `drop-shadow(0 0 6px ${cfg.glow})` }} />}
            <span style={{ color: cfg.color, fontSize: '0.7rem', fontWeight: 900, fontFamily: 'Orbitron', lineHeight: 1 }}>{cfg.label}</span>
        </div>
    );
    return <span style={{ color: '#3a6a3a', fontWeight: 800, fontSize: '0.92rem', fontFamily: 'Orbitron' }}>{rank}</span>;
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ClassicLeaderboard() {
    const { id } = useParams();
    const [board, setBoard] = useState([]);
    const [eventName, setEventName] = useState('');
    const [totalPts, setTotalPts] = useState(0);
    const [totalChs, setTotalChs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const containerRef = useRef(null);
    const timerRef = useRef(null);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/event/${id}/leaderboard/`);
            if (res.ok) {
                const json = await res.json();
                setBoard(json.leaderboard || []);
                setEventName(json.event || '');
                setTotalPts(json.event_total_points || 0);
                setTotalChs(json.event_total_challenges || 0);
                setLastUpdated(new Date());
            }
        } catch { }
        finally { if (!silent) setLoading(false); }
    }, [id]);

    useEffect(() => {
        fetchData();
        timerRef.current = setInterval(() => fetchData(true), 15000);
        return () => clearInterval(timerRef.current);
    }, [fetchData]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setFullscreen(true); }
        else { document.exitFullscreen(); setFullscreen(false); }
    };
    useEffect(() => {
        const fn = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', fn);
        return () => document.removeEventListener('fullscreenchange', fn);
    }, []);

    const me = board.find(u => u.is_me);

    return (
        <div ref={containerRef} style={{ minHeight: '100vh', background: '#000401', position: 'relative', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', cursor: 'none' }}>
            <ThreeDBackground />
            <SnakeCursor />

            {/* scan-line overlay */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)', pointerEvents: 'none' }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2, maxWidth: '980px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2.2rem) clamp(0.8rem, 2vw, 1.4rem) 4rem' }}>

                {/* ─── TOP BAR ─── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(1.2rem, 3vw, 2rem)', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: 'clamp(0.58rem, 1.4vw, 0.7rem)', letterSpacing: '4px', color: 'rgba(154,205,50,0.6)', fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase', marginBottom: '6px' }}>
                            ◈ Classic Mode · {eventName}
                        </div>
                        <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4.5vw, 2.8rem)', fontWeight: 900, color: '#9ACD32', fontFamily: 'Orbitron, sans-serif', letterSpacing: '3px', textShadow: '0 0 30px rgba(154,205,50,0.55), 0 0 80px rgba(154,205,50,0.2)', lineHeight: 1 }}>
                            LEADERBOARD
                        </h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Stat chips */}
                        {[{ label: 'MAX PTS', val: totalPts.toLocaleString(), icon: <FaBolt /> }, { label: 'CHALLENGES', val: totalChs, icon: <FaFlag /> }].map(s => (
                            <div key={s.label} style={{ padding: '6px 14px', background: 'rgba(154,205,50,0.06)', border: '1px solid rgba(154,205,50,0.2)', borderRadius: '10px', backdropFilter: 'blur(14px)', textAlign: 'center', minWidth: '76px' }}>
                                <div style={{ fontSize: 'clamp(0.88rem, 1.8vw, 1rem)', fontWeight: 900, color: '#9ACD32', fontFamily: 'Orbitron' }}>{s.val}</div>
                                <div style={{ fontSize: '0.58rem', color: '#3a6a3a', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            </div>
                        ))}
                        <button onClick={() => fetchData()}
                            style={{ padding: '7px 10px', background: 'rgba(154,205,50,0.05)', border: '1px solid rgba(154,205,50,0.15)', borderRadius: '8px', color: '#4a7a4a', cursor: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontFamily: 'Orbitron' }}>
                            <FaSync style={{ fontSize: '0.66rem' }} />
                            {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </button>
                        <button onClick={toggleFullscreen}
                            style={{ padding: '7px 14px', background: 'rgba(154,205,50,0.1)', border: '1px solid rgba(154,205,50,0.35)', borderRadius: '8px', color: '#9ACD32', cursor: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Orbitron' }}>
                            {fullscreen ? <FaCompress /> : <FaExpand />}
                            {fullscreen ? 'EXIT' : 'FULLSCREEN'}
                        </button>
                    </div>
                </div>

                {/* ─── YOUR POSITION ─── */}
                {me && me.rank > 10 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(154,205,50,0.04)', border: '1px solid rgba(154,205,50,0.18)', borderRadius: '10px', padding: '10px 18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', backdropFilter: 'blur(12px)' }}>
                        <span style={{ color: '#9ACD32', fontWeight: 800, fontSize: '0.75rem', fontFamily: 'Orbitron' }}>📍 YOUR RANK</span>
                        <span style={{ color: '#fff', fontWeight: 900, fontFamily: 'Orbitron', fontSize: '1.1rem' }}>#{me.rank}</span>
                        <span style={{ color: '#4a7a4a', fontSize: '0.76rem' }}>{me.points} pts · {me.flags} solves</span>
                        <span style={{ marginLeft: 'auto', color: '#2a5a2a', fontSize: '0.68rem' }}>{formatTime(me.last_solve_time)}</span>
                    </motion.div>
                )}

                {/* ─── CARD ─── */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '6rem 0', color: '#9ACD32', fontFamily: 'Orbitron', letterSpacing: '4px', fontSize: '0.82rem' }}>
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                            LOADING LEADERBOARD...
                        </motion.div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                        {/* outer dark wrapper */}
                        <div style={{ background: 'rgba(0,5,1,0.8)', borderRadius: '20px', padding: '8px', boxShadow: '0 0 120px rgba(0,0,0,0.97), 0 0 40px rgba(154,205,50,0.06)', backdropFilter: 'blur(2px)' }}>
                            {/* inner glassy card */}
                            <div style={{ background: 'rgba(1,6,1,0.98)', border: '1px solid rgba(154,205,50,0.17)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(154,205,50,0.07)' }}>

                                {/* column headers */}
                                <div style={{ display: 'flex', alignItems: 'center', padding: '12px clamp(14px, 2.5vw, 28px)', borderBottom: '1px solid rgba(154,205,50,0.07)', background: 'rgba(154,205,50,0.035)' }}>
                                    {[
                                        { l: 'RANK', f: '0 0 60px', a: 'center' },
                                        { l: 'PLAYER', f: '1 1 180px', a: 'left' },
                                        { l: 'LAST SOLVE', f: '1 1 160px', a: 'left' },
                                        { l: 'FLAGS', f: '0 0 70px', a: 'center' },
                                        { l: 'SCORE', f: '0 0 100px', a: 'center' },
                                    ].map(h => (
                                        <div key={h.l} style={{ flex: h.f, fontSize: '0.6rem', color: 'rgba(154,205,50,0.32)', textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: 700, textAlign: h.a, fontFamily: 'Orbitron' }}>{h.l}</div>
                                    ))}
                                </div>

                                {/* rows */}
                                <AnimatePresence>
                                    {board.map((player, idx) => {
                                        const rank = idx + 1;
                                        const isTop3 = rank <= 3;
                                        const isFirst = rank === 1;
                                        const col = RANK_CFG[rank]?.color || null;

                                        return (
                                            <motion.div key={player.id}
                                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(idx * 0.025, 0.45) }}
                                                style={{
                                                    display: 'flex', alignItems: 'center',
                                                    padding: `${isFirst ? 20 : isTop3 ? 16 : 13}px clamp(14px, 2.5vw, 28px)`,
                                                    borderBottom: '1px solid rgba(154,205,50,0.04)',
                                                    borderLeft: isTop3 ? `3px solid ${col}` : '3px solid transparent',
                                                    background: isFirst
                                                        ? 'linear-gradient(90deg, rgba(57,255,20,0.07) 0%, rgba(57,255,20,0.02) 45%, transparent 75%)'
                                                        : rank === 2 ? 'linear-gradient(90deg, rgba(0,229,255,0.05) 0%, transparent 60%)'
                                                            : rank === 3 ? 'linear-gradient(90deg, rgba(192,132,252,0.05) 0%, transparent 60%)'
                                                                : player.is_me ? 'rgba(154,205,50,0.035)' : 'transparent',
                                                    transition: 'background 0.2s',
                                                }}>

                                                {/* rank */}
                                                <div style={{ flex: '0 0 60px', display: 'flex', justifyContent: 'center' }}>
                                                    <RankBadge rank={rank} />
                                                </div>

                                                {/* player name */}
                                                <div style={{ flex: '1 1 180px', minWidth: 0, paddingRight: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                        <span style={{ color: col || (player.is_me ? '#9ACD32' : '#d0ffd0'), fontWeight: isTop3 || player.is_me ? 800 : 400, fontSize: isFirst ? 'clamp(0.95rem, 2vw, 1.1rem)' : 'clamp(0.84rem, 1.8vw, 0.94rem)', textShadow: col ? `0 0 14px ${col}55` : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: isTop3 ? 'Orbitron, sans-serif' : 'inherit' }}>
                                                            {player.username}
                                                        </span>
                                                        {player.is_me && <span style={{ flexShrink: 0, fontSize: '0.57rem', color: '#9ACD32', background: 'rgba(154,205,50,0.1)', padding: '1px 6px', borderRadius: '8px', border: '1px solid rgba(154,205,50,0.25)', fontWeight: 700 }}>YOU</span>}
                                                    </div>
                                                </div>

                                                {/* last solve */}
                                                <div style={{ flex: '1 1 160px', fontSize: 'clamp(0.66rem, 1.2vw, 0.74rem)', color: isFirst ? '#7acc5a' : '#2a5a2a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                                                    {formatTime(player.last_solve_time)}
                                                </div>

                                                {/* flags */}
                                                <div style={{ flex: '0 0 70px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: col || '#5a9a5a', fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)', fontWeight: 800 }}>
                                                    <FaFlag style={{ fontSize: '0.6rem', opacity: 0.65 }} />{player.flags}
                                                </div>

                                                {/* score */}
                                                <div style={{ flex: '0 0 100px', textAlign: 'center', fontWeight: 900, fontSize: isFirst ? 'clamp(1rem, 2vw, 1.3rem)' : 'clamp(0.85rem, 1.7vw, 0.98rem)', fontFamily: 'Orbitron', color: col || (player.is_me ? '#9ACD32' : '#5a9a5a'), letterSpacing: '0.5px', textShadow: col ? `0 0 16px ${col}77` : 'none' }}>
                                                    {player.points}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {board.length === 0 && (
                                    <div style={{ padding: '5rem', textAlign: 'center', color: '#2a4a2a' }}>
                                        <FaTrophy style={{ fontSize: '2.8rem', opacity: 0.08, marginBottom: '1rem' }} />
                                        <p style={{ margin: 0, fontFamily: 'Orbitron', fontSize: '0.78rem', letterSpacing: '3px' }}>NO SUBMISSIONS YET</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* live badge */}
                        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', fontSize: '0.66rem', color: '#2a5a2a', fontFamily: 'Orbitron' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#9ACD32', display: 'inline-block', animation: 'clpulse 2s infinite', boxShadow: '0 0 10px #9ACD32' }} />
                            LIVE · AUTO-REFRESH 15S
                        </div>
                    </motion.div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;500;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #000401; overflow-x: hidden; }
                :fullscreen { background: #000401; }
                @keyframes clpulse {
                    0%,100% { opacity:1; transform:scale(1); box-shadow:0 0 0 0 rgba(154,205,50,0.5); }
                    50%     { opacity:0.4; transform:scale(0.78); box-shadow:0 0 0 6px rgba(154,205,50,0); }
                }
            `}</style>
        </div>
    );
}
