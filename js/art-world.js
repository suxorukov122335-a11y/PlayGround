import { TAU, clamp, seeded, rr, shade, rgba, smoothPath, ENEMIES, TOWERS } from './util.js';

const BOARD_SCALE = 2;

function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function padClearOfBuilding(pad, b, extra = 16) {
  const cx = clamp(pad.x, b.x, b.x + b.w);
  const cy = clamp(pad.y, b.y - b.height, b.y + b.h);
  return Math.hypot(pad.x - cx, pad.y - cy) > 30 + extra;
}

function buildingClear(layout, b, accepted) {
  if (b.x < 20 || b.y < 20 || b.x + b.w > layout.w - 20 || b.y + b.h > layout.h - 18) return false;
  if (Math.hypot(b.x + b.w / 2 - layout.core.x, b.y + b.h / 2 - layout.core.y) < layout.core.r + 54) return false;
  for (const pad of layout.pads) {
    if (!padClearOfBuilding(pad, b)) return false;
  }
  const pad = 12;
  const rx = b.x - pad;
  const ry = b.y - b.height - pad;
  const rw = b.w + pad * 2;
  const rh = b.h + b.height + pad * 2;
  for (const lane of layout.lanes) {
    for (const seg of lane.segments) {
      const steps = Math.max(2, Math.ceil(seg.length / 9));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = seg.a.x + (seg.b.x - seg.a.x) * t;
        const py = seg.a.y + (seg.b.y - seg.a.y) * t;
        if (px > rx && px < rx + rw && py > ry && py < ry + rh) return false;
      }
    }
  }
  for (const a of accepted) {
    if (b.x < a.x + a.w + 7 && b.x + b.w + 7 > a.x && b.y < a.y + a.h + 7 && b.y + b.h + 7 > a.y) return false;
  }
  return true;
}

function drawBoardSurface(c, layout) {
  const { x, y, w, h } = layout.board;
  c.save();
  c.translate(0, 20);
  rr(c, x, y, w, h, layout.board.radius + 3);
  c.fillStyle = 'rgba(0, 8, 7, .48)';
  c.shadowColor = 'rgba(0, 0, 0, .52)';
  c.shadowBlur = 44;
  c.shadowOffsetY = 20;
  c.fill();
  c.restore();

  rr(c, x, y + 12, w, h, layout.board.radius);
  c.fillStyle = '#7d4c34';
  c.fill();

  const grad = c.createLinearGradient(x, y, x + w * .7, y + h);
  grad.addColorStop(0, '#c68b5d');
  grad.addColorStop(.36, '#ba7c51');
  grad.addColorStop(.73, '#ad704b');
  grad.addColorStop(1, '#96603f');
  rr(c, x, y, w, h, layout.board.radius);
  c.fillStyle = grad;
  c.fill();

  c.save();
  rr(c, x + 8, y + 8, w - 16, h - 16, layout.board.radius - 8);
  c.strokeStyle = 'rgba(255, 222, 171, .28)';
  c.lineWidth = 4;
  c.stroke();
  c.strokeStyle = 'rgba(73, 36, 22, .28)';
  c.lineWidth = 1.2;
  c.stroke();
  c.restore();

  c.save();
  rr(c, x + 2, y + 2, w - 4, h - 4, layout.board.radius);
  c.strokeStyle = 'rgba(255, 231, 186, .42)';
  c.lineWidth = 3;
  c.stroke();
  c.restore();

  const rand = seeded(118);
  for (let i = 0; i < 28; i++) {
    const px = x + 22 + rand() * (w - 44);
    const py = y + 18 + rand() * (h - 36);
    c.beginPath();
    c.ellipse(px, py, 8 + rand() * 25, 4 + rand() * 12, rand() * TAU, 0, TAU);
    c.fillStyle = rand() > .5 ? 'rgba(255, 218, 160, .035)' : 'rgba(74, 34, 20, .035)';
    c.fill();
  }
}

