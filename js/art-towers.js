import { TAU, TOWERS, rr, shade, rgba } from './util.js';

function shadow(c, rx = 19, ry = 7, y = 6) {
  c.fillStyle = 'rgba(44, 24, 16, .26)';
  c.beginPath();
  c.ellipse(2, y, rx, ry, 0, 0, TAU);
  c.fill();
}

function drawEyes(c, x, y, gap, color = '#2f1b14') {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x - gap, y, 1.8, 0, TAU);
  c.arc(x + gap, y, 1.8, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(255, 240, 200, .8)';
  c.beginPath();
  c.arc(x - gap + .55, y - .55, .55, 0, TAU);
  c.arc(x + gap + .55, y - .55, .55, 0, TAU);
  c.fill();
}

function drawLevelRing(c, level, time, accent) {
  if (!level || level < 1) return;
  c.save();
  c.globalAlpha = .8;
  c.strokeStyle = accent;
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, 2, 27, .16, Math.PI - .16);
  c.stroke();
  for (let i = 0; i < level; i++) {
    const a = Math.PI * .78 + i * .44;
    c.fillStyle = accent;
    c.beginPath();
    c.arc(Math.cos(a) * 27, 2 + Math.sin(a) * 27, 1.7, 0, TAU);
    c.fill();
  }
  c.restore();
}

function drawSlinger(c, level, angle, recoil, time) {
  const bob = Math.sin(time * 2.1) * .9;
  c.save();
  c.translate(0, bob);

  c.fillStyle = '#78503b';
  rr(c, -8, -4, 6, 8, 3);
  c.fill();
  rr(c, 2, -4, 6, 8, 3);
  c.fill();

  const body = c.createLinearGradient(-14, -29, 13, -7);
  body.addColorStop(0, level > 2 ? '#ffc47f' : '#eeb66a');
  body.addColorStop(.55, level > 2 ? '#e89e5d' : '#d99453');
  body.addColorStop(1, '#a95e3e');
  c.beginPath();
  c.ellipse(0, -17, 15, 16, -.05, 0, TAU);
  c.fillStyle = body;
  c.fill();
  c.strokeStyle = 'rgba(80, 39, 25, .5)';
  c.lineWidth = 1.3;
  c.stroke();

  c.beginPath();
  c.ellipse(-5, -24, 5.5, 4, -.6, 0, TAU);
  c.fillStyle = 'rgba(255, 231, 183, .42)';
  c.fill();

  drawEyes(c, 0, -20, 4.3);
  c.strokeStyle = '#542e22';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, -15, 3.8, .25, Math.PI - .25);
  c.stroke();

  c.strokeStyle = '#9b5d3d';
  c.lineWidth = 4.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-11, -13);
  c.lineTo(-18, -8);
  c.stroke();

  c.save();
  c.translate(5, -20);
  c.rotate(angle);
  c.translate(-recoil * 3.5, 0);
  c.fillStyle = '#804a32';
  rr(c, -2, -4.6, 23, 9, 4);
  c.fill();
  c.fillStyle = '#d99250';
  rr(c, 0, -4, 17, 7, 3);
  c.fill();
  c.fillStyle = '#c57846';
  c.beginPath();
  c.arc(21, 0, 4.8, 0, TAU);
  c.fill();
  c.fillStyle = '#5b3425';
  c.beginPath();
  c.arc(21, 0, 2.2, 0, TAU);
  c.fill();
  c.fillStyle = '#f4cf8b';
  c.beginPath();
  c.arc(18, -1.3, 1.4, 0, TAU);
  c.fill();
  c.restore();

  if (level > 1) {
    c.strokeStyle = '#5d8f7e';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-13, -26);
    c.quadraticCurveTo(-19, -19, -12, -12);
    c.stroke();
    c.fillStyle = '#71d6bd';
    c.beginPath();
    c.moveTo(14, -28);
    c.lineTo(19, -34);
    c.lineTo(20, -25);
    c.closePath();
    c.fill();
  }

  if (level > 2) {
    c.fillStyle = '#ffd477';
    for (let i = 0; i < 3; i++) {
      const a = -.9 + i * .9;
      c.beginPath();
      c.moveTo(Math.cos(a) * 14, -17 + Math.sin(a) * 14);
      c.lineTo(Math.cos(a) * 22, -17 + Math.sin(a) * 22);
      c.lineTo(Math.cos(a + .16) * 14, -17 + Math.sin(a + .16) * 14);
      c.closePath();
      c.fill();
    }
  }

  c.restore();
}

