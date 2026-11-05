import { TAU, ENEMIES, clamp, rr } from './util.js';

function bodyGradient(c, x0, y0, x1, y1, color, top = 20) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, color);
  g.addColorStop(.55, color);
  g.addColorStop(1, 'rgba(52, 26, 21, .9)');
  return g;
}

function enemyShadow(c, rx, ry, y) {
  c.fillStyle = 'rgba(34, 17, 12, .25)';
  c.beginPath();
  c.ellipse(2, y, rx, ry, 0, 0, TAU);
  c.fill();
}

function drawLegs(c, phase, spread, y, color, length = 7) {
  const swing = Math.sin(phase) * 3.2;
  c.fillStyle = color;
  c.save();
  c.translate(-spread, y);
  c.rotate(swing * .07);
  c.beginPath();
  c.ellipse(0, length * .5, 3.2, length * .65, .08, 0, TAU);
  c.fill();
  c.restore();
  c.save();
  c.translate(spread, y);
  c.rotate(-swing * .07);
  c.beginPath();
  c.ellipse(0, length * .5, 3.2, length * .65, -.08, 0, TAU);
  c.fill();
  c.restore();
}

function drawEyes(c, y, gap, size = 2.1, color = '#ff5f88') {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = 'rgba(255, 63, 113, .32)';
  c.beginPath();
  c.arc(-gap, y, size * 2.3, 0, TAU);
  c.arc(gap, y, size * 2.3, 0, TAU);
  c.fill();
  c.restore();
  c.fillStyle = color;
  c.beginPath();
  c.arc(-gap, y, size, 0, TAU);
  c.arc(gap, y, size, 0, TAU);
  c.fill();
  c.fillStyle = '#ffe6e8';
  c.beginPath();
  c.arc(-gap + .55, y - .7, size * .34, 0, TAU);
  c.arc(gap + .55, y - .7, size * .34, 0, TAU);
  c.fill();
}

function drawRunt(c, e, phase) {
  const body = bodyGradient(c, -13, -30, 12, -2, '#c47759');
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(0, -16, 12.5, 15, -.04, 0, TAU);
  c.fill();
  c.strokeStyle = 'rgba(75, 35, 26, .42)';
  c.lineWidth = 1.1;
  c.stroke();

  c.fillStyle = 'rgba(255, 218, 171, .27)';
  c.beginPath();
  c.ellipse(-4, -24, 4.4, 3.2, -.6, 0, TAU);
  c.fill();

  c.fillStyle = '#9b523d';
  c.beginPath();
  c.moveTo(-11, -24);
  c.lineTo(-15, -33);
  c.lineTo(-6, -28);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(11, -24);
  c.lineTo(15, -33);
  c.lineTo(6, -28);
  c.closePath();
  c.fill();

  c.strokeStyle = 'rgba(82, 38, 28, .34)';
  c.lineWidth = .9;
  c.beginPath();
  c.moveTo(-9, -11);
  c.lineTo(-4, -8);
  c.lineTo(-1, -12);
  c.lineTo(4, -8);
  c.stroke();

  drawEyes(c, -19, 4.3, 2);
  c.strokeStyle = '#4a241e';
  c.lineWidth = 1.1;
  c.beginPath();
  c.arc(0, -13, 3.4, .25, Math.PI - .25);
  c.stroke();

  c.fillStyle = '#7e4434';
  c.beginPath();
  c.arc(-8, -11, 2.4, 0, TAU);
  c.arc(8, -11, 2.4, 0, TAU);
  c.fill();

  if (e.type === 'splitter') return;
}