function drawRoads(c, layout) {
  const road = layout.roadWidth;
  const lanes = layout.lanes;

  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';

  c.translate(0, 6);
  for (const lane of lanes) {
    smoothPath(c, lane.points);
    c.strokeStyle = 'rgba(37, 19, 14, .25)';
    c.lineWidth = road + 28;
    c.stroke();
  }
  c.restore();

  for (const lane of lanes) {
    smoothPath(c, lane.points);
    c.strokeStyle = '#e1c18b';
    c.lineWidth = road + 18;
    c.stroke();
  }
  for (const lane of lanes) {
    smoothPath(c, lane.points);
    c.strokeStyle = '#a77e56';
    c.lineWidth = road + 13;
    c.stroke();
  }
  for (const lane of lanes) {
    smoothPath(c, lane.points);
    c.strokeStyle = '#424441';
    c.lineWidth = road;
    c.stroke();
  }
  for (const lane of lanes) {
    smoothPath(c, lane.points);
    c.strokeStyle = '#4c4d48';
    c.lineWidth = road - 6;
    c.stroke();
  }

  c.save();
  c.setLineDash([13, 23]);
  for (const lane of lanes) {
    smoothPath(c, lane.points);
    c.strokeStyle = 'rgba(241, 213, 161, .5)';
    c.lineWidth = 2.1;
    c.stroke();
  }
  c.restore();

  const rand = seeded(207);
  for (const lane of lanes) {
    for (let d = 60; d < lane.total; d += 58 + rand() * 60) {
      const p = pointOnLaneLocal(lane, d);
      const a = p.angle + Math.PI / 2;
      const off = (rand() - .5) * (road - 20);
      const px = p.x + Math.cos(a) * off;
      const py = p.y + Math.sin(a) * off;
      c.save();
      c.translate(px, py);
      c.rotate(p.angle + rand() * .7);
      c.strokeStyle = 'rgba(22, 24, 22, .32)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-7 - rand() * 6, 0);
      c.lineTo(-1, -2 + rand() * 4);
      c.lineTo(4, 1);
      c.lineTo(10 + rand() * 5, -1);
      c.stroke();
      c.restore();
    }
  }

  for (const lane of lanes) {
    const p = pointOnLaneLocal(lane, 94);
    drawCrosswalk(c, p, road);
  }

  for (const lane of lanes) {
    const p = pointOnLaneLocal(lane, lane.total - 102);
    drawLaneArrow(c, p, road);
  }
}

function pointOnLaneLocal(lane, distance) {
  let d = clamp(distance, 0, lane.total);
  for (const s of lane.segments) {
    if (d <= s.from + s.length) {
      const t = (d - s.from) / Math.max(s.length, .001);
      return {
        x: s.a.x + (s.b.x - s.a.x) * t,
        y: s.a.y + (s.b.y - s.a.y) * t,
        angle: Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x)
      };
    }
  }
  return { x: lane.points[0].x, y: lane.points[0].y, angle: 0 };
}

function drawCrosswalk(c, p, road) {
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.angle);
  c.fillStyle = 'rgba(237, 213, 165, .28)';
  for (let i = -3; i <= 3; i++) {
    rr(c, i * 8 - 2.5, -road / 2 + 9, 4, road - 18, 2);
    c.fill();
  }
  c.restore();
}

function drawLaneArrow(c, p, road) {
  c.save();
  c.translate(p.x, p.y);
  c.rotate(p.angle);
  c.fillStyle = 'rgba(234, 208, 158, .23)';
  c.beginPath();
  c.moveTo(18, 0);
  c.lineTo(-10, -9);
  c.lineTo(-4, 0);
  c.lineTo(-10, 9);
  c.closePath();
  c.fill();
  c.restore();
}

function drawSidewalk(c, x, y, w, h, r = 8) {
  c.save();
  rr(c, x - 8, y - 6, w + 16, h + 15, r + 4);
  c.fillStyle = 'rgba(62, 34, 22, .16)';
  c.fill();
  rr(c, x - 7, y - 8, w + 14, h + 14, r + 3);
  c.fillStyle = '#d5b47f';
  c.fill();
  c.strokeStyle = 'rgba(111, 73, 46, .5)';
  c.lineWidth = 1.2;
  c.stroke();
  c.restore();
}

