export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const pad2 = (n) => String(n).padStart(2, '0');
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function rr(c, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.arcTo(x + w, y, x + w, y + h, radius);
  c.arcTo(x + w, y + h, x, y + h, radius);
  c.arcTo(x, y + h, x, y, radius);
  c.arcTo(x, y, x + w, y, radius);
  c.closePath();
}

export function shade(hex, amount) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(x => x + x).join('') : value;
  const n = parseInt(full, 16);
  const r = clamp((n >> 16) + amount, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount, 0, 255);
  const b = clamp((n & 255) + amount, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function rgba(hex, alpha) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map(x => x + x).join('') : value;
  const n = parseInt(full, 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function smoothPath(c, pts) {
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    c.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  const last = pts[pts.length - 1];
  c.lineTo(last.x, last.y);
}

export function makeLane(points) {
  const segments = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const length = dist(a.x, a.y, b.x, b.y);
    segments.push({ a, b, length, from: total });
    total += length;
  }
  return { points, segments, total };
}

export function pointOnLane(lane, distance) {
  const d = clamp(distance, 0, lane.total);
  for (const s of lane.segments) {
    if (d <= s.from + s.length) {
      const t = (d - s.from) / Math.max(s.length, .0001);
      return {
        x: lerp(s.a.x, s.b.x, t),
        y: lerp(s.a.y, s.b.y, t),
        angle: Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x)
      };
    }
  }
  const end = lane.points[lane.points.length - 1];
  return { x: end.x, y: end.y, angle: 0 };
}

export const TOWERS = {
  slinger: {
    name: 'Pebble Spitter',
    short: 'SPITTER',
    cost: 50,
    range: 205,
    damage: 11,
    rate: .52,
    color: '#e7ad5e',
    accent: '#75d7c5',
    blurb: 'Rapid single-target clay shot.'
  },
  mortar: {
    name: 'Mud Mortar',
    short: 'MORTAR',
    cost: 85,
    range: 230,
    damage: 27,
    rate: 1.62,
    splash: 58,
    color: '#bd8358',
    accent: '#ff9a62',
    blurb: 'Lobs heavy mud with splash damage.'
  },
  goo: {
    name: 'Sap Pot',
    short: 'SAP POT',
    cost: 65,
    range: 175,
    damage: 4,
    rate: .98,
    splash: 46,
    slow: .55,
    slowTime: 2.1,
    color: '#83b45f',
    accent: '#b6ef78',
    blurb: 'Sticky sap slows the whole pack.'
  },
  kiln: {
    name: 'Kiln Lance',
    short: 'KILN',
    cost: 125,
    range: 265,
    damage: 48,
    rate: 1.34,
    splash: 24,
    color: '#d56b4f',
    accent: '#ffd06a',
    blurb: 'Long-range searing clay beam.'
  }
};

export const ENEMIES = {
  runt: {
    name: 'Runt',
    hp: 44,
    speed: 44,
    reward: 5,
    coreDamage: 1,
    radius: 11,
    color: '#bf6a50',
    accent: '#ff5f88'
  },
  runner: {
    name: 'Runner',
    hp: 31,
    speed: 76,
    reward: 5,
    coreDamage: 1,
    radius: 10,
    color: '#d39761',
    accent: '#ff668b'
  },
  brute: {
    name: 'Brute',
    hp: 208,
    speed: 29,
    reward: 15,
    coreDamage: 2,
    radius: 20,
    color: '#9f5748',
    accent: '#ff5d83'
  },
  splitter: {
    name: 'Splitter',
    hp: 116,
    speed: 37,
    reward: 11,
    coreDamage: 1,
    radius: 15,
    color: '#7e9e58',
    accent: '#e0ff7a',
    split: 2
  },
  boss: {
    name: 'The Auditor',
    hp: 4200,
    speed: 21,
    reward: 160,
    coreDamage: 8,
    radius: 33,
    color: '#89466b',
    accent: '#ff4f8d',
    boss: true
  }
};