function drawMortar(c, level, angle, recoil, time) {
  const bob = Math.sin(time * 1.75 + .7) * .7;
  c.save();
  c.translate(0, bob);

  c.fillStyle = '#754a32';
  rr(c, -11, -4, 8, 9, 3);
  c.fill();
  rr(c, 3, -4, 8, 9, 3);
  c.fill();

  const body = c.createLinearGradient(-18, -26, 16, -2);
  body.addColorStop(0, '#d8a269');
  body.addColorStop(.5, '#bd7e4e');
  body.addColorStop(1, '#8c553a');
  rr(c, -18, -24, 36, 22, 10);
  c.fillStyle = body;
  c.fill();
  c.strokeStyle = 'rgba(74, 35, 22, .48)';
  c.lineWidth = 1.4;
  c.stroke();

  c.fillStyle = 'rgba(255, 224, 173, .35)';
  c.beginPath();
  c.ellipse(-7, -21, 7, 3.5, -.25, 0, TAU);
  c.fill();

  drawEyes(c, 0, -17, 5.2);
  c.strokeStyle = '#60382a';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-4, -10);
  c.quadraticCurveTo(0, -8.5, 4, -10);
  c.stroke();

  c.save();
  c.translate(0, -25);
  c.rotate(angle);
  c.translate(-recoil * 4, 0);
  c.fillStyle = '#75442f';
  rr(c, -6, -7, 23, 14, 6);
  c.fill();
  c.fillStyle = '#a96b45';
  rr(c, -4, -5, 17, 10, 4);
  c.fill();
  c.fillStyle = '#4e2e23';
  c.beginPath();
  c.ellipse(17, 0, 5, 6, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#d68a50';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(17, 0, 6, 7, 0, 0, TAU);
  c.stroke();
  c.restore();

  if (level > 1) {
    c.strokeStyle = 'rgba(69, 43, 28, .5)';
    c.lineWidth = 1.2;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(i * 9, -24);
      c.lineTo(i * 9, -5);
      c.stroke();
    }
    c.fillStyle = '#f0c570';
    c.beginPath();
    c.arc(-13, -5, 2, 0, TAU);
    c.arc(13, -5, 2, 0, TAU);
    c.fill();
  }

  if (level > 2) {
    c.fillStyle = '#7f5540';
    rr(c, -10, -31, 20, 5, 2);
    c.fill();
    c.fillStyle = '#ffb35f';
    c.beginPath();
    c.arc(0, -29, 1.6, 0, TAU);
    c.fill();
  }

  c.restore();
}