function drawBuilding(c, b, index) {
  const rand = seeded(1000 + index * 87);
  const roofY = b.y - b.height;
  const radius = Math.min(9, b.w / 6, b.h / 6);

  drawSidewalk(c, b.x, b.y, b.w, b.h, radius);

  c.save();
  rr(c, b.x + 8, b.y - b.height + 10, b.w, b.h + b.height, radius);
  c.fillStyle = 'rgba(46, 22, 15, .25)';
  c.fill();
  c.restore();

  rr(c, b.x, roofY, b.w, b.h + b.height, radius);
  c.fillStyle = shade(b.color, -54);
  c.fill();

  rr(c, b.x, roofY, b.w, b.h + b.height * .72, radius);
  c.fillStyle = shade(b.color, -25);
  c.fill();

  const faceTop = b.y + b.h - b.height * .62;
  if (b.height > 12) {
    const faceGrad = c.createLinearGradient(0, faceTop, 0, b.y + b.h);
    faceGrad.addColorStop(0, shade(b.color, -14));
    faceGrad.addColorStop(1, shade(b.color, -48));
    rr(c, b.x + 2, faceTop, b.w - 4, b.y + b.h - faceTop - 2, 4);
    c.fillStyle = faceGrad;
    c.fill();

    const cols = Math.max(1, Math.floor(b.w / 24));
    const rows = b.height > 21 ? 2 : 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = b.x + 9 + col * ((b.w - 18) / cols);
        const wy = faceTop + 5 + row * 8;
        if (wy + 3 > b.y + b.h - 3) continue;
        c.fillStyle = rand() > .26 ? 'rgba(255, 205, 120, .55)' : 'rgba(36, 38, 33, .42)';
        rr(c, wx, wy, Math.max(3, (b.w - 22) / cols - 4), 3, 1);
        c.fill();
      }
    }
  }

  const roofGrad = c.createLinearGradient(b.x, roofY, b.x + b.w, roofY + b.h);
  roofGrad.addColorStop(0, shade(b.color, 16));
  roofGrad.addColorStop(.55, b.color);
  roofGrad.addColorStop(1, shade(b.color, -20));
  rr(c, b.x, roofY, b.w, b.h, radius);
  c.fillStyle = roofGrad;
  c.fill();
  c.strokeStyle = 'rgba(57, 28, 18, .35)';
  c.lineWidth = 1.2;
  c.stroke();

  c.save();
  rr(c, b.x + 2, roofY + 2, b.w - 4, b.h - 4, Math.max(2, radius - 2));
  c.strokeStyle = 'rgba(255, 239, 205, .22)';
  c.lineWidth = 1.4;
  c.stroke();
  c.restore();

  c.strokeStyle = 'rgba(58, 31, 20, .2)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(b.x + b.w * .22, roofY + 7);
  c.lineTo(b.x + b.w * .28, roofY + b.h * .36);
  c.lineTo(b.x + b.w * .18, roofY + b.h * .53);
  c.stroke();

  if (b.kind === 'office') {
    const vx = b.x + b.w * .25;
    const vy = roofY + b.h * .26;
    c.fillStyle = 'rgba(35, 44, 40, .34)';
    rr(c, vx, vy, Math.max(12, b.w * .20), Math.max(8, b.h * .20), 2);
    c.fill();
    c.fillStyle = 'rgba(176, 208, 189, .35)';
    for (let i = 0; i < 3; i++) {
      c.fillRect(vx + 3 + i * 6, vy + 3, 2, Math.max(3, b.h * .11));
    }
    c.fillStyle = '#d6b271';
    c.beginPath();
    c.arc(b.x + b.w * .72, roofY + b.h * .32, Math.max(3, b.w * .035), 0, TAU);
    c.fill();
  } else if (b.kind === 'shop') {
    const ax = b.x + b.w * .70;
    const ay = roofY + b.h * .25;
    c.fillStyle = 'rgba(73, 45, 29, .45)';
    rr(c, ax, ay, Math.max(10, b.w * .18), Math.max(7, b.h * .19), 2);
    c.fill();
    c.fillStyle = 'rgba(242, 205, 137, .62)';
    rr(c, ax + 2, ay + 2, Math.max(6, b.w * .11), Math.max(3, b.h * .07), 1);
    c.fill();
    c.strokeStyle = 'rgba(61, 34, 21, .3)';
    c.beginPath();
    c.moveTo(b.x + b.w * .2, roofY + b.h * .7);
    c.lineTo(b.x + b.w * .5, roofY + b.h * .7);
    c.stroke();
  } else {
    const gx = b.x + b.w * .5;
    const gy = roofY + b.h * .42;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(gx - 9 + i * 9, gy + (i % 2) * 4, 4 + rand() * 2.3, 0, TAU);
      c.fillStyle = i % 2 ? '#72885a' : '#849c63';
      c.fill();
    }
  }

  if (b.height > 17) {
    const tx = b.x + b.w * .78;
    const ty = roofY + b.h * .70;
    c.fillStyle = 'rgba(63, 37, 24, .34)';
    c.beginPath();
    c.ellipse(tx + 3, ty + 4, 7, 3, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#8b5b3f';
    rr(c, tx - 5, ty - 8, 10, 12, 3);
    c.fill();
    c.fillStyle = '#c39363';
    rr(c, tx - 5, ty - 9, 9, 4, 2);
    c.fill();
  }

  c.save();
  c.globalAlpha = .16;
  c.strokeStyle = '#fff3d5';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(b.x + 5, roofY + b.h - 4);
  c.lineTo(b.x + b.w - 5, roofY + b.h - 4);
  c.stroke();
  c.restore();
}

