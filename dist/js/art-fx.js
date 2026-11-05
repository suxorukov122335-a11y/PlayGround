import { TAU, clamp, rgba, rr } from './util.js';

export function drawProjectile(c, p, time) {
  if (!p) return;
  const z = p.z || 0;

  if (z > .5) {
    c.save();
    c.globalAlpha = .18 + Math.min(.32, z / 110);
    c.fillStyle = '#201611';
    c.beginPath();
    c.ellipse(p.x, p.y, 5 + z * .035, 2.5 + z * .015, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  const x = p.x;
  const y = p.y - z;
  const angle = p.angle || 0;

  if (p.kind === 'pebble') {
    c.save();
    c.strokeStyle = 'rgba(245, 201, 123, .3)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - Math.cos(angle) * 13, y - Math.sin(angle) * 13);
    c.lineTo(x, y);
    c.stroke();
    c.fillStyle = '#f3cc82';
    c.beginPath();
    c.arc(x, y, 2.8, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255, 241, 198, .85)';
    c.beginPath();
    c.arc(x - .7, y - .8, 1, 0, TAU);
    c.fill();
    c.restore();
  } else if (p.kind === 'goo') {
    c.save();
    c.strokeStyle = 'rgba(167, 229, 104, .34)';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - Math.cos(angle) * 14, y - Math.sin(angle) * 14);
    c.lineTo(x, y);
    c.stroke();
    c.fillStyle = '#a6da63';
    c.beginPath();
    c.arc(x, y, 4.4, 0, TAU);
    c.fill();
    c.fillStyle = '#dcff97';
    c.beginPath();
    c.arc(x - 1, y - 1, 1.6, 0, TAU);
    c.fill();
    c.restore();
  } else if (p.kind === 'mortar') {
    c.save();
    c.fillStyle = '#b37b54';
    c.beginPath();
    c.arc(x, y, 6.2, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(76, 41, 27, .45)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = '#e1b37d';
    c.beginPath();
    c.arc(x - 1.8, y - 2, 2.1, 0, TAU);
    c.fill();
    c.globalAlpha = .4;
    c.fillStyle = '#593726';
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.arc(x + 7 + i * 4, y + 1 - i * 2, 1.4 + i, 0, TAU);
      c.fill();
    }
    c.restore();
  } else {
    c.save();
    c.fillStyle = '#ffd06a';
    c.beginPath();
    c.arc(x, y, 3.8, 0, TAU);
    c.fill();
    c.restore();
  }
}

export function drawEffect(c, e, time) {
  const life = clamp(e.life / e.maxLife, 0, 1);
  if (e.type === 'ring') {
    const t = 1 - life;
    const radius = e.r0 + (e.r1 - e.r0) * (1 - Math.pow(1 - t, 2));
    c.save();
    c.globalAlpha = life * (e.alpha == null ? .72 : e.alpha);
    c.strokeStyle = e.color || '#ffd36d';
    c.lineWidth = e.width || 2;
    c.beginPath();
    c.arc(e.x, e.y, radius, 0, TAU);
    c.stroke();
    if (e.fill) {
      c.globalAlpha = life * .08;
      c.fillStyle = e.color;
      c.beginPath();
      c.arc(e.x, e.y, radius, 0, TAU);
      c.fill();
    }
    c.restore();
  } else if (e.type === 'beam') {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const alpha = life;
    c.strokeStyle = rgba(e.color || '#ffbb5c', alpha * .16);
    c.lineWidth = (e.width || 10) * 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(e.x1, e.y1);
    c.lineTo(e.x2, e.y2);
    c.stroke();
    c.strokeStyle = rgba(e.color || '#ffbb5c', alpha * .72);
    c.lineWidth = e.width || 8;
    c.stroke();
    c.strokeStyle = rgba('#fff3ce', alpha * .9);
    c.lineWidth = Math.max(1, (e.width || 8) * .28);
    c.stroke();
    c.restore();
  } else if (e.type === 'splash') {
    const t = 1 - life;
    const r = (e.radius || 30) * (.35 + t * .85);
    c.save();
    c.globalAlpha = life * .55;
    c.fillStyle = e.color || '#b87d52';
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.fill();
    c.globalAlpha = life * .8;
    c.strokeStyle = e.color || '#b87d52';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(e.x, e.y, r, 0, TAU);
    c.stroke();
    c.restore();
  } else if (e.type === 'quake') {
    const t = 1 - life;
    for (let i = 0; i < 3; i++) {
      const rr2 = 22 + (e.radius || 100) * (t * .85 + i * .07);
      c.save();
      c.globalAlpha = life * (.52 - i * .12);
      c.strokeStyle = e.color || '#ffd36d';
      c.lineWidth = 2.2 - i * .4;
      c.beginPath();
      c.arc(e.x, e.y, rr2, 0, TAU);
      c.stroke();
      c.restore();
    }
    c.save();
    c.globalAlpha = life * .7;
    c.strokeStyle = '#4f2b1c';
    c.lineWidth = 1.6;
    const cracks = e.cracks || [];
    for (const crack of cracks) {
      c.beginPath();
      c.moveTo(e.x + crack[0], e.y + crack[1]);
      for (let i = 1; i < crack.length; i += 2) {
        c.lineTo(e.x + crack[i], e.y + crack[i + 1]);
      }
      c.stroke();
    }
    c.restore();
  } else if (e.type === 'flash') {
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = life * .5;
    const g = c.createRadialGradient(e.x, e.y, 1, e.x, e.y, e.radius || 40);
    g.addColorStop(0, e.color || '#ffd36d');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(e.x, e.y, e.radius || 40, 0, TAU);
    c.fill();
    c.restore();
  } else if (e.type === 'slamMark') {
    const t = 1 - life;
    c.save();
    c.translate(e.x, e.y);
    c.rotate(t * .08);
    c.globalAlpha = life * .45;
    c.strokeStyle = '#3d2317';
    c.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      c.rotate(TAU / 8);
      c.beginPath();
      c.moveTo(10, 0);
      c.lineTo(26 + t * 28, -2);
      c.lineTo(40 + t * 20, 2);
      c.stroke();
    }
    c.restore();
  }
}

export function drawParticle(c, p) {
  const life = clamp(p.life / p.maxLife, 0, 1);
  if (life <= 0) return;
  c.save();
  c.globalAlpha = life * (p.alpha == null ? 1 : p.alpha);
  if (p.kind === 'smoke') {
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.size * (1.4 - life * .4), 0, TAU);
    c.fill();
  } else if (p.kind === 'shard') {
    c.translate(p.x, p.y);
    c.rotate(p.rot || 0);
    c.fillStyle = p.color;
    rr(c, -p.size * .7, -p.size * .4, p.size * 1.4, p.size * .8, .8);
    c.fill();
  } else {
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(p.x, p.y, p.size * life, 0, TAU);
    c.fill();
  }
  c.restore();
}

export function drawFloatText(c, t) {
  const life = clamp(t.life / t.maxLife, 0, 1);
  c.save();
  c.globalAlpha = Math.min(1, life * 1.9);
  c.fillStyle = t.color || '#ffd47c';
  c.font = `900 ${t.size || 11}px Nunito, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.shadowColor = 'rgba(0,0,0,.5)';
  c.shadowBlur = 3;
  c.fillText(t.text, t.x, t.y - (1 - life) * 22);
  c.restore();
}

export function drawMote(c, m) {
  c.save();
  c.globalAlpha = m.alpha;
  c.fillStyle = m.color;
  c.beginPath();
  c.arc(m.x, m.y, m.size, 0, TAU);
  c.fill();
  c.restore();
}