function drawGoo(c, level, angle, recoil, time) {
  const bob = Math.sin(time * 2 + 1.8) * .7;
  c.save();
  c.translate(0, bob);

  c.globalCompositeOperation = 'lighter';
  const glow = c.createRadialGradient(0, -18, 2, 0, -18, 26);
  glow.addColorStop(0, 'rgba(153, 226, 105, .2)');
  glow.addColorStop(1, 'rgba(153, 226, 105, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, -18, 26, 0, TAU);
  c.fill();
  c.globalCompositeOperation = 'source-over';

  c.fillStyle = '#62452f';
  rr(c, -12, -3, 7, 8, 2);
  c.fill();
  rr(c, 5, -3, 7, 8, 2);
  c.fill();

  const pot = c.createLinearGradient(-17, -26, 16, -4);
  pot.addColorStop(0, '#a8b468');
  pot.addColorStop(.45, '#7d9757');
  pot.addColorStop(1, '#526a3f');
  c.beginPath();
  c.moveTo(-18, -22);
  c.quadraticCurveTo(-21, -6, 0, -3);
  c.quadraticCurveTo(21, -6, 18, -22);
  c.closePath();
  c.fillStyle = pot;
  c.fill();
  c.strokeStyle = 'rgba(53, 54, 31, .55)';
  c.lineWidth = 1.3;
  c.stroke();

  c.beginPath();
  c.ellipse(0, -22, 18, 8, 0, 0, TAU);
  c.fillStyle = '#415633';
  c.fill();
  c.beginPath();
  c.ellipse(0, -22, 14, 5.3, 0, 0, TAU);
  c.fillStyle = '#9ddb65';
  c.fill();
  c.beginPath();
  c.ellipse(-4, -23, 8, 2.5, -.2, 0, TAU);
  c.fillStyle = 'rgba(211, 255, 155, .65)';
  c.fill();

  for (let i = 0; i < 3; i++) {
    const a = time * 1.8 + i * 2.1;
    const bx = Math.cos(a) * (3 + i * 4);
    const by = -23 - Math.sin(a) * (2 + i);
    c.beginPath();
    c.arc(bx, by, 1.2 + (i % 2) * .7, 0, TAU);
    c.fillStyle = '#c9f58a';
    c.fill();
  }

  drawEyes(c, 0, -14, 5, '#24321f');
  c.strokeStyle = '#344629';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, -10, 3.5, .3, Math.PI - .3);
  c.stroke();

  c.save();
  c.translate(11, -18);
  c.rotate(angle);
  c.translate(-recoil * 3, 0);
  c.fillStyle = '#6d7d4b';
  rr(c, -2, -3.4, 17, 6.8, 3);
  c.fill();
  c.fillStyle = '#b8e478';
  c.beginPath();
  c.arc(16, 0, 3.5, 0, TAU);
  c.fill();
  c.restore();

  c.strokeStyle = '#5b6e40';
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(-17, -14, 5, .5, 2.7);
  c.stroke();
  c.beginPath();
  c.arc(17, -14, 5, -2.7, -.5);
  c.stroke();

  if (level > 1) {
    c.fillStyle = '#d7ff94';
    for (let i = 0; i < level; i++) {
      c.beginPath();
      c.arc(-12 + i * 12, -5, 1.25, 0, TAU);
      c.fill();
    }
  }

  if (level > 2) {
    c.fillStyle = '#e6c36d';
    c.beginPath();
    c.arc(0, -27, 2.4, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(255, 235, 162, .65)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, -27, 5.5, 0, TAU);
    c.stroke();
  }

  c.restore();
}