function drawTree(c, tree) {
  const s = tree.s || 1;
  c.save();
  c.translate(tree.x, tree.y);
  c.fillStyle = 'rgba(42, 22, 14, .2)';
  c.beginPath();
  c.ellipse(4, 7 * s, 12 * s, 5 * s, 0, 0, TAU);
  c.fill();
  c.fillStyle = '#6e4a2f';
  rr(c, -2.2 * s, -5 * s, 4.4 * s, 12 * s, 2 * s);
  c.fill();
  const blobs = [
    [-7, -9, 8.5, '#6f8756'],
    [4, -11, 9, '#7f9a63'],
    [0, -19, 7.5, '#8fa96d']
  ];
  for (const [bx, by, br, color] of blobs) {
    c.beginPath();
    c.arc(bx * s, by * s, br * s, 0, TAU);
    c.fillStyle = color;
    c.fill();
  }
  c.beginPath();
  c.arc(-3 * s, -21 * s, 3 * s, 0, TAU);
  c.fillStyle = 'rgba(199, 225, 156, .48)';
  c.fill();
  c.restore();
}

function drawCar(c, car) {
  c.save();
  c.translate(car.x, car.y);
  c.rotate(car.angle);
  c.fillStyle = 'rgba(31, 18, 13, .2)';
  rr(c, -13, -5, 28, 13, 5);
  c.fill();
  c.fillStyle = car.color;
  rr(c, -15, -6, 30, 12, 5);
  c.fill();
  c.fillStyle = shade(car.color, -30);
  rr(c, -7, -4.5, 13, 9, 3);
  c.fill();
  c.fillStyle = 'rgba(219, 237, 213, .55)';
  rr(c, -5, -3.5, 9, 7, 2);
  c.fill();
  c.fillStyle = '#f7d486';
  c.beginPath();
  c.arc(14, -2.5, 1.7, 0, TAU);
  c.arc(14, 2.5, 1.7, 0, TAU);
  c.fill();
  c.restore();
}

function drawLamp(c, lamp) {
  c.save();
  c.translate(lamp.x, lamp.y);
  c.fillStyle = 'rgba(34, 19, 12, .18)';
  c.beginPath();
  c.ellipse(4, 9, 7, 3, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#5e4b36';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 7);
  c.lineTo(0, -12);
  c.stroke();
  c.fillStyle = '#f4bf66';
  c.beginPath();
  c.arc(0, -14, 3, 0, TAU);
  c.fill();
  c.globalAlpha = .2;
  c.beginPath();
  c.arc(0, -14, 9, 0, TAU);
  c.fillStyle = '#ffcf7a';
  c.fill();
  c.restore();
}

function drawCrane(c, crane) {
  c.save();
  c.translate(crane.x, crane.y);
  c.globalAlpha = .85;
  c.strokeStyle = '#d2a246';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, 10);
  c.lineTo(0, -50);
  c.lineTo(58, -38);
  c.moveTo(0, -50);
  c.lineTo(-33, -43);
  c.stroke();
  c.strokeStyle = 'rgba(77, 54, 26, .45)';
  c.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(0, -46 + i * 11);
    c.lineTo(8 + i * 10, -45 + i * 2);
    c.stroke();
  }
  c.fillStyle = '#b76040';
  rr(c, -9, -4, 18, 14, 3);
  c.fill();
  c.strokeStyle = '#513a25';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(55, -38);
  c.lineTo(55, -17);
  c.stroke();
  c.fillStyle = '#e4b967';
  rr(c, 50, -18, 10, 5, 2);
  c.fill();
  c.restore();
}