export function towerStats(tower) {
  const def = TOWERS[tower.type];
  const level = tower.level || 1;
  const power = Math.pow(1.62, level - 1);
  return {
    damage: def.damage * power,
    range: def.range * Math.pow(1.09, level - 1),
    rate: def.rate * Math.pow(.88, level - 1),
    splash: (def.splash || 0) * (1 + .16 * (level - 1)),
    slow: def.slow,
    slowTime: def.slowTime
  };
}

export function upgradeCost(tower) {
  if (tower.level >= 3) return 0;
  const base = TOWERS[tower.type].cost;
  return Math.round(base * (tower.level === 1 ? .82 : 1.3));
}

export function sellValue(tower) {
  return Math.floor(tower.spent * .7);
}

const W = (name, tagline, groups) => {
  const events = [];
  groups.forEach((g, gi) => {
    for (let i = 0; i < g.count; i++) {
      events.push({
        time: (g.start || 0) + i * (g.gap || .8),
        type: g.type,
        lane: g.lane == null ? (i + gi) % 2 : g.lane
      });
    }
  });
  events.sort((a, b) => a.time - b.time);
  return { name, tagline, events, total: events.length };
};

export const WAVE_COUNT = 10;

export const WAVES = [
  W('First Rain', 'They seep from the north crack.', [
    { type: 'runt', count: 6, lane: 0, gap: .78 },
    { type: 'runt', count: 6, lane: 1, gap: .82, start: .36 }
  ]),
  W('Scout Party', 'Quick feet. Softer heads.', [
    { type: 'runner', count: 5, lane: 0, gap: .6 },
    { type: 'runt', count: 7, lane: 1, gap: .72, start: .25 },
    { type: 'runner', count: 4, lane: 1, gap: .55, start: 3.6 }
  ]),
  W('Heavy Feet', 'The street starts to tremble.', [
    { type: 'brute', count: 2, lane: 0, gap: 2.8 },
    { type: 'runt', count: 8, lane: 1, gap: .62, start: .4 },
    { type: 'brute', count: 2, lane: 1, gap: 2.7, start: 5.2 }
  ]),
  W('Split Decision', 'One problem becomes several.', [
    { type: 'splitter', count: 4, lane: 0, gap: 1.45 },
    { type: 'runner', count: 8, lane: 1, gap: .47, start: .25 },
    { type: 'splitter', count: 3, lane: 1, gap: 1.4, start: 4.8 }
  ]),
  W('Rolling Thunder', 'A tide with shoulders.', [
    { type: 'brute', count: 4, lane: 0, gap: 2.05 },
    { type: 'runt', count: 9, lane: 1, gap: .5, start: .2 },
    { type: 'brute', count: 3, lane: 1, gap: 2, start: 5.8 }
  ]),
  W('Quickstep', 'The city hears thousands of feet.', [
    { type: 'runner', count: 10, lane: 0, gap: .35 },
    { type: 'splitter', count: 4, lane: 1, gap: 1.2, start: .5 },
    { type: 'runner', count: 10, lane: 1, gap: .32, start: 3.8 }
  ]),
  W('Mudslide', 'Hold the boulevard. Hold everything.', [
    { type: 'brute', count: 5, lane: 0, gap: 1.8 },
    { type: 'runt', count: 12, lane: 1, gap: .4, start: .3 },
    { type: 'brute', count: 4, lane: 1, gap: 1.7, start: 5.9 }
  ]),
  W('The Long March', 'Every crack is a doorway now.', [
    { type: 'runner', count: 14, lane: 0, gap: .36 },
    { type: 'splitter', count: 6, lane: 1, gap: 1.1, start: .2 },
    { type: 'brute', count: 5, lane: 0, gap: 1.65, start: 5.1 },
    { type: 'runner', count: 10, lane: 1, gap: .38, start: 7.5 }
  ]),
  W('Last Warning', 'Make every tower count.', [
    { type: 'brute', count: 7, lane: 0, gap: 1.5 },
    { type: 'runt', count: 15, lane: 1, gap: .33, start: .4 },
    { type: 'splitter', count: 7, lane: 1, gap: 1.05, start: 4.2 },
    { type: 'brute', count: 5, lane: 0, gap: 1.4, start: 7.3 }
  ]),
  W('The Auditor', 'It has come to collect the last heart.', [
    { type: 'runner', count: 10, lane: 0, gap: .42 },
    { type: 'splitter', count: 4, lane: 1, gap: 1.1, start: .4 },
    { type: 'brute', count: 5, lane: 0, gap: 1.5, start: 3.1 },
    { type: 'runner', count: 8, lane: 1, gap: .38, start: 5.2 },
    { type: 'boss', count: 1, lane: 0, gap: 1, start: 7.1 }
  ])
];