function drawKiln(c, level, angle, recoil, time) {
  const pulse = .5 + .5 * Math.sin(time * 3.2);
  c.save();
  c.translate(0, Math.sin(time * 1.8 + 2.2) * .45);

  c.globalCompositeOperation = 'lighter';
  const glow = c.createRadialGradient(0, -26, 2, 0, -26, 32);
  glow.addColorStop(0, `rgba(255, 143, 78, ${.12 + pulse * .08})`);
  glow.addColorStop(1, 'rgba(255, 143, 78, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, -26, 32, 0, TAU);
  c.fill();
  c.globalCompositeOperation = 'source-over';

  c.fillStyle = '#704532';
  rr(c, -11, -3, 7, 8, 2);
  c.fill();
  rr(c, 4, -3, 7, 8, 2);
  c.fill();

  const body = c.createLinearGradient(-16, -52, 15, -3);
  body.addColorStop(0, '#dd8b62');
  body.addColorStop(.45, '#bd654b');
  body.addColorStop(1, '#8e4838');
  c.beginPath();
  c.moveTo(-13, -53);
  c.quadraticCurveTo(-19, -44, -17, -5);
  c.quadraticCurveTo(0, 3, 17, -5);
  c.quadraticCurveTo(19, -44, 13, -53);
  c.closePath();
  c.fillStyle = body;
  c.fill();
  c.strokeStyle = 'rgba(68, 29, 22, .5)';
  c.lineWidth = 1.4;
  c.stroke();

  c.fillStyle = '#e8a47b';
  rr(c, -14, -56, 28, 7, 3);
  c.fill();
  c.fillStyle = '#8c4b39';
  rr(c, -9, -60, 18, 5, 2);
  c.fill();

  c.strokeStyle = 'rgba(82, 37, 27, .28)';
  c.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(-13 + i * 7, -51);
    c.lineTo(-12 + i * 7, -8);
    c.stroke();
  }

  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = `rgba(255, 187, 89, ${.4 + pulse * .4})`;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-8, -37);
  c.lineTo(-3, -30);
  c.lineTo(-7, -23);
  c.lineTo(0, -17);
  c.stroke();
  c.beginPath();
  c.moveTo(10, -14);
  c.lineTo(7, -21);
  c.lineTo(12, -27);
  c.stroke();
  c.restore();

  c.beginPath();
  c.ellipse(0, -18, 7, 5.3, 0, 0, TAU);
  c.fillStyle = '#45281f';
  c.fill();
  c.fillStyle = `rgba(255, 178, 70, ${.5 + pulse * .4})`;
  c.beginPath();
  c.arc(-2.6, -18, 1.2, 0, TAU);
  c.arc(2.6, -18, 1.2, 0, TAU);
  c.fill();

  c.save();
  c.translate(0, -30);
  c.rotate(angle);
  c.translate(-recoil * 4, 0);
  c.fillStyle = '#71422f';
  rr(c, 4, -5.5, 20, 11, 4);
  c.fill();
  c.fillStyle = '#c36a4a';
  rr(c, 5, -4, 16, 8, 3);
  c.fill();
  c.fillStyle = '#ffb459';
  c.beginPath();
  c.arc(22, 0, 3.2, 0, TAU);
  c.fill();
  c.restore();

  c.fillStyle = 'rgba(255, 182, 101, .38)';
  for (let i = 0; i < 3; i++) {
    const t = (time * .55 + i * .33) % 1;
    c.globalAlpha = (1 - t) * .45;
    c.beginPath();
    c.arc(-4 + i * 4, -62 - t * 18, 2 + t * 3, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;

  if (level > 1) {
    c.strokeStyle = '#f3c36c';
    c.lineWidth = 1.3;
    c.beginPath();
    c.arc(0, -6, 13.5, .15, Math.PI - .15);
    c.stroke();
  }
  if (level > 2) {
    c.fillStyle = '#ffd376';
    c.beginPath();
    c.moveTo(-14, -53);
    c.lineTo(-19, -62);
    c.lineTo(-10, -57);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(14, -53);
    c.lineTo(19, -62);
    c.lineTo(10, -57);
    c.closePath();
    c.fill();
  }

  c.restore();
}

export function drawTowerArt(c, type, level = 1, angle = -.4, recoil = 0, time = 0, scale = 1) {
  const def = TOWERS[type];
  c.save();
  c.scale(scale, scale);
  shadow(c, type === 'kiln' ? 17 : 19, 6.5, 6);
  c.save();
  if (type === 'slinger') drawSlinger(c, level, angle, recoil, time);
  else if (type === 'mortar') drawMortar(c, level, angle, recoil, time);
  else if (type === 'goo') drawGoo(c, level, angle, recoil, time);
  else drawKiln(c, level, angle, recoil, time);
  c.restore();
  drawLevelRing(c, level, time, def.accent);
  c.restore();
}

export function drawTower(c, tower, time, selected = false) {
  const bob = Math.sin(time * 2 + tower.seed) * .5;
  c.save();
  c.translate(tower.x, tower.y + bob);
  if (tower.scaleIn < 1) {
    const s = Math.max(.01, tower.scaleIn);
    c.scale(s, s);
  }
  if (selected) {
    c.save();
    c.strokeStyle = 'rgba(255, 212, 118, .85)';
    c.lineWidth = 1.6;
    c.setLineDash([5, 7]);
    c.lineDashOffset = -time * 12;
    c.beginPath();
    c.arc(0, 4, 30, 0, TAU);
    c.stroke();
    c.restore();
  }
  drawTowerArt(c, tower.type, tower.level, tower.angle, tower.recoil, time, 1);
  if (tower.rally > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const r = 20 + Math.sin(time * 4) * 4;
    c.strokeStyle = `rgba(255, 209, 110, ${.22 + Math.sin(time * 5) * .08})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -13, r, 0, TAU);
    c.stroke();
    c.restore();
  }
  c.restore();
}

export function drawTowerIcon(canvas, type, level = 1) {
  const c = canvas.getContext('2d');
  const size = canvas.width;
  c.clearRect(0, 0, size, size);
  const scale = size / 96;
  c.save();
  c.translate(size * .5, size * .80);
  c.scale(scale * 1.45, scale * 1.45);
  if (type === 'kiln') c.translate(0, 7);
  drawTowerArt(c, type, level, -.52, 0, 1.2, 1);
  c.restore();
}

export function drawTowerAura(c, x, y, color = '#ffd36d') {
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, -8, 2, 0, -8, 38);
  g.addColorStop(0, rgba(color, .16));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, -8, 38, 0, TAU);
  c.fill();
  c.restore();
}