function drawPadBase(c, layout, pad) {
  const r = layout.padRadius;
  c.save();
  c.translate(pad.x, pad.y + 4);
  c.fillStyle = 'rgba(44, 23, 15, .22)';
  c.beginPath();
  c.ellipse(2, 4, r + 5, r * .76, 0, 0, TAU);
  c.fill();
  c.restore();

  c.beginPath();
  c.arc(pad.x, pad.y, r, 0, TAU);
  c.fillStyle = '#805237';
  c.fill();
  c.strokeStyle = '#5a3826';
  c.lineWidth = 2.4;
  c.stroke();

  c.beginPath();
  c.arc(pad.x, pad.y, r - 5, 0, TAU);
  c.fillStyle = '#6c4530';
  c.fill();

  c.save();
  c.setLineDash([5, 6]);
  c.beginPath();
  c.arc(pad.x, pad.y, r - 10, 0, TAU);
  c.strokeStyle = 'rgba(242, 208, 148, .62)';
  c.lineWidth = 1.6;
  c.stroke();
  c.restore();

  c.strokeStyle = 'rgba(248, 217, 159, .3)';
  c.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + Math.PI / 4;
    c.beginPath();
    c.moveTo(pad.x + Math.cos(a) * (r - 17), pad.y + Math.sin(a) * (r - 17));
    c.lineTo(pad.x + Math.cos(a) * (r - 8), pad.y + Math.sin(a) * (r - 8));
    c.stroke();
  }

  c.save();
  c.translate(pad.x + r * .48, pad.y + r * .38);
  c.rotate(-.2);
  c.fillStyle = '#c47e4b';
  rr(c, -9, -3, 9, 5, 1.5);
  c.fill();
  c.fillStyle = '#d9965d';
  rr(c, 0, -5, 9, 5, 1.5);
  c.fill();
  c.fillStyle = '#b46b42';
  rr(c, -4, -8, 9, 5, 1.5);
  c.fill();
  c.restore();
}

function drawRiftBase(c, layout, rift) {
  const angle = Math.atan2(layout.core.y - rift.y, layout.core.x - rift.x);
  c.save();
  c.translate(rift.x, rift.y);
  c.rotate(angle);

  c.fillStyle = 'rgba(50, 17, 28, .26)';
  c.beginPath();
  c.ellipse(0, 0, 56, 30, 0, 0, TAU);
  c.fill();

  c.beginPath();
  c.moveTo(-34, -13);
  c.lineTo(-17, -22);
  c.lineTo(-2, -15);
  c.lineTo(15, -25);
  c.lineTo(36, -10);
  c.lineTo(20, 0);
  c.lineTo(35, 15);
  c.lineTo(9, 18);
  c.lineTo(-8, 25);
  c.lineTo(-22, 11);
  c.lineTo(-37, 17);
  c.lineTo(-28, 2);
  c.closePath();
  c.fillStyle = '#291d20';
  c.fill();
  c.strokeStyle = 'rgba(255, 89, 132, .28)';
  c.lineWidth = 2;
  c.stroke();

  c.beginPath();
  c.ellipse(-2, 2, 22, 10, 0, 0, TAU);
  c.fillStyle = '#140f14';
  c.fill();
  c.strokeStyle = 'rgba(255, 94, 141, .76)';
  c.lineWidth = 1.5;
  c.stroke();

  c.strokeStyle = 'rgba(255, 94, 141, .42)';
  c.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    const sx = -17 + i * 12;
    c.moveTo(sx, 1);
    c.lineTo(sx - 8, -10 - i * 3);
    c.lineTo(sx - 14, -13 - i * 5);
    c.stroke();
  }
  c.restore();
}

function drawPlaza(c, layout) {
  const { x, y, r } = layout.core;
  c.save();
  c.fillStyle = 'rgba(53, 29, 19, .2)';
  c.beginPath();
  c.ellipse(x + 3, y + 16, r + 45, (r + 42) * .55, 0, 0, TAU);
  c.fill();

  c.beginPath();
  c.arc(x, y, r + 39, 0, TAU);
  c.fillStyle = '#d9ba85';
  c.fill();
  c.strokeStyle = '#a77d55';
  c.lineWidth = 3;
  c.stroke();

  c.beginPath();
  c.arc(x, y, r + 29, 0, TAU);
  c.fillStyle = '#e7cca0';
  c.fill();
  c.strokeStyle = 'rgba(155, 111, 73, .5)';
  c.lineWidth = 1.3;
  c.stroke();

  const segments = 18;
  for (let i = 0; i < segments; i++) {
    const a = i * TAU / segments;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3));
    c.lineTo(x + Math.cos(a) * (r + 27), y + Math.sin(a) * (r + 27));
    c.strokeStyle = i % 3 === 0 ? 'rgba(151, 104, 67, .36)' : 'rgba(151, 104, 67, .18)';
    c.lineWidth = 1;
    c.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + Math.PI / 4;
    const px = x + Math.cos(a) * (r + 31);
    const py = y + Math.sin(a) * (r + 31);
    c.save();
    c.translate(px, py);
    c.rotate(a + Math.PI / 2);
    c.fillStyle = 'rgba(59, 35, 23, .25)';
    c.beginPath();
    c.ellipse(0, 4, 8, 3, 0, 0, TAU);
    c.fill();
    c.strokeStyle = '#69523d';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 1);
    c.lineTo(0, -20);
    c.stroke();
    c.fillStyle = '#bc6347';
    c.beginPath();
    c.moveTo(1, -20);
    c.quadraticCurveTo(10, -18, 11, -12);
    c.quadraticCurveTo(5, -13, 1, -11);
    c.closePath();
    c.fill();
    c.restore();
  }

  c.restore();
}