function drawRunner(c, e, phase) {
  drawLegs(c, phase, 4.5, -2, '#8e503c', 8);
  const body = bodyGradient(c, -8, -35, 8, -5, '#d68f5d');
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-7, -8);
  c.quadraticCurveTo(-11, -23, -3, -29);
  c.quadraticCurveTo(0, -32, 3, -29);
  c.quadraticCurveTo(11, -23, 7, -8);
  c.quadraticCurveTo(0, -3, -7, -8);
  c.fill();
  c.strokeStyle = 'rgba(78, 39, 26, .4)';
  c.lineWidth = 1;
  c.stroke();

  c.strokeStyle = '#3e6e66';
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-7, -24);
  c.quadraticCurveTo(-16 - Math.sin(phase) * 2, -19, -12, -13);
  c.stroke();
  c.fillStyle = '#5ca194';
  c.beginPath();
  c.moveTo(-8, -25);
  c.lineTo(-15, -30);
  c.lineTo(-15, -20);
  c.closePath();
  c.fill();

  c.beginPath();
  c.arc(0, -33, 7.5, 0, TAU);
  c.fillStyle = '#e3a16a';
  c.fill();
  c.strokeStyle = 'rgba(79, 39, 26, .4)';
  c.lineWidth = 1;
  c.stroke();

  c.fillStyle = '#7f4537';
  c.beginPath();
  c.arc(-6, -38, 2.8, 0, TAU);
  c.arc(6, -38, 2.8, 0, TAU);
  c.fill();

  drawEyes(c, -35, 3.2, 1.75);
  c.strokeStyle = '#5d3125';
  c.lineWidth = .9;
  c.beginPath();
  c.moveTo(-2.6, -30);
  c.lineTo(2.6, -30);
  c.stroke();

  c.fillStyle = '#b96a4e';
  c.beginPath();
  c.ellipse(9, -17, 3.5, 6, .2, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(-9, -17, 3.5, 6, -.2, 0, TAU);
  c.fill();
}

function drawBrute(c, e, phase) {
  drawLegs(c, phase, 10, -2, '#713f34', 9);
  const body = bodyGradient(c, -22, -45, 22, -2, '#a95e4c');
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-22, -38);
  c.quadraticCurveTo(-25, -12, -15, -5);
  c.quadraticCurveTo(0, 2, 15, -5);
  c.quadraticCurveTo(25, -12, 22, -38);
  c.quadraticCurveTo(14, -47, 0, -46);
  c.quadraticCurveTo(-14, -47, -22, -38);
  c.fill();
  c.strokeStyle = 'rgba(67, 29, 23, .45)';
  c.lineWidth = 1.3;
  c.stroke();

  c.fillStyle = '#8a4e40';
  c.beginPath();
  c.arc(-23, -33, 8, 0, TAU);
  c.arc(23, -33, 8, 0, TAU);
  c.fill();

  c.fillStyle = '#bf7459';
  c.beginPath();
  c.ellipse(-16, -38, 9, 6, -.45, 0, TAU);
  c.ellipse(16, -38, 9, 6, .45, 0, TAU);
  c.fill();

  c.fillStyle = '#693b30';
  c.beginPath();
  c.ellipse(0, -51, 11, 9, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#cf8765';
  c.beginPath();
  c.ellipse(0, -49, 9, 7, 0, 0, TAU);
  c.fill();

  drawEyes(c, -50, 3.8, 1.9);
  c.fillStyle = '#5b2d25';
  c.beginPath();
  c.moveTo(-7, -44);
  c.lineTo(-3, -41);
  c.lineTo(0, -44);
  c.lineTo(3, -41);
  c.lineTo(7, -44);
  c.lineTo(4, -39);
  c.lineTo(0, -42);
  c.lineTo(-4, -39);
  c.closePath();
  c.fill();

  c.strokeStyle = 'rgba(63, 27, 22, .45)';
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(-17, -18);
  c.lineTo(-10, -25);
  c.lineTo(-4, -20);
  c.moveTo(16, -14);
  c.lineTo(11, -22);
  c.stroke();

  c.fillStyle = '#9b5847';
  c.beginPath();
  c.ellipse(-25, -12, 7, 10, .3, 0, TAU);
  c.ellipse(25, -12, 7, 10, -.3, 0, TAU);
  c.fill();
}