export function makeLandscape() {
  const lanes = [
    makeLane([
      { x: 1260, y: 168 }, { x: 1172, y: 163 }, { x: 1091, y: 178 }, { x: 1012, y: 226 },
      { x: 934, y: 268 }, { x: 850, y: 288 }, { x: 786, y: 338 }, { x: 700, y: 372 },
      { x: 612, y: 391 }, { x: 531, y: 405 }, { x: 452, y: 418 }, { x: 381, y: 426 },
      { x: 318, y: 430 }, { x: 262, y: 433 }
    ]),
    makeLane([
      { x: 1260, y: 686 }, { x: 1174, y: 694 }, { x: 1092, y: 682 }, { x: 1024, y: 642 },
      { x: 954, y: 604 }, { x: 885, y: 568 }, { x: 818, y: 522 }, { x: 739, y: 492 },
      { x: 663, y: 473 }, { x: 585, y: 458 }, { x: 509, y: 446 }, { x: 441, y: 436 },
      { x: 376, y: 432 }, { x: 318, y: 430 }, { x: 262, y: 433 }
    ])
  ];

  const pads = [
    { x: 1085, y: 270 }, { x: 974, y: 414 }, { x: 982, y: 188 }, { x: 750, y: 204 },
    { x: 560, y: 248 }, { x: 374, y: 306 }, { x: 872, y: 648 }, { x: 652, y: 610 },
    { x: 438, y: 588 }, { x: 234, y: 588 }, { x: 122, y: 296 }, { x: 120, y: 548 }
  ].map((p, i) => ({ ...p, i }));

  const buildings = [
    { x: 38, y: 38, w: 174, h: 112, color: '#b96b4d', height: 26, kind: 'shop' },
    { x: 240, y: 52, w: 100, h: 82, color: '#d3a04f', height: 18, kind: 'roof' },
    { x: 370, y: 36, w: 168, h: 102, color: '#6f8060', height: 30, kind: 'office' },
    { x: 568, y: 46, w: 124, h: 88, color: '#c87556', height: 22, kind: 'roof' },
    { x: 720, y: 35, w: 154, h: 102, color: '#d0a253', height: 17, kind: 'shop' },
    { x: 900, y: 44, w: 134, h: 90, color: '#5f7e77', height: 28, kind: 'office' },
    { x: 1068, y: 46, w: 142, h: 102, color: '#bb6b50', height: 20, kind: 'roof' },
    { x: 36, y: 196, w: 74, h: 70, color: '#a8734f', height: 16, kind: 'roof' },
    { x: 270, y: 190, w: 78, h: 60, color: '#c38a58', height: 15, kind: 'shop' },
    { x: 338, y: 186, w: 70, h: 77, color: '#6c7f59', height: 18, kind: 'roof' },
    { x: 1125, y: 230, w: 94, h: 108, color: '#b65e4a', height: 24, kind: 'office' },
    { x: 1013, y: 320, w: 80, h: 64, color: '#c6864f', height: 17, kind: 'shop' },
    { x: 836, y: 406, w: 68, h: 58, color: '#5a7771', height: 21, kind: 'roof' },
    { x: 280, y: 498, w: 90, h: 58, color: '#b36a4b', height: 16, kind: 'roof' },
    { x: 558, y: 510, w: 68, h: 50, color: '#cc9550', height: 14, kind: 'shop' },
    { x: 730, y: 534, w: 60, h: 40, color: '#6c7d58', height: 14, kind: 'roof' },
    { x: 1020, y: 490, w: 96, h: 84, color: '#b8644b', height: 21, kind: 'office' },
    { x: 36, y: 642, w: 148, h: 97, color: '#6f8060', height: 19, kind: 'roof' },
    { x: 210, y: 682, w: 120, h: 61, color: '#c98e53', height: 16, kind: 'shop' },
    { x: 364, y: 684, w: 128, h: 61, color: '#b5644c', height: 18, kind: 'roof' },
    { x: 540, y: 690, w: 144, h: 58, color: '#d0a153', height: 15, kind: 'shop' },
    { x: 758, y: 695, w: 138, h: 54, color: '#5e7c75', height: 18, kind: 'roof' },
    { x: 952, y: 688, w: 100, h: 60, color: '#bd6f51', height: 16, kind: 'shop' },
    { x: 1115, y: 660, w: 86, h: 91, color: '#ca9557', height: 20, kind: 'office' },
    { x: 1184, y: 516, w: 51, h: 66, color: '#6d7e58', height: 15, kind: 'roof' }
  ];

  const trees = [
    { x: 231, y: 174, s: .85 }, { x: 323, y: 170, s: .7 }, { x: 521, y: 162, s: .9 },
    { x: 704, y: 166, s: .7 }, { x: 878, y: 158, s: .8 }, { x: 1041, y: 169, s: .78 },
    { x: 1217, y: 154, s: .65 }, { x: 153, y: 289, s: .75 }, { x: 1116, y: 365, s: .8 },
    { x: 935, y: 349, s: .65 }, { x: 923, y: 491, s: .7 }, { x: 126, y: 448, s: .9 },
    { x: 180, y: 625, s: .7 }, { x: 324, y: 631, s: .63 }, { x: 537, y: 641, s: .65 },
    { x: 711, y: 646, s: .8 }, { x: 943, y: 652, s: .7 }, { x: 1088, y: 631, s: .72 },
    { x: 1218, y: 602, s: .6 }, { x: 145, y: 760, s: .62 }, { x: 494, y: 760, s: .64 }
  ];

  const cars = [
    { x: 1153, y: 148, angle: -.05, color: '#5b8e86' },
    { x: 900, y: 299, angle: .32, color: '#d08a57' },
    { x: 1082, y: 619, angle: 2.7, color: '#587a73' },
    { x: 712, y: 489, angle: -.16, color: '#b85c4e' }
  ];

  return {
    key: 'landscape',
    w: 1280,
    h: 800,
    board: { x: 18, y: 14, w: 1244, h: 772, radius: 42 },
    core: { x: 190, y: 432, r: 58 },
    roadWidth: 66,
    padRadius: 31,
    lanes,
    pads,
    buildings,
    trees,
    cars,
    rifts: [lanes[0].points[0], lanes[1].points[0]],
    lamps: [
      { x: 245, y: 300 }, { x: 1111, y: 355 }, { x: 928, y: 390 },
      { x: 512, y: 550 }, { x: 768, y: 620 }, { x: 188, y: 535 }
    ],
    crane: { x: 424, y: 748 }
  };
}