function drawTexture(c, layout) {
  const rand = seeded(7101);
  for (let i = 0; i < 760; i++) {
    const x = 24 + rand() * (layout.w - 48);
    const y = 22 + rand() * (layout.h - 44);
    const size = .5 + rand() * 1.6;
    c.globalAlpha = .025 + rand() * .07;
    c.fillStyle = rand() > .5 ? '#2f1c14' : '#ffe0a9';
    c.beginPath();
    c.arc(x, y, size, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;

  c.save();
  c.strokeStyle = 'rgba(60, 32, 21, .13)';
  c.lineWidth = 1.2;
  for (let i = 0; i < 13; i++) {
    const x = 35 + rand() * (layout.w - 70);
    const y = 28 + rand() * (layout.h - 56);
    if (Math.hypot(x - layout.core.x, y - layout.core.y) < 120) continue;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 7 + rand() * 12, y + 4);
    c.lineTo(x + 13 + rand() * 9, y - 3);
    c.stroke();
  }
  c.restore();
}

export function buildBoard(layout) {
  if (layout._boardCanvas) return layout._boardCanvas;
  const c = document.createElement('canvas');
  c.width = layout.w * BOARD_SCALE;
  c.height = layout.h * BOARD_SCALE;
  const g = c.getContext('2d');
  g.scale(BOARD_SCALE, BOARD_SCALE);

  drawBoardSurface(g, layout);
  drawRoads(g, layout);

  for (const car of layout.cars) drawCar(g, car);
  for (const lamp of layout.lamps) drawLamp(g, lamp);

  const accepted = [];
  const sorted = [...layout.buildings].sort((a, b) => (a.y + a.h) - (b.y + b.h));
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    if (!buildingClear(layout, b, accepted)) continue;
    accepted.push(b);
    drawBuilding(g, b, i);
  }

  drawCrane(g, layout.crane);
  drawPlaza(g, layout);
  for (const tree of layout.trees) drawTree(g, tree);

  for (const pad of layout.pads) drawPadBase(g, layout, pad);
  for (const rift of layout.rifts) drawRiftBase(g, layout, rift);

  drawTexture(g, layout);
  layout._boardCanvas = c;
  return c;
}