function drawSplitter(c, e, phase) {
  const wob = Math.sin(phase * .9) * .04;
  c.save();
  c.rotate(wob);
  const body = c.createLinearGradient(-16, -31, 16, -2);
  body.addColorStop(0, '#a9c56f');
  body.addColorStop(.5, '#83a055');
  body.addColorStop(1, '#5f7542');
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-17, -22);
  c.quadraticCurveTo(-22, -8, -10, -4);
  c.quadraticCurveTo(0, 1, 10, -4);
  c.quadraticCurveTo(22, -8, 17, -22);
  c.quadraticCurveTo(12, -36, 0, -37);
  c.quadraticCurveTo(-12, -36, -17, -22);
  c.fill();
  c.strokeStyle = 'rgba(51, 58, 30, .45)';
  c.lineWidth = 1.2;
  c.stroke();

  c.fillStyle = 'rgba(218, 242, 159, .3)';
  c.beginPath();
  c.ellipse(-7, -29, 6, 3.7, -.4, 0, TAU);
  c.fill();

  for (let i = 0; i < 4; i++) {
    const bx = -10 + i * 7;
    const by = -24 - (i % 2) * 5;
    c.beginPath();
    c.arc(bx, by, 2.2 + (i % 2), 0, TAU);
    c.fillStyle = '#c2dd83';
    c.fill();
    c.strokeStyle = 'rgba(63, 72, 35, .3)';
    c.lineWidth = .7;
    c.stroke();
  }

  drawEyes(c, -19, 4.4, 1.9, '#dfff71');
  c.strokeStyle = '#3d4929';
  c.lineWidth = 1.1;
  c.beginPath();
  c.arc(0, -13, 3.5, .2, Math.PI - .2);
  c.stroke();

  c.strokeStyle = 'rgba(52, 64, 29, .5)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-8, -8);
  c.lineTo(-3, -3);
  c.moveTo(8, -7);
  c.lineTo(3, -2);
  c.stroke();
  c.restore();
}