export function makePortrait() {
  const lanes = [
    makeLane([
      { x: 118, y: 64 }, { x: 131, y: 142 }, { x: 175, y: 216 }, { x: 247, y: 295 },
      { x: 319, y: 379 }, { x: 351, y: 472 }, { x: 358, y: 590 }, { x: 360, y: 718 },
      { x: 360, y: 832 }
    ]),
    makeLane([
      { x: 602, y: 64 }, { x: 589, y: 142 }, { x: 545, y: 216 }, { x: 473, y: 295 },
      { x: 401, y: 379 }, { x: 369, y: 472 }, { x: 362, y: 590 }, { x: 360, y: 718 },
      { x: 360, y: 832 }
    ])
  ];

  const pads = [
    { x: 238, y: 128 }, { x: 482, y: 128 }, { x: 142, y: 342 }, { x: 578, y: 342 },
    { x: 242, y: 516 }, { x: 478, y: 516 }, { x: 160, y: 686 }, { x: 560, y: 686 },
    { x: 240, y: 815 }, { x: 480, y: 815 }, { x: 270, y: 690 }, { x: 450, y: 690 }
  ].map((p, i) => ({ ...p, i }));

  const buildings = [
    { x: 34, y: 34, w: 148, h: 73, color: '#b96b4d', height: 22, kind: 'shop' },
    { x: 253, y: 30, w: 214, h: 61, color: '#d0a253', height: 16, kind: 'roof' },
    { x: 535, y: 34, w: 150, h: 73, color: '#5f7e77', height: 24, kind: 'office' },
    { x: 34, y: 184, w: 88, h: 103, color: '#6c7f59', height: 18, kind: 'roof' },
    { x: 598, y: 184, w: 88, h: 103, color: '#c38a58', height: 17, kind: 'shop' },
    { x: 34, y: 358, w: 77, h: 94, color: '#b36a4b', height: 15, kind: 'roof' },
    { x: 608, y: 358, w: 78, h: 94, color: '#6f8060', height: 19, kind: 'roof' },
    { x: 30, y: 530, w: 82, h: 94, color: '#cc9550', height: 15, kind: 'shop' },
    { x: 608, y: 530, w: 80, h: 94, color: '#b8644b', height: 18, kind: 'roof' },
    { x: 32, y: 706, w: 92, h: 88, color: '#5e7c75', height: 20, kind: 'office' },
    { x: 596, y: 706, w: 91, h: 88, color: '#c98e53', height: 15, kind: 'shop' },
    { x: 76, y: 900, w: 138, h: 55, color: '#b5644c', height: 16, kind: 'roof' },
    { x: 506, y: 900, w: 138, h: 55, color: '#6c7d58', height: 15, kind: 'roof' }
  ];

  const trees = [
    { x: 199, y: 142, s: .6 }, { x: 521, y: 142, s: .6 }, { x: 128, y: 320, s: .66 },
    { x: 595, y: 320, s: .62 }, { x: 126, y: 482, s: .6 }, { x: 596, y: 482, s: .64 },
    { x: 122, y: 657, s: .65 }, { x: 596, y: 657, s: .6 }, { x: 310, y: 921, s: .6 },
    { x: 410, y: 922, s: .58 }
  ];

  const cars = [
    { x: 336, y: 446, angle: -1.5, color: '#5b8e86' },
    { x: 382, y: 620, angle: 1.47, color: '#d08a57' }
  ];

  return {
    key: 'portrait',
    w: 720,
    h: 1000,
    board: { x: 10, y: 10, w: 700, h: 980, radius: 34 },
    core: { x: 360, y: 850, r: 54 },
    roadWidth: 54,
    padRadius: 30,
    lanes,
    pads,
    buildings,
    trees,
    cars,
    rifts: [lanes[0].points[0], lanes[1].points[0]],
    lamps: [
      { x: 208, y: 256 }, { x: 512, y: 256 }, { x: 180, y: 450 },
      { x: 545, y: 450 }, { x: 184, y: 612 }, { x: 538, y: 612 }
    ],
    crane: { x: 185, y: 930 }
  };
}