export function paintTable(c, width, height) {
  const rand = seeded(812);
  const bg = c.createRadialGradient(width * .5, height * .42, 10, width * .5, height * .5, Math.max(width, height) * .78);
  bg.addColorStop(0, '#19443d');
  bg.addColorStop(.45, '#0f2d28');
  bg.addColorStop(.8, '#081d1a');
  bg.addColorStop(1, '#041210');
  c.fillStyle = bg;
  c.fillRect(0, 0, width, height);

  c.save();
  c.globalCompositeOperation = 'screen';
  const glow = c.createRadialGradient(width * .5, height * .34, 0, width * .5, height * .36, width * .45);
  glow.addColorStop(0, 'rgba(255, 173, 102, .10)');
  glow.addColorStop(.55, 'rgba(59, 150, 126, .035)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = glow;
  c.fillRect(0, 0, width, height);
  c.restore();

  c.save();
  c.globalAlpha = .08;
  c.strokeStyle = '#8fb59c';
  c.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const y = rand() * height;
    c.beginPath();
    c.moveTo(0, y);
    c.bezierCurveTo(width * .3, y + rand() * 20 - 10, width * .7, y + rand() * 22 - 11, width, y + rand() * 12 - 6);
    c.stroke();
  }
  c.restore();

  for (let i = 0; i < 70; i++) {
    const x = rand() * width;
    const y = rand() * height;
    if (x > width * .15 && x < width * .85 && y > height * .08 && y < height * .92) continue;
    c.globalAlpha = .05 + rand() * .12;
    c.fillStyle = rand() > .6 ? '#db9a63' : '#afc6aa';
    c.beginPath();
    c.ellipse(x, y, 1 + rand() * 3, .6 + rand() * 1.7, rand() * TAU, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;

  c.save();
  const vignette = c.createRadialGradient(width * .5, height * .48, Math.min(width, height) * .3, width * .5, height * .5, Math.max(width, height) * .72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(.74, 'rgba(0, 0, 0, .12)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, .48)');
  c.fillStyle = vignette;
  c.fillRect(0, 0, width, height);
  c.restore();
}

export function drawCore(c, layout, time, healthRatio, flash) {
  const { x, y } = layout.core;
  const pulse = .5 + .5 * Math.sin(time * 2.1);
  const r = layout.core.r;

  c.save();
  c.globalCompositeOperation = 'lighter';
  const glow = c.createRadialGradient(x, y - 8, 5, x, y - 8, 105);
  glow.addColorStop(0, `rgba(255, 198, 93, ${.19 + pulse * .1})`);
  glow.addColorStop(.55, 'rgba(255, 138, 69, .045)');
  glow.addColorStop(1, 'rgba(255, 138, 69, 0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(x, y - 8, 108, 0, TAU);
  c.fill();
  c.restore();

  c.save();
  c.translate(x, y + 2);
  c.fillStyle = 'rgba(49, 25, 16, .28)';
  c.beginPath();
  c.ellipse(0, 34, 48, 14, 0, 0, TAU);
  c.fill();

  c.fillStyle = '#bf8454';
  rr(c, -36, 21, 72, 18, 7);
  c.fill();
  c.fillStyle = '#dba56c';
  rr(c, -33, 22, 66, 6, 3);
  c.fill();
  c.fillStyle = '#9d6240';
  rr(c, -30, 30, 60, 8, 4);
  c.fill();

  const beat = 1 + Math.sin(time * 2.2) * .035;
  c.translate(0, -1);
  c.scale(beat, beat);

  const heart = (scale) => {
    c.beginPath();
    c.moveTo(0, 38 * scale);
    c.bezierCurveTo(34 * scale, 13 * scale, 35 * scale, -24 * scale, 10 * scale, -25 * scale);
    c.bezierCurveTo(2 * scale, -25 * scale, 0, -19 * scale, 0, -14 * scale);
    c.bezierCurveTo(0, -19 * scale, -2 * scale, -25 * scale, -10 * scale, -25 * scale);
    c.bezierCurveTo(-35 * scale, -24 * scale, -34 * scale, 13 * scale, 0, 38 * scale);
    c.closePath();
  };

  c.shadowColor = 'rgba(255, 147, 77, .5)';
  c.shadowBlur = 24;
  heart(1.05);
  c.fillStyle = '#a9452f';
  c.fill();
  c.shadowBlur = 0;

  heart(1);
  const hg = c.createLinearGradient(-25, -25, 20, 35);
  hg.addColorStop(0, '#ff9c66');
  hg.addColorStop(.48, '#e46543');
  hg.addColorStop(1, '#bd4934');
  c.fillStyle = hg;
  c.fill();
  c.strokeStyle = 'rgba(88, 34, 24, .54)';
  c.lineWidth = 2;
  c.stroke();

  c.beginPath();
  c.ellipse(-11, -8, 8, 5, -.55, 0, TAU);
  c.fillStyle = 'rgba(255, 226, 180, .42)';
  c.fill();

  c.fillStyle = 'rgba(98, 38, 27, .52)';
  if (healthRatio < .7) {
    c.beginPath();
    c.moveTo(-8, 24);
    c.lineTo(-12, 13);
    c.lineTo(-5, 7);
    c.lineTo(-8, -2);
    c.strokeStyle = 'rgba(84, 29, 21, .55)';
    c.lineWidth = 2;
    c.stroke();
  }
  if (healthRatio < .4) {
    c.beginPath();
    c.moveTo(19, 10);
    c.lineTo(14, 1);
    c.lineTo(21, -7);
    c.strokeStyle = 'rgba(84, 29, 21, .55)';
    c.lineWidth = 1.8;
    c.stroke();
  }

  c.globalAlpha = .78;
  c.fillStyle = '#ffd374';
  c.beginPath();
  c.arc(-8, -2, 2.2, 0, TAU);
  c.arc(8, -2, 2.2, 0, TAU);
  c.fill();
  c.restore();

  const ringR = r + 42;
  c.save();
  c.strokeStyle = 'rgba(39, 23, 17, .26)';
  c.lineWidth = 5;
  c.beginPath();
  c.arc(x, y, ringR, 0, TAU);
  c.stroke();
  c.strokeStyle = healthRatio > .35 ? '#5ad6b8' : '#ff8068';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(x, y, ringR, -Math.PI / 2, -Math.PI / 2 + TAU * healthRatio);
  c.stroke();
  c.restore();

  if (flash > 0) {
    c.save();
    c.globalAlpha = flash * .52;
    c.globalCompositeOperation = 'screen';
    c.fillStyle = '#ff8f7d';
    c.beginPath();
    c.arc(x, y - 2, 88, 0, TAU);
    c.fill();
    c.restore();
  }
}

export function drawPadGlow(c, layout, pad, time, active, valid) {
  const r = layout.padRadius;
  c.save();
  c.translate(pad.x, pad.y);
  const pulse = .5 + .5 * Math.sin(time * 3 + pad.i);
  if (active) {
    c.globalAlpha = .28 + pulse * .2;
    c.strokeStyle = valid ? '#ffe08a' : '#ff7b82';
    c.lineWidth = 2;
    c.setLineDash([5, 6]);
    c.beginPath();
    c.arc(0, 0, r + 6 + pulse * 3, time * .5, TAU + time * .5);
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = .75 + pulse * .25;
    c.fillStyle = valid ? '#ffe3a0' : '#ff9b9b';
    c.font = '900 15px Nunito, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('+', 0, -1);
  } else if (valid) {
    c.globalAlpha = .08 + pulse * .04;
    c.fillStyle = '#ffe08a';
    c.beginPath();
    c.arc(0, 0, r + 2, 0, TAU);
    c.fill();
  }
  c.restore();
}

export function drawRiftGlow(c, layout, rift, time) {
  const a = Math.atan2(layout.core.y - rift.y, layout.core.x - rift.x);
  c.save();
  c.translate(rift.x, rift.y);
  c.rotate(a);
  c.globalCompositeOperation = 'lighter';
  const pulse = .5 + .5 * Math.sin(time * 2.3 + rift.x * .02);
  const g = c.createRadialGradient(0, 0, 2, 0, 0, 55);
  g.addColorStop(0, `rgba(255, 73, 126, ${.18 + pulse * .09})`);
  g.addColorStop(1, 'rgba(255, 73, 126, 0)');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, 58, 32, 0, 0, TAU);
  c.fill();
  c.restore();
}

export function drawRange(c, x, y, range, color = '#67e5cb', time = 0, valid = true) {
  c.save();
  c.translate(x, y);
  c.globalAlpha = .08;
  c.fillStyle = valid ? color : '#ff6d7e';
  c.beginPath();
  c.arc(0, 0, range, 0, TAU);
  c.fill();
  c.globalAlpha = .52;
  c.strokeStyle = valid ? color : '#ff6d7e';
  c.lineWidth = 1.5;
  c.setLineDash([6, 9]);
  c.lineDashOffset = -time * 12;
  c.beginPath();
  c.arc(0, 0, range, 0, TAU);
  c.stroke();
  c.setLineDash([]);
  c.globalAlpha = .34;
  c.beginPath();
  c.arc(0, 0, range - 4, 0, TAU);
  c.strokeStyle = 'rgba(255,255,255,.45)';
  c.lineWidth = .7;
  c.stroke();
  c.restore();
}

export function drawHealthPips(c, layout, coreHp, maxHp) {
  c.save();
  c.translate(layout.core.x, layout.core.y + layout.core.r + 64);
  const count = 10;
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 10;
    const on = (i + 1) / count <= coreHp / maxHp + .0001;
    c.fillStyle = on ? '#f2c36f' : 'rgba(47, 26, 18, .28)';
    c.beginPath();
    c.arc(x, 0, 2.6, 0, TAU);
    c.fill();
  }
  c.restore();
}

export function drawTargetReticle(c, x, y, radius, time) {
  c.save();
  c.translate(x, y);
  c.rotate(time * .6);
  c.strokeStyle = '#ffd478';
  c.globalAlpha = .9;
  c.lineWidth = 2;
  c.setLineDash([8, 7]);
  c.beginPath();
  c.arc(0, 0, radius, 0, TAU);
  c.stroke();
  c.setLineDash([]);
  c.globalAlpha = .35;
  c.fillStyle = '#ffd478';
  c.beginPath();
  c.arc(0, 0, radius, 0, TAU);
  c.fill();
  c.rotate(-time * 1.2);
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    c.beginPath();
    c.moveTo(radius - 13, 0);
    c.lineTo(radius + 2, 0);
    c.stroke();
  }
  c.restore();
}

export function drawSpawnPulse(c, layout, time) {
  for (let i = 0; i < layout.rifts.length; i++) {
    const rift = layout.rifts[i];
    const a = Math.atan2(layout.core.y - rift.y, layout.core.x - rift.x);
    const pulse = (time * .5 + i * .5) % 1;
    c.save();
    c.translate(rift.x, rift.y);
    c.rotate(a);
    c.globalAlpha = (1 - pulse) * .3;
    c.strokeStyle = '#ff6188';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(0, 0, 30 + pulse * 28, 14 + pulse * 12, 0, 0, TAU);
    c.stroke();
    c.restore();
  }
}