function drawBoss(c, e, phase, time) {
  const pulse = .5 + .5 * Math.sin(time * 2.8);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const aura = c.createRadialGradient(0, -40, 8, 0, -40, 76);
  aura.addColorStop(0, `rgba(255, 69, 131, ${.14 + pulse * .07})`);
  aura.addColorStop(1, 'rgba(255, 69, 131, 0)');
  c.fillStyle = aura;
  c.beginPath();
  c.arc(0, -40, 76, 0, TAU);
  c.fill();
  c.restore();

  c.strokeStyle = `rgba(255, 88, 140, ${.26 + pulse * .18})`;
  c.lineWidth = 1.7;
  c.beginPath();
  c.arc(0, 2, 31 + pulse * 4, 0, TAU);
  c.stroke();

  drawLegs(c, phase, 14, -2, '#5f2f42', 12);

  const body = c.createLinearGradient(-28, -58, 26, -2);
  body.addColorStop(0, '#a65b7b');
  body.addColorStop(.55, '#84435f');
  body.addColorStop(1, '#572d42');
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(-27, -44);
  c.quadraticCurveTo(-31, -16, -18, -5);
  c.quadraticCurveTo(0, 3, 18, -5);
  c.quadraticCurveTo(31, -16, 27, -44);
  c.quadraticCurveTo(17, -59, 0, -58);
  c.quadraticCurveTo(-17, -59, -27, -44);
  c.fill();
  c.strokeStyle = 'rgba(45, 20, 30, .55)';
  c.lineWidth = 1.6;
  c.stroke();

  c.fillStyle = '#71364f';
  c.beginPath();
  c.arc(-28, -38, 11, 0, TAU);
  c.arc(28, -38, 11, 0, TAU);
  c.fill();
  c.fillStyle = '#9b5370';
  c.beginPath();
  c.ellipse(-27, -17, 10, 15, .38, 0, TAU);
  c.ellipse(27, -17, 10, 15, -.38, 0, TAU);
  c.fill();

  c.fillStyle = '#6c354c';
  c.beginPath();
  c.ellipse(0, -66, 14, 12, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#b56c85';
  c.beginPath();
  c.ellipse(0, -64, 11.5, 9, 0, 0, TAU);
  c.fill();

  drawEyes(c, -65, 5, 2.2, '#ff4c8c');
  c.fillStyle = '#3b1422';
  c.beginPath();
  c.moveTo(-9, -56);
  c.lineTo(-4, -52);
  c.lineTo(0, -56);
  c.lineTo(4, -52);
  c.lineTo(9, -56);
  c.lineTo(5, -49);
  c.lineTo(0, -53);
  c.lineTo(-5, -49);
  c.closePath();
  c.fill();

  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(255, 79, 135, ${.4 + pulse * .5})`;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-17, -40);
  c.lineTo(-9, -31);
  c.lineTo(-13, -20);
  c.lineTo(-4, -12);
  c.stroke();
  c.beginPath();
  c.moveTo(17, -33);
  c.lineTo(10, -24);
  c.lineTo(15, -14);
  c.stroke();
  c.restore();

  c.fillStyle = '#5e2d42';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI + i * (Math.PI / 4);
    const x = Math.cos(a) * 16;
    const y = -80 + Math.sin(a) * 6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * 10, y - 11 - (i % 2) * 5);
    c.lineTo(x + Math.cos(a + .2) * 8, y + 3);
    c.closePath();
    c.fill();
  }

  c.strokeStyle = 'rgba(255, 200, 109, .8)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, -66, 14.5, Math.PI * 1.08, Math.PI * 1.92);
  c.stroke();
  c.restore();
}

function drawHealthBar(c, e, def, height) {
  if (e.hp >= e.maxHp && !def.boss) return;
  const boss = def.boss;
  const w = boss ? 66 : 28;
  const y = -height - (boss ? 17 : 8);
  c.save();
  c.fillStyle = 'rgba(8, 17, 14, .76)';
  rr(c, -w / 2, y, w, boss ? 5.5 : 3.6, 3);
  c.fill();
  const ratio = clamp(e.hp / e.maxHp, 0, 1);
  const color = ratio > .55 ? '#68d9a6' : ratio > .25 ? '#f0bd5f' : '#ff6c78';
  c.fillStyle = color;
  rr(c, -w / 2 + .8, y + .8, Math.max(0, (w - 1.6) * ratio), (boss ? 5.5 : 3.6) - 1.6, 2);
  c.fill();
  if (boss) {
    c.fillStyle = '#ffb26b';
    c.font = '900 6px Nunito, sans-serif';
    c.textAlign = 'center';
    c.fillText('THE AUDITOR', 0, y - 5);
  }
  c.restore();
}

export function drawEnemy(c, e, time, gameTime) {
  const def = ENEMIES[e.type];
  const phase = e.walkPhase || 0;
  const stunned = (e.stunUntil || 0) > gameTime;
  const slowed = (e.slowUntil || 0) > gameTime;
  const hit = e.hitFlash || 0;
  const heights = { runt: 33, runner: 38, brute: 56, splitter: 39, boss: 86 };
  const height = heights[e.type] || 35;
  const bob = stunned ? Math.sin(time * 9) * .4 : Math.sin(phase * 2) * 1.2;

  c.save();
  c.translate(e.x, e.y);

  const shadowScale = e.type === 'boss' ? 1.7 : e.type === 'brute' ? 1.3 : 1;
  enemyShadow(c, 12 * shadowScale, 4.5 * shadowScale, 4);

  if (slowed) {
    c.fillStyle = 'rgba(120, 203, 84, .2)';
    c.beginPath();
    c.ellipse(0, 3, 16, 6, 0, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(163, 235, 111, .42)';
    c.lineWidth = 1;
    c.setLineDash([3, 4]);
    c.beginPath();
    c.arc(0, 3, 18, 0, TAU);
    c.stroke();
    c.setLineDash([]);
  }

  if (hit > 0) {
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = hit * .35;
    c.fillStyle = '#ffd0ac';
    c.beginPath();
    c.arc(0, -height * .45, height * .56, 0, TAU);
    c.fill();
    c.restore();
  }

  c.translate(0, bob);
  if (e.type === 'runt') drawRunt(c, e, phase);
  else if (e.type === 'runner') drawRunner(c, e, phase);
  else if (e.type === 'brute') drawBrute(c, e, phase);
  else if (e.type === 'splitter') drawSplitter(c, e, phase);
  else drawBoss(c, e, phase, time);

  if (stunned) {
    c.save();
    c.translate(0, -height - 4);
    for (let i = 0; i < 3; i++) {
      const a = time * 4 + i * TAU / 3;
      const x = Math.cos(a) * 13;
      const y = Math.sin(a) * 4;
      c.fillStyle = 'rgba(255, 218, 111, .9)';
      c.beginPath();
      for (let k = 0; k < 5; k++) {
        const sa = -Math.PI / 2 + k * TAU / 5;
        const px = x + Math.cos(sa) * 3;
        const py = y + Math.sin(sa) * 3;
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  if (e.type === 'splitter') {
    const pulse = .5 + .5 * Math.sin(time * 3 + e.seed);
    c.strokeStyle = `rgba(210, 255, 134, ${.22 + pulse * .2})`;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, -19, 22 + pulse * 2, 0, TAU);
    c.stroke();
  }

  c.restore();
  drawHealthBar(c, e, def, height);
}

export function drawEnemyDeathMark(c, x, y, time) {
  c.save();
  c.translate(x, y);
  c.globalAlpha = .3;
  c.fillStyle = '#4b2b23';
  c.beginPath();
  c.ellipse(0, 0, 12, 4, 0, 0, TAU);
  c.fill();
  c.restore();
}
