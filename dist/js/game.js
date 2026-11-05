import {
  TAU, clamp, lerp, pad2, dist, easeOut, seeded, pointOnLane,
  TOWERS, ENEMIES, towerStats, upgradeCost, sellValue,
  WAVES, WAVE_COUNT, makeLandscape, makePortrait
} from './util.js';
import {
  buildBoard, paintTable, drawCore, drawPadGlow, drawRiftGlow, drawRange,
  drawHealthPips, drawTargetReticle, drawSpawnPulse
} from './art-world.js';
import { drawTower, drawTowerIcon } from './art-towers.js';
import { drawEnemy } from './art-enemies.js';
import { drawProjectile, drawEffect, drawParticle, drawFloatText, drawMote } from './art-fx.js';

const TAU2 = Math.PI * 2;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const dom = {
  hud: $('#hud'),
  topbar: document.querySelector('.topbar'),
  dock: $('#dock'),
  coreStatus: $('#coreStatus'),
  coreValue: $('#coreValue'),
  coreBar: $('#coreBar'),
  clayStatus: $('#clayStatus'),
  clayValue: $('#clayValue'),
  waveLabel: $('#waveLabel'),
  waveState: $('#waveState'),
  waveBar: $('#waveBar'),
  waveName: $('#waveName'),
  waveIncoming: $('#waveIncoming'),
  btnWave: $('#btnWave'),
  waveBtnLabel: $('#waveBtnLabel'),
  waveBtnSub: $('#waveBtnSub'),
  btnPause: $('#btnPause'),
  btnSpeed: $('#btnSpeed'),
  speedValue: $('#speedValue'),
  btnSound: $('#btnSound'),
  btnHelp: $('#btnHelp'),
  tutorialTip: $('#tutorialTip'),
  announce: $('#announce'),
  announceKicker: $('#announceKicker'),
  announceTitle: $('#announceTitle'),
  announceSub: $('#announceSub'),
  toast: $('#toast'),
  inspector: $('#inspector'),
  inspectIcon: $('#inspectIcon'),
  inspectName: $('#inspectName'),
  inspectLevel: $('#inspectLevel'),
  statDamage: $('#statDamage'),
  statRange: $('#statRange'),
  statSpeed: $('#statSpeed'),
  btnUpgrade: $('#btnUpgrade'),
  upgradeLabel: $('#upgradeLabel'),
  upgradeCost: $('#upgradeCost'),
  btnSell: $('#btnSell'),
  sellValue: $('#sellValue'),
  btnInspectClose: $('#btnInspectClose'),
  abilitySlam: $('#abilitySlam'),
  abilityRally: $('#abilityRally'),
  slamCooldown: $('#slamCooldown'),
  rallyCooldown: $('#rallyCooldown'),
  menuOverlay: $('#menuOverlay'),
  btnStart: $('#btnStart'),
  btnHow: $('#btnHow'),
  bestLine: $('#bestLine'),
  howOverlay: $('#howOverlay'),
  btnHowClose: $('#btnHowClose'),
  btnHowDone: $('#btnHowDone'),
  pauseOverlay: $('#pauseOverlay'),
  btnResume: $('#btnResume'),
  btnRestart: $('#btnRestart'),
  btnQuit: $('#btnQuit'),
  resultOverlay: $('#resultOverlay'),
  resultEyebrow: $('#resultEyebrow'),
  resultTitle: $('#resultTitle'),
  resultCopy: $('#resultCopy'),
  resultWaves: $('#resultWaves'),
  resultKills: $('#resultKills'),
  resultTowers: $('#resultTowers'),
  resultCore: $('#resultCore'),
  resultBest: $('#resultBest'),
  btnAgain: $('#btnAgain'),
  btnBackMenu: $('#btnBackMenu')
};

const landscape = makeLandscape();
const portrait = makePortrait();
let layout = landscape;
let view = { w: 0, h: 0, dpr: 1, scale: 1, ox: 0, oy: 0, portrait: false };
let game = null;
let fastForwarding = false;
let selectedBuild = null;
let selectedTower = null;
let hoverWorld = { x: -9999, y: -9999 };
let hoverPad = null;
let visualTime = 0;
let speed = 1;
let toastTimer = 0;
let announceTimer = 0;
let helpPausedGame = false;
let motes = [];
let bgCanvas = null;

const SAVE_KEY = 'clayfront.best.v1';
const SOUND_KEY = 'clayfront.sound.v1';
let soundOn = readStored(SOUND_KEY, 'on') !== 'off';

// ── Sound: tiny hand-made synth ───────────────────────────────

const Sound = {
  ac: null,
  master: null,
  noiseBuffer: null,
  last: {},
  ensure() {
    if (this.ac) {
      if (this.ac.state === 'suspended') this.ac.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ac = new AC();
    this.master = this.ac.createGain();
    this.master.gain.value = .14;
    this.master.connect(this.ac.destination);
    const length = this.ac.sampleRate * .35;
    this.noiseBuffer = this.ac.createBuffer(1, length, this.ac.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  },
  tone(freq, duration, type = 'sine', vol = .15, slide = 0, delay = 0) {
    if (!soundOn) return;
    this.ensure();
    if (!this.ac) return;
    const t0 = this.ac.currentTime + delay;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + duration);
    gain.gain.setValueAtTime(.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + .02);
  },
  noise(duration = .12, vol = .08, filter = 900, delay = 0) {
    if (!soundOn) return;
    this.ensure();
    if (!this.ac || !this.noiseBuffer) return;
    const t0 = this.ac.currentTime + delay;
    const src = this.ac.createBufferSource();
    const gain = this.ac.createGain();
    const bq = this.ac.createBiquadFilter();
    src.buffer = this.noiseBuffer;
    bq.type = 'lowpass';
    bq.frequency.value = filter;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + duration);
    src.connect(bq);
    bq.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + duration);
  },
  play(name) {
    if (!soundOn) return;
    const now = performance.now();
    const gap = name.startsWith('shoot') ? 45 : name === 'hit' ? 28 : 0;
    if (gap && this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    switch (name) {
      case 'click': this.tone(520, .06, 'triangle', .035, 90); break;
      case 'build':
        this.tone(128, .16, 'sine', .15, -40);
        this.tone(420, .12, 'triangle', .06, 40, .03);
        this.noise(.16, .06, 650);
        break;
      case 'upgrade':
        this.tone(350, .1, 'triangle', .07, 160);
        this.tone(690, .16, 'sine', .06, 140, .08);
        break;
      case 'sell': this.tone(420, .12, 'triangle', .06, -180); break;
      case 'shootSlinger': this.tone(760, .035, 'square', .022, -160); break;
      case 'shootMortar': this.tone(105, .09, 'sine', .07, -35); this.noise(.08, .025, 380); break;
      case 'shootGoo': this.tone(240, .07, 'sine', .045, 90); break;
      case 'shootKiln': this.tone(880, .16, 'sawtooth', .045, -600); this.noise(.1, .035, 1600); break;
      case 'hit': this.noise(.04, .025, 1500); break;
      case 'kill': this.tone(155, .1, 'triangle', .055, 40); this.noise(.06, .03, 700); break;
      case 'core':
        this.tone(92, .5, 'sawtooth', .14, -45);
        this.tone(54, .45, 'sine', .18, -18);
        this.noise(.25, .12, 450);
        break;
      case 'wave':
        this.tone(233, .2, 'triangle', .075, 0);
        this.tone(349, .25, 'triangle', .07, 0, .13);
        this.tone(466, .35, 'triangle', .06, 0, .27);
        break;
      case 'clear':
        this.tone(349, .16, 'sine', .07);
        this.tone(440, .18, 'sine', .07, 0, .1);
        this.tone(698, .28, 'triangle', .065, 0, .21);
        break;
      case 'quake':
        this.tone(58, .5, 'sawtooth', .16, -18);
        this.noise(.36, .14, 380);
        break;
      case 'rally':
        this.tone(392, .16, 'square', .045);
        this.tone(523, .18, 'square', .04, 0, .09);
        this.tone(784, .28, 'triangle', .055, 0, .19);
        break;
      case 'victory':
        [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, .34, 'triangle', .065, 0, i * .13));
        break;
      case 'defeat':
        this.tone(196, .5, 'sawtooth', .1, -60);
        this.tone(130, .8, 'sine', .12, -30, .2);
        break;
      case 'spawn': this.tone(72, .2, 'sine', .04, 22); break;
      default: break;
    }
  }
};

// ── State ────────────────────────────────────────────────────

function blankState(mode = 'menu') {
  return {
    mode,
    money: 240,
    coreHp: 20,
    coreMax: 20,
    waveIndex: 0,
    phase: 'prep',
    prepTimer: 14,
    prepDuration: 14,
    waveClock: 0,
    spawnCursor: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    effects: [],
    particles: [],
    texts: [],
    kills: 0,
    built: 0,
    clayEarned: 0,
    quakeCd: 0,
    rallyCd: 0,
    rallyTimer: 0,
    shake: 0,
    coreFlash: 0,
    tutorial: true,
    won: false,
    nextId: 1,
    targetMode: null,
    speed: 1,
    bossAlive: false
  };
}

function createMenuState() {
  const state = blankState('menu');
  const picks = [[2, 'kiln', 3], [4, 'mortar', 2], [8, 'goo', 2], [10, 'slinger', 2]];
  for (const [padIndex, type, level] of picks) {
    const pad = layout.pads[padIndex];
    if (!pad) continue;
    state.towers.push({
      id: state.nextId++,
      pad: padIndex,
      x: pad.x,
      y: pad.y,
      type,
      level,
      angle: -.6 + Math.random() * .5,
      recoil: 0,
      attackCd: 1,
      spent: TOWERS[type].cost,
      scaleIn: 1,
      seed: Math.random() * TAU,
      rally: 0,
      demo: true
    });
  }
  return state;
}

function padOccupant(padIndex) {
  return game.towers.find(t => t.pad === padIndex);
}

function findPad(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const pad of layout.pads) {
    const d = dist(x, y, pad.x, pad.y);
    if (d < layout.padRadius + 16 && d < bestD) {
      best = pad;
      bestD = d;
    }
  }
  return best;
}

function makeTower(padIndex, type) {
  const pad = layout.pads[padIndex];
  const tower = {
    id: game.nextId++,
    pad: padIndex,
    x: pad.x,
    y: pad.y,
    type,
    level: 1,
    angle: -.55,
    recoil: 0,
    attackCd: 0,
    spent: TOWERS[type].cost,
    scaleIn: 0,
    seed: Math.random() * TAU,
    rally: 0
  };
  game.towers.push(tower);
  game.built++;
  return tower;
}

// ── Layout & viewport ────────────────────────────────────────

function chooseLayout() {
  const portraitMode = window.innerHeight / window.innerWidth > 1.15;
  return portraitMode ? portrait : landscape;
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const nextLayout = chooseLayout();
  const switched = nextLayout !== layout;
  if (switched) layout = nextLayout;

  view = { w, h, dpr, scale: 1, ox: 0, oy: 0, portrait: layout === portrait };

  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const topRect = dom.topbar.getBoundingClientRect();
  const dockRect = dom.dock.getBoundingClientRect();
  const compact = layout === portrait;
  let regionX = 0;
  let regionY = 0;
  let regionW = w;
  let regionH = h;
  if (compact) {
    regionX = 6;
    regionY = Math.max(72, topRect.bottom + 7);
    regionW = w - 12;
    const bottom = Math.max(regionY + 200, dockRect.top - 8);
    regionH = bottom - regionY;
  }
  const scale = Math.min(regionW / layout.w, regionH / layout.h);
  const ox = regionX + (regionW - layout.w * scale) * .5;
  const oy = regionY + (regionH - layout.h * scale) * .5;
  view.scale = scale;
  view.ox = ox;
  // On short landscape screens the dock overlays the bottom of the board.
  // Lift the board slightly so the lowest build pads stay above it.
  view.oy = oy - (!compact && h < 560 ? 20 : 0);

  dom.inspector.style.bottom = Math.round(h - dockRect.top + 12) + 'px';
  dom.tutorialTip.style.top = Math.round(Math.min(topRect.bottom + 8, h * .35)) + 'px';
  dom.toast.style.top = Math.round(Math.min(topRect.bottom + 30, h * .4)) + 'px';

  bgCanvas = document.createElement('canvas');
  bgCanvas.width = canvas.width;
  bgCanvas.height = canvas.height;
  const bg = bgCanvas.getContext('2d');
  bg.scale(dpr, dpr);
  paintTable(bg, w, h);

  if (switched) relayoutEntities();
  initMotes(w, h);
  drawAllIcons();
}

function relayoutEntities() {
  if (!game) return;
  for (const tower of game.towers) {
    const pad = layout.pads[tower.pad];
    if (pad) {
      tower.x = pad.x;
      tower.y = pad.y;
    }
  }
  for (const e of game.enemies) {
    e.lane = e.lane % layout.lanes.length;
    const lane = layout.lanes[e.lane];
    const progress = clamp(e.progress || 0, 0, 1);
    e.dist = progress * lane.total;
    const p = pointOnLane(lane, e.dist);
    e.x = p.x;
    e.y = p.y;
    e.angle = p.angle;
  }
  game.effects = [];
  game.particles = [];
  game.projectiles = [];
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - view.ox) / view.scale,
    y: (sy - view.oy) / view.scale
  };
}

function initMotes(w, h) {
  const rand = seeded(31415);
  motes = [];
  for (let i = 0; i < 32; i++) {
    motes.push({
      x: rand() * w,
      y: rand() * h,
      vx: (rand() - .5) * 5,
      vy: -3 - rand() * 8,
      size: .6 + rand() * 1.6,
      alpha: .05 + rand() * .16,
      color: rand() > .6 ? '#f2c078' : '#a7c9ad',
      phase: rand() * TAU
    });
  }
}

function updateMotes(dt) {
  for (const m of motes) {
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    if (m.y < -5) {
      m.y = view.h + 5;
      m.x = Math.random() * view.w;
    }
    if (m.x < -5) m.x = view.w + 5;
    if (m.x > view.w + 5) m.x = -5;
  }
}

function drawAllIcons() {
  for (const icon of $$('.tower-icon')) {
    drawTowerIcon(icon, icon.dataset.icon, 1);
  }
  if (selectedTower) drawTowerIcon(dom.inspectIcon, selectedTower.type, selectedTower.level);
}

// ── Menu / run lifecycle ─────────────────────────────────────

function readStored(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function readBest() {
  try {
    return JSON.parse(readStored(SAVE_KEY) || 'null');
  } catch {
    return null;
  }
}

function updateBestLine() {
  const best = readBest();
  if (!best) {
    dom.bestLine.textContent = 'A city of clay. A siege of monsters.';
    return;
  }
  dom.bestLine.innerHTML = `BEST RUN · <span class="best">WAVE ${pad2(best.waves || 0)}</span> · ${best.kills || 0} INVADERS`;
}

function showMenu() {
  game = createMenuState();
  selectedBuild = null;
  selectedTower = null;
  hoverPad = null;
  dom.menuOverlay.classList.remove('hidden');
  dom.resultOverlay.classList.add('hidden');
  dom.pauseOverlay.classList.add('hidden');
  dom.howOverlay.classList.add('hidden');
  dom.inspector.classList.remove('show');
  dom.inspector.classList.add('hidden');
  document.body.classList.remove('playing', 'paused', 'ended');
  updateBestLine();
  resize();
}

function startNewGame() {
  Sound.ensure();
  game = blankState('playing');
  game.speed = speed;
  selectedBuild = null;
  selectedTower = null;
  hoverPad = null;
  game.money = 240;
  game.prepTimer = 14;
  game.prepDuration = 14;
  dom.menuOverlay.classList.add('hidden');
  dom.resultOverlay.classList.add('hidden');
  dom.pauseOverlay.classList.add('hidden');
  dom.howOverlay.classList.add('hidden');
  dom.inspector.classList.remove('show');
  dom.inspector.classList.add('hidden');
  document.body.classList.remove('paused', 'ended');
  document.body.classList.add('playing');
  showAnnounce('THE SIEGE BEGINS', 'BUILD YOUR DEFENSE', 'WAVE 1 IN 14 SECONDS', 2900);
  dom.tutorialTip.classList.add('show');
  Sound.play('wave');
  resize();
  updateHUD();
}

function pauseGame(quiet = false) {
  if (!game || game.mode !== 'playing') return;
  game.wasPlaying = true;
  game.mode = 'paused';
  document.body.classList.add('paused');
  if (!quiet) {
    dom.pauseOverlay.classList.remove('hidden');
    Sound.play('click');
  }
  updateHUD();
}

function resumeGame(fromHelp = false) {
  if (!game || game.mode !== 'paused') return;
  game.mode = 'playing';
  document.body.classList.remove('paused');
  dom.pauseOverlay.classList.add('hidden');
  if (!fromHelp) Sound.play('click');
}

function endRun(won) {
  if (!game || game.mode === 'ended') return;
  game.mode = 'ended';
  game.won = won;
  document.body.classList.add('ended');
  document.body.classList.remove('paused');
  selectedBuild = null;
  selectedTower = null;
  dom.inspector.classList.remove('show');
  dom.inspector.classList.add('hidden');
  dom.tutorialTip.classList.remove('show');
  dom.waveState.classList.remove('active');

  const wavesCleared = won ? WAVE_COUNT : game.waveIndex;
  const best = readBest();
  const candidate = { waves: wavesCleared, kills: game.kills, won, at: Date.now() };
  const score = candidate.won ? 10000 + candidate.waves * 100 + candidate.kills : candidate.waves * 100 + candidate.kills;
  const oldScore = best ? (best.won ? 10000 + best.waves * 100 + best.kills : best.waves * 100 + best.kills) : -1;
  const isBest = score > oldScore;
  if (isBest) writeStored(SAVE_KEY, JSON.stringify(candidate));

  dom.resultOverlay.classList.remove('hidden');
  dom.resultOverlay.classList.toggle('lost', !won);
  dom.resultEyebrow.textContent = won ? 'THE CITY HOLDS' : 'THE HEART IS CRACKED';
  dom.resultTitle.textContent = won ? 'VICTORY' : 'OVERRUN';
  dom.resultCopy.textContent = won
    ? 'The Auditor is mud. The last heart still beats. The city survives — for now.'
    : 'The clay heart shatters. The invaders pour through the avenues. Rebuild, and make them pay.';
  dom.resultWaves.textContent = `${wavesCleared} / ${WAVE_COUNT}`;
  dom.resultKills.textContent = String(game.kills);
  dom.resultTowers.textContent = String(game.built);
  dom.resultCore.textContent = String(Math.max(0, game.coreHp));
  dom.resultBest.textContent = isBest ? 'NEW BEST RUN RECORDED' : best ? `BEST · WAVE ${pad2(best.waves || 0)} · ${best.kills || 0} KILLS` : '';
  dom.resultBest.style.color = isBest ? '#8a4b2c' : '#9a6d4f';
  Sound.play(won ? 'victory' : 'defeat');
  updateHUD();
}

// ── Announcements & feedback ─────────────────────────────────

function showAnnounce(kicker, title, sub, duration = 2300) {
  clearTimeout(announceTimer);
  dom.announceKicker.textContent = kicker;
  dom.announceTitle.textContent = title;
  dom.announceSub.textContent = sub;
  dom.announce.classList.add('show');
  announceTimer = setTimeout(() => dom.announce.classList.remove('show'), duration);
}

function showToast(message, warn = false, duration = 2300) {
  clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.toggle('warn', warn);
  dom.toast.classList.add('show');
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), duration);
}

function bump(el) {
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function addText(x, y, text, color = '#ffd47c', size = 10) {
  game.texts.push({ x, y, text, color, size, life: 1.15, maxLife: 1.15 });
}

function addParticles(x, y, color, count = 8, speed = 65, options = {}) {
  const gravity = options.gravity == null ? 95 : options.gravity;
  for (let i = 0; i < count; i++) {
    const a = options.angle == null ? Math.random() * TAU : options.angle + (Math.random() - .5) * (options.spread || 1.4);
    const v = speed * (.35 + Math.random() * .9);
    const life = (options.life || .55) * (.6 + Math.random() * .8);
    game.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - (options.up || 0),
      gravity,
      size: (options.size || 2.4) * (.55 + Math.random()),
      color,
      life,
      maxLife: life,
      kind: options.kind || (Math.random() > .67 ? 'shard' : 'dot'),
      rot: Math.random() * TAU,
      vr: (Math.random() - .5) * 9,
      alpha: options.alpha == null ? 1 : options.alpha
    });
  }
}

function addRing(x, y, r0, r1, color, life = .5, fill = false, width = 2) {
  game.effects.push({ type: 'ring', x, y, r0, r1, color, life, maxLife: life, fill, width });
}

function addBeam(x1, y1, x2, y2, color, width = 8, life = .17) {
  game.effects.push({ type: 'beam', x1, y1, x2, y2, color, width, life, maxLife: life });
}

function addSplash(x, y, radius, color, life = .35) {
  game.effects.push({ type: 'splash', x, y, radius, color, life, maxLife: life });
}

function updateEffects(dt) {
  for (const e of game.effects) e.life -= dt;
  game.effects = game.effects.filter(e => e.life > 0);
  for (const p of game.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.gravity || 0) * dt;
    p.vx *= 1 - dt * .45;
    p.rot = (p.rot || 0) + (p.vr || 0) * dt;
  }
  game.particles = game.particles.filter(p => p.life > 0);
  for (const t of game.texts) {
    t.life -= dt;
    t.y -= dt * 13;
  }
  game.texts = game.texts.filter(t => t.life > 0);
}

// ── Waves & combat ───────────────────────────────────────────

const QUAKE_CD = 25;
const RALLY_CD = 38;

function startWave(manual = false) {
  if (!game || game.mode !== 'playing' || game.phase !== 'prep') return;
  const wave = WAVES[game.waveIndex];
  if (!wave) return;
  let bonus = 0;
  if (manual) {
    bonus = Math.max(0, Math.floor(game.prepTimer * 2));
    if (bonus > 0) {
      game.money += bonus;
      game.clayEarned += bonus;
      addText(layout.core.x + 58, layout.core.y - 25, `+${bonus} CLAY`, '#ffd87d', 11);
      showToast(`Early call — ${bonus} bonus clay`, false, 1700);
      bump(dom.clayStatus);
    }
  }
  game.phase = 'active';
  game.waveClock = 0;
  game.spawnCursor = 0;
  game.tutorial = false;
  dom.tutorialTip.classList.remove('show');
  showAnnounce('INCOMING', `WAVE ${pad2(game.waveIndex + 1)}`, wave.name, 2100);
  Sound.play('wave');
  updateHUD();
}

function spawnEnemy(type, laneIndex, options = {}) {
  const def = ENEMIES[type];
  if (!def) return null;
  const lane = layout.lanes[laneIndex % layout.lanes.length];
  const waveScale = options.hpScale != null
    ? options.hpScale
    : (def.boss ? 1.16 + game.waveIndex * .05 : 1 + game.waveIndex * .12);
  const hp = Math.max(8, def.hp * waveScale);
  const startDist = options.dist != null ? clamp(options.dist, 0, lane.total - 1) : 0;
  const p = pointOnLane(lane, startDist);
  const enemy = {
    id: game.nextId++,
    type,
    lane: laneIndex % layout.lanes.length,
    dist: startDist,
    progress: startDist / lane.total,
    x: p.x,
    y: p.y,
    angle: p.angle,
    hp,
    maxHp: hp,
    speed: def.speed * (.94 + Math.random() * .12),
    reward: options.reward != null ? options.reward : def.reward + Math.floor(game.waveIndex * .35),
    walkPhase: Math.random() * TAU,
    seed: Math.random() * TAU,
    slowUntil: 0,
    stunUntil: 0,
    hitFlash: 0,
    dead: false,
    child: !!options.child
  };
  if (options.slow) enemy.slowUntil = game.elapsed + options.slow;
  if (options.stun) enemy.stunUntil = game.elapsed + options.stun;
  game.enemies.push(enemy);
  if (def.boss) {
    game.bossAlive = true;
    game.shake = Math.max(game.shake, 7);
    addRing(p.x, p.y, 20, 95, '#ff5b8d', .8, false, 2.4);
    addParticles(p.x, p.y, '#8f3e64', 24, 90, { gravity: 20, size: 3.2, life: .9 });
  }
  return enemy;
}

function spawnDue() {
  const wave = WAVES[game.waveIndex];
  if (!wave) return;
  while (game.spawnCursor < wave.events.length && wave.events[game.spawnCursor].time <= game.waveClock) {
    const ev = wave.events[game.spawnCursor];
    if (ENEMIES[ev.type]) {
      spawnEnemy(ev.type, ev.lane);
      if (ev.type === 'boss' || game.spawnCursor % 3 === 0) Sound.play('spawn');
    }
    game.spawnCursor++;
  }
}

function damageEnemy(enemy, amount, source) {
  if (!enemy || enemy.dead || game.mode !== 'playing') return;
  enemy.hp -= amount;
  enemy.hitFlash = .16;
  if (Math.random() > .45) {
    addParticles(enemy.x, enemy.y - 10, ENEMIES[enemy.type].color, 2, 38, {
      gravity: 50, size: 1.5, life: .28, up: 8
    });
  }
  if (enemy.hp <= 0) killEnemy(enemy, false, source);
  else if (Math.random() > .8) Sound.play('hit');
}

function killEnemy(enemy, byCore = false, source = null) {
  if (!enemy || enemy.dead) return;
  enemy.dead = true;
  const def = ENEMIES[enemy.type];

  if (!byCore) {
    game.money += enemy.reward;
    game.clayEarned += enemy.reward;
    game.kills++;
    addText(enemy.x, enemy.y - 28, `+${enemy.reward}`, '#ffd47c', def.boss ? 16 : 9);
    bump(dom.clayStatus);
    Sound.play('kill');
  }

  addParticles(enemy.x, enemy.y - 9, def.color, def.boss ? 34 : 10, def.boss ? 130 : 66, {
    gravity: 110, size: def.boss ? 4 : 2.4, life: def.boss ? 1.1 : .62, up: 10
  });
  addParticles(enemy.x, enemy.y - 5, def.accent, def.boss ? 18 : 4, 45, {
    gravity: 35, size: 1.7, life: .7
  });
  addRing(enemy.x, enemy.y, 4, def.boss ? 92 : 20, def.accent, def.boss ? .8 : .35, false, def.boss ? 2.5 : 1.2);

  if (def.boss) {
    game.bossAlive = false;
    game.shake = 18;
    game.coreFlash = .4;
  }

  if (def.split && !enemy.child) {
    for (let i = 0; i < def.split; i++) {
      const child = spawnEnemy('runt', enemy.lane, {
        dist: clamp(enemy.dist + (i === 0 ? -17 : 17), 2, layout.lanes[enemy.lane].total - 4),
        hpScale: .38 + game.waveIndex * .012,
        reward: 2,
        child: true
      });
      if (child) child.walkPhase = Math.random() * TAU;
    }
  }

  if (def.boss) {
    showToast('THE AUDITOR HAS FALLEN', false, 2600);
  }
}

function damageCore(amount, enemy) {
  if (!game || game.mode !== 'playing') return;
  game.coreHp = Math.max(0, game.coreHp - amount);
  game.coreFlash = 1;
  game.shake = Math.max(game.shake, 12);
  bump(dom.coreStatus);
  addParticles(layout.core.x, layout.core.y - 8, '#ff956d', 18, 120, {
    gravity: 130, size: 3.2, life: .7, up: 24
  });
  addParticles(layout.core.x, layout.core.y - 8, '#7f3829', 12, 80, {
    gravity: 110, size: 2.6, life: .6
  });
  addText(layout.core.x, layout.core.y - 72, `-${amount}`, '#ff9783', 15);
  addRing(layout.core.x, layout.core.y, 20, 100, '#ff756d', .55, false, 2);
  Sound.play('core');
  if (enemy) enemy.dead = true;
  if (game.coreHp <= 0) endRun(false);
}

function completeWave() {
  if (!game || game.mode !== 'playing' || game.phase !== 'active') return;
  if (game.waveIndex >= WAVE_COUNT - 1) {
    game.kills += 0;
    endRun(true);
    return;
  }
  const bonus = 28 + (game.waveIndex + 1) * 6;
  game.money += bonus;
  game.clayEarned += bonus;
  game.waveIndex++;
  game.phase = 'prep';
  game.prepTimer = 9;
  game.prepDuration = 9;
  game.spawnCursor = 0;
  game.waveClock = 0;
  game.bossAlive = false;
  showAnnounce('WAVE CLEARED', `+${bonus} CLAY`, 'NEXT WAVE IN 9 SECONDS', 2500);
  addText(layout.core.x + 50, layout.core.y - 60, `+${bonus} CLAY`, '#ffd87d', 12);
  addRing(layout.core.x, layout.core.y - 10, 25, 120, '#ffd36d', .8, false, 2);
  bump(dom.clayStatus);
  Sound.play('clear');
  updateHUD();
}

function updateTowers(dt) {
  const rallying = game.rallyTimer > 0;
  for (const tower of game.towers) {
    if (tower.demo) continue;
    tower.scaleIn = Math.min(1, tower.scaleIn + dt * 4.2);
    tower.recoil = Math.max(0, tower.recoil - dt * 7);
    tower.rally = rallying ? 1 : 0;
    tower.attackCd -= dt;

    const stats = towerStats(tower);
    let target = null;
    let best = -1;
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      if (dist(tower.x, tower.y, enemy.x, enemy.y) <= stats.range && enemy.dist > best) {
        best = enemy.dist;
        target = enemy;
      }
    }

    if (target) {
      const tx = target.x;
      const ty = target.y - (target.type === 'boss' ? 38 : 13);
      let diff = Math.atan2(ty - (tower.y - 14), tx - tower.x) - tower.angle;
      diff = ((diff + Math.PI) % TAU + TAU) % TAU - Math.PI;
      tower.angle += diff * Math.min(1, dt * 10);
      tower.target = target;
      if (tower.attackCd <= 0 && tower.scaleIn > .7) {
        fireTower(tower, target, stats, rallying);
        tower.attackCd = stats.rate * (rallying ? .58 : 1);
      }
    } else {
      tower.target = null;
      tower.attackCd = Math.max(0, tower.attackCd);
    }
  }
}

function muzzle(tower, yOffset, color) {
  addParticles(
    tower.x + Math.cos(tower.angle) * 14,
    tower.y + yOffset + Math.sin(tower.angle) * 14,
    color, 3, 36, { gravity: 20, size: 1.4, life: .24, angle: tower.angle, spread: .9 }
  );
}

function fireTower(tower, target, stats, rallying) {
  const def = TOWERS[tower.type];
  const ty = target.y - (target.type === 'boss' ? 36 : 12);
  const tx = target.x;
  tower.recoil = 1;
  if (tower.type === 'slinger') {
    game.projectiles.push({
      kind: 'pebble',
      x: tower.x + Math.cos(tower.angle) * 12,
      y: tower.y - 18 + Math.sin(tower.angle) * 12,
      target,
      tx,
      ty,
      speed: 470,
      damage: stats.damage,
      splash: 0,
      color: '#ffd47c'
    });
    muzzle(tower, -18, '#f4c67c');
    Sound.play('shootSlinger');
  } else if (tower.type === 'goo') {
    game.projectiles.push({
      kind: 'goo',
      x: tower.x + Math.cos(tower.angle) * 12,
      y: tower.y - 17 + Math.sin(tower.angle) * 12,
      target,
      tx,
      ty,
      speed: 315,
      damage: stats.damage,
      splash: stats.splash,
      slow: stats.slow,
      slowTime: stats.slowTime,
      color: '#b6ea72'
    });
    muzzle(tower, -17, '#b6ea72');
    Sound.play('shootGoo');
  } else if (tower.type === 'mortar') {
    const distance = dist(tower.x, tower.y, target.x, target.y);
    game.projectiles.push({
      kind: 'mortar',
      x: tower.x,
      y: tower.y - 22,
      sx: tower.x,
      sy: tower.y - 22,
      tx,
      ty: target.y - 4,
      t: 0,
      duration: clamp(.42 + distance / 430, .52, .95),
      z: 0,
      height: 45 + Math.min(55, distance * .17),
      damage: stats.damage,
      splash: stats.splash,
      color: '#bb8054',
      angle: 0
    });
    muzzle(tower, -22, '#c9a074');
    Sound.play('shootMortar');
  } else {
    const startX = tower.x + Math.cos(tower.angle) * 17;
    const startY = tower.y - 30 + Math.sin(tower.angle) * 17;
    addBeam(startX, startY, tx, ty, '#ffbb57', 9, .17);
    addBeam(startX, startY, tx, ty, '#ffe4a0', 3, .17);
    addRing(tx, ty, 4, 24, '#ffb45a', .28, false, 1.4);
    addParticles(tx, ty, '#ffb75c', 10, 80, { gravity: 50, size: 1.8, life: .36 });
    damageEnemy(target, stats.damage, tower);
    for (const enemy of game.enemies) {
      if (enemy === target || enemy.dead) continue;
      if (dist(enemy.x, enemy.y - 10, target.x, target.y - 10) <= stats.splash) {
        damageEnemy(enemy, stats.damage * .34, tower);
      }
    }
    game.shake = Math.max(game.shake, 1.8);
    Sound.play('shootKiln');
  }
  if (rallying) {
    addParticles(tower.x, tower.y - 18, '#ffd36d', 2, 28, { gravity: -20, size: 1.3, life: .4 });
  }
}

function updateProjectiles(dt) {
  for (const p of game.projectiles) {
    if (p.kind === 'mortar') {
      p.t += dt / p.duration;
      p.x = lerp(p.sx, p.tx, p.t);
      p.y = lerp(p.sy, p.ty, p.t);
      p.z = Math.sin(Math.PI * clamp(p.t, 0, 1)) * p.height;
      if (p.t >= 1) {
        p.done = true;
        resolveProjectile(p);
      }
      continue;
    }

    if (p.target && !p.target.dead) {
      p.tx = p.target.x;
      p.ty = p.target.y - (p.target.type === 'boss' ? 34 : 10);
    }
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    p.angle = Math.atan2(dy, dx);
    if (d < 10) {
      p.done = true;
      resolveProjectile(p);
    } else {
      const step = Math.min(d, p.speed * dt);
      p.x += dx / d * step;
      p.y += dy / d * step;
    }
  }
  game.projectiles = game.projectiles.filter(p => !p.done);
}

function resolveProjectile(p) {
  if (p.splash > 0) {
    addSplash(p.x, p.y, p.splash, p.color || '#c69060', .36);
    addParticles(p.x, p.y, p.color || '#c69060', 10, 80, {
      gravity: 100, size: 2.1, life: .5, up: 12
    });
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      if (dist(p.x, p.y, enemy.x, enemy.y - 8) <= p.splash) {
        damageEnemy(enemy, p.damage, null);
        if (p.slow) enemy.slowUntil = Math.max(enemy.slowUntil, game.elapsed + p.slowTime);
      }
    }
    game.shake = Math.max(game.shake, 1.2);
    Sound.play('hit');
  } else if (p.target && !p.target.dead) {
    damageEnemy(p.target, p.damage, null);
    addParticles(p.x, p.y, '#ffe0a0', 3, 45, { gravity: 60, size: 1.2, life: .3 });
  } else {
    addParticles(p.x, p.y, '#c69060', 3, 35, { gravity: 90, size: 1.3, life: .3 });
  }
}

function updateEnemies(dt) {
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    const def = ENEMIES[enemy.type];
    const stunned = enemy.stunUntil > game.elapsed;
    const slowed = enemy.slowUntil > game.elapsed;
    if (!stunned) {
      const melt = slowed ? .55 : 1;
      enemy.dist += enemy.speed * melt * dt;
      enemy.walkPhase += dt * (5 + enemy.speed * .06);
    }
    enemy.progress = clamp(enemy.dist / layout.lanes[enemy.lane].total, 0, 1);
    const p = pointOnLane(layout.lanes[enemy.lane], enemy.dist);
    enemy.x = p.x;
    enemy.y = p.y;
    enemy.angle = p.angle;

    if (enemy.dist >= layout.lanes[enemy.lane].total) {
      damageCore(def.coreDamage, enemy);
      if (game.mode !== 'playing') break;
    }
  }
  game.enemies = game.enemies.filter(e => !e.dead);
}

function updateGame(dt) {
  if (!game || game.mode !== 'playing') return;
  game.elapsed = (game.elapsed || 0) + dt;
  game.quakeCd = Math.max(0, game.quakeCd - dt);
  game.rallyCd = Math.max(0, game.rallyCd - dt);
  game.rallyTimer = Math.max(0, game.rallyTimer - dt);
  game.coreFlash = Math.max(0, game.coreFlash - dt * 2.2);
  game.shake = Math.max(0, game.shake - dt * 34);

  if (game.phase === 'prep') {
    game.prepTimer -= dt;
    if (game.prepTimer <= 0) {
      game.prepTimer = 0;
      startWave(false);
    }
  }

  if (game.phase === 'active' && game.mode === 'playing') {
    game.waveClock += dt;
    spawnDue();
    updateTowers(dt);
    updateEnemies(dt);
    if (game.mode === 'playing') updateProjectiles(dt);
    if (game.mode === 'playing' && game.phase === 'active') {
      const wave = WAVES[game.waveIndex];
      if (wave && game.spawnCursor >= wave.events.length && game.enemies.length === 0) {
        completeWave();
      }
    }
  } else {
    updateTowers(dt);
  }

  updateEffects(dt);
  for (const tower of game.towers) {
    if (tower.demo) {
      tower.angle = -.55 + Math.sin(visualTime * .7 + tower.seed) * .28;
      tower.recoil = Math.max(0, tower.recoil - dt * 5);
    }
  }
  updateHUD();
}

// ── Powers ───────────────────────────────────────────────────

function toggleQuakeTargeting() {
  if (!game || game.mode !== 'playing') return;
  if (game.quakeCd > 0) {
    showToast(`Clayquake recharging — ${Math.ceil(game.quakeCd)}s`, true, 1500);
    Sound.play('click');
    return;
  }
  if (game.targetMode === 'quake') {
    game.targetMode = null;
    showToast('Clayquake cancelled', false, 900);
  } else {
    game.targetMode = 'quake';
    selectedBuild = null;
    selectedTower = null;
    dom.inspector.classList.remove('show');
    dom.inspector.classList.add('hidden');
    showToast('Tap the street to crack it', false, 1800);
    Sound.play('click');
  }
  updateHUD();
}

function castQuake(x, y) {
  if (!game || game.mode !== 'playing' || game.targetMode !== 'quake') return;
  if (game.quakeCd > 0) return;
  const radius = 112;
  const damage = 68 + game.waveIndex * 9;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    if (dist(enemy.x, enemy.y, x, y) <= radius) {
      enemy.stunUntil = Math.max(enemy.stunUntil, game.elapsed + 1.9);
      enemy.slowUntil = Math.max(enemy.slowUntil, game.elapsed + 2.4);
      damageEnemy(enemy, damage, null);
    }
  }
  const cracks = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * TAU;
    cracks.push([
      Math.cos(a) * 12, Math.sin(a) * 10,
      Math.cos(a + .15) * 29, Math.sin(a + .15) * 24,
      Math.cos(a - .16) * 48, Math.sin(a - .16) * 38,
      Math.cos(a + .05) * 76, Math.sin(a + .05) * 58
    ]);
  }
  game.effects.push({ type: 'quake', x, y, radius, life: .9, maxLife: .9, cracks });
  game.effects.push({ type: 'slamMark', x, y, life: 1.2, maxLife: 1.2 });
  addParticles(x, y, '#8b5737', 34, 150, { gravity: 120, size: 3.2, life: .85, up: 35 });
  addParticles(x, y, '#ffd36d', 18, 95, { gravity: 50, size: 2, life: .6, up: 20 });
  addRing(x, y, 15, radius, '#ffd36d', .55, true, 3);
  game.quakeCd = QUAKE_CD;
  game.targetMode = null;
  game.shake = Math.max(game.shake, 13);
  Sound.play('quake');
  updateHUD();
}

function castRally() {
  if (!game || game.mode !== 'playing') return;
  if (game.rallyCd > 0) {
    showToast(`Rally recharging — ${Math.ceil(game.rallyCd)}s`, true, 1500);
    Sound.play('click');
    return;
  }
  if (!game.towers.length) {
    showToast('Build a tower before rallying', true, 1600);
    return;
  }
  game.rallyTimer = 8;
  game.rallyCd = RALLY_CD;
  for (const tower of game.towers) {
    addRing(tower.x, tower.y - 10, 8, 42, '#ffd36d', .55, false, 2);
    addParticles(tower.x, tower.y - 18, '#ffd36d', 6, 55, { gravity: -30, size: 1.8, life: .6 });
  }
  addRing(layout.core.x, layout.core.y, 30, 180, '#ffd36d', .8, false, 2);
  game.effects.push({ type: 'flash', x: layout.core.x, y: layout.core.y, radius: 150, color: '#ffd36d', life: .5, maxLife: .5 });
  game.shake = Math.max(game.shake, 4);
  showToast('KILN RALLY — towers supercharged', false, 1900);
  Sound.play('rally');
  updateHUD();
}

// ── HUD & tower interactions ─────────────────────────────────

const buildCards = $$('.tower-card');
const powerBars = new Map();

function setText(el, value) {
  const text = String(value);
  if (el && el.textContent !== text) el.textContent = text;
}

function updateHUD() {
  if (!game || fastForwarding) return;
  const displayWave = clamp(game.waveIndex + 1, 1, WAVE_COUNT);
  setText(dom.coreValue, Math.max(0, game.coreHp));
  dom.coreBar.style.width = `${clamp(game.coreHp / game.coreMax, 0, 1) * 100}%`;
  setText(dom.clayValue, game.money);
  setText(dom.waveLabel, `WAVE ${pad2(displayWave)} / ${pad2(WAVE_COUNT)}`);

  const wave = WAVES[Math.min(game.waveIndex, WAVE_COUNT - 1)];
  const total = wave ? wave.events.length : 0;
  const queued = wave ? Math.max(0, total - game.spawnCursor) : 0;
  const remaining = queued + game.enemies.length;

  if (game.phase === 'prep' && game.mode !== 'ended') {
    setText(dom.waveState, 'PREPARE');
    dom.waveState.classList.remove('active');
    setText(dom.waveName, wave ? wave.name : 'THE LAST STAND');
    setText(dom.waveIncoming, `${total} invaders`);
    const progress = 1 - clamp(game.prepTimer / game.prepDuration, 0, 1);
    dom.waveBar.style.width = `${progress * 100}%`;
  } else if (game.mode === 'ended') {
    setText(dom.waveState, game.won ? 'HELD' : 'LOST');
    dom.waveState.classList.toggle('active', !game.won);
    setText(dom.waveName, game.won ? 'THE CITY ENDURES' : 'THE CITY FELL');
    setText(dom.waveIncoming, game.won ? 'all waves cleared' : `${remaining} left`);
    dom.waveBar.style.width = game.won ? '100%' : `${(1 - clamp(remaining / Math.max(1, total), 0, 1)) * 100}%`;
  } else {
    setText(dom.waveState, 'INVADERS');
    dom.waveState.classList.add('active');
    setText(dom.waveName, wave ? wave.name : 'THE LAST STAND');
    setText(dom.waveIncoming, `${remaining} left`);
    const cleared = Math.max(0, total - remaining);
    dom.waveBar.style.width = `${clamp(cleared / Math.max(1, total), 0, 1) * 100}%`;
  }

  const canStart = game.mode === 'playing' && game.phase === 'prep';
  dom.btnWave.disabled = !canStart;
  if (canStart) {
    setText(dom.waveBtnLabel, 'START WAVE');
    const bonus = Math.max(0, Math.floor(game.prepTimer * 2));
    setText(dom.waveBtnSub, `+${bonus} CLAY EARLY`);
  } else if (game.mode === 'ended') {
    setText(dom.waveBtnLabel, game.won ? 'CITY HELD' : 'RUN OVER');
    setText(dom.waveBtnSub, game.won ? 'VICTORY' : 'TRY AGAIN');
  } else {
    setText(dom.waveBtnLabel, 'IN FLIGHT');
    setText(dom.waveBtnSub, `${remaining} LEFT`);
  }

  for (const card of buildCards) {
    const type = card.dataset.tower;
    card.classList.toggle('active', selectedBuild === type);
    card.classList.toggle('unaffordable', game.money < TOWERS[type].cost);
  }

  setText(dom.speedValue, `${speed}×`);
  dom.btnSound.classList.toggle('muted', !soundOn);
  dom.btnSound.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound');

  updatePower(dom.abilitySlam, dom.slamCooldown, game.quakeCd, QUAKE_CD, game.targetMode === 'quake');
  updatePower(dom.abilityRally, dom.rallyCooldown, game.rallyCd, RALLY_CD, false);

  if (game.tutorial && game.mode === 'playing' && game.phase === 'prep') {
    dom.tutorialTip.classList.add('show');
  } else if (!game.tutorial) {
    dom.tutorialTip.classList.remove('show');
  }

  if (selectedTower) {
    if (!game.towers.includes(selectedTower)) {
      selectedTower = null;
      dom.inspector.classList.remove('show');
      dom.inspector.classList.add('hidden');
    } else {
      refreshInspector();
    }
  }
}

function updatePower(button, coolEl, cd, max, targeting) {
  button.classList.toggle('targeting', !!targeting);
  if (cd > 0) {
    button.classList.add('cooling');
    const bar = coolEl.querySelector('b');
    const label = coolEl.querySelector('em');
    if (bar) bar.style.height = `${clamp(cd / max, 0, 1) * 100}%`;
    if (label) label.textContent = String(Math.ceil(cd));
  } else {
    button.classList.remove('cooling');
    const label = coolEl.querySelector('em');
    if (label) label.textContent = '';
  }
}

function refreshInspector() {
  if (!selectedTower) return;
  const tower = selectedTower;
  const def = TOWERS[tower.type];
  const stats = towerStats(tower);
  setText(dom.inspectName, def.name);
  setText(dom.inspectLevel, `LEVEL ${tower.level} / 3`);
  dom.statDamage.style.width = `${clamp(stats.damage / (def.damage * 2.7), .1, 1) * 100}%`;
  dom.statRange.style.width = `${clamp((stats.range - def.range) / (def.range * .22) * .4 + .55, .15, 1) * 100}%`;
  dom.statSpeed.style.width = `${clamp((def.rate / stats.rate) / 1.35, .15, 1) * 100}%`;

  if (tower.level >= 3) {
    setText(dom.upgradeLabel, 'MAX LEVEL');
    setText(dom.upgradeCost, 'fully built');
    dom.btnUpgrade.disabled = true;
  } else {
    const cost = upgradeCost(tower);
    setText(dom.upgradeLabel, 'UPGRADE');
    setText(dom.upgradeCost, `${cost} clay`);
    dom.btnUpgrade.disabled = game.money < cost;
  }
  setText(dom.sellValue, `+${sellValue(tower)}`);
}

function selectBuildType(type) {
  if (!game || game.mode !== 'playing') return;
  if (selectedTower) {
    selectedTower = null;
    dom.inspector.classList.remove('show');
    dom.inspector.classList.add('hidden');
  }
  game.targetMode = null;
  selectedBuild = selectedBuild === type ? null : type;
  Sound.play('click');
  updateHUD();
}

function selectTower(tower) {
  if (!game || game.mode !== 'playing' || !tower) return;
  selectedBuild = null;
  game.targetMode = null;
  selectedTower = tower;
  drawTowerIcon(dom.inspectIcon, tower.type, tower.level);
  dom.inspector.classList.remove('hidden');
  dom.inspector.classList.add('show');
  dom.btnInspectClose.focus({ preventScroll: true });
  Sound.play('click');
  updateHUD();
}

function dismissSelection() {
  selectedTower = null;
  selectedBuild = null;
  if (game) game.targetMode = null;
  dom.inspector.classList.remove('show');
  dom.inspector.classList.add('hidden');
  updateHUD();
}

function tryBuild(pad) {
  if (!game || game.mode !== 'playing') return;
  if (!pad) return;
  const existing = padOccupant(pad.i);
  if (existing) {
    selectTower(existing);
    return;
  }
  if (!selectedBuild) {
    showToast('Pick a tower below, then tap a cracked pad', false, 2200);
    dom.tutorialTip.classList.add('show');
    return;
  }
  const def = TOWERS[selectedBuild];
  if (game.money < def.cost) {
    Sound.play('click');
    showToast(`Not enough clay — ${def.short} costs ${def.cost}`, true, 1900);
    bump(dom.clayStatus);
    return;
  }

  game.money -= def.cost;
  const tower = makeTower(pad.i, selectedBuild);
  tower.scaleIn = 0;
  game.tutorial = false;
  dom.tutorialTip.classList.remove('show');
  addParticles(pad.x, pad.y, '#d4a36b', 20, 76, { gravity: 90, size: 2.5, life: .7, up: 20 });
  addParticles(pad.x, pad.y, '#ffd37d', 8, 45, { gravity: -20, size: 1.6, life: .55 });
  addRing(pad.x, pad.y, 7, 46, '#ffd37d', .45, false, 1.8);
  addText(pad.x, pad.y - 36, `-${def.cost}`, '#ffc17e', 10);
  game.shake = Math.max(game.shake, 1.8);
  Sound.play('build');
  bump(dom.clayStatus);
  updateHUD();
  if (game.money < def.cost) {
    showToast(`Built ${def.name}. Clay spent — stop invaders to earn more.`, false, 1800);
  }
}

function upgradeTower() {
  if (!game || game.mode !== 'playing' || !selectedTower) return;
  const tower = selectedTower;
  if (tower.level >= 3) return;
  const cost = upgradeCost(tower);
  if (game.money < cost) {
    showToast(`Need ${cost - game.money} more clay to upgrade`, true, 1700);
    Sound.play('click');
    return;
  }
  game.money -= cost;
  tower.spent += cost;
  tower.level++;
  tower.scaleIn = .6;
  addRing(tower.x, tower.y, 8, 52, '#ffd37d', .6, false, 2);
  addParticles(tower.x, tower.y - 15, '#ffd37d', 16, 76, { gravity: 30, size: 2, life: .7, up: 12 });
  addText(tower.x, tower.y - 42, `LV ${tower.level}`, '#ffe09a', 11);
  drawTowerIcon(dom.inspectIcon, tower.type, tower.level);
  Sound.play('upgrade');
  bump(dom.clayStatus);
  updateHUD();
}

function sellTower() {
  if (!game || game.mode !== 'playing' || !selectedTower) return;
  const tower = selectedTower;
  const value = sellValue(tower);
  game.money += value;
  game.towers = game.towers.filter(t => t !== tower);
  addParticles(tower.x, tower.y - 8, '#c58a5b', 14, 65, { gravity: 90, size: 2.2, life: .6 });
  addText(tower.x, tower.y - 30, `+${value}`, '#ffd47c', 10);
  selectedTower = null;
  dom.inspector.classList.remove('show');
  dom.inspector.classList.add('hidden');
  Sound.play('sell');
  bump(dom.clayStatus);
  updateHUD();
}

// ── Rendering ────────────────────────────────────────────────

function drawScreenFlash() {
  if (!game || game.coreFlash <= 0) return;
  const g = ctx.createRadialGradient(view.w * .5, view.h * .45, 20, view.w * .5, view.h * .45, Math.max(view.w, view.h) * .65);
  g.addColorStop(0, 'rgba(255, 102, 86, 0)');
  g.addColorStop(.72, `rgba(255, 79, 65, ${game.coreFlash * .06})`);
  g.addColorStop(1, `rgba(255, 54, 48, ${game.coreFlash * .32})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
}

function render() {
  if (!game) return;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.w, view.h);
  if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0, view.w, view.h);

  const sm = reducedMotion ? 0 : 1;
  const shakeX = sm * (Math.random() * 2 - 1) * game.shake;
  const shakeY = sm * (Math.random() * 2 - 1) * game.shake * .6;

  ctx.save();
  ctx.translate(view.ox + shakeX * view.scale, view.oy + shakeY * view.scale);
  ctx.scale(view.scale, view.scale);

  const board = buildBoard(layout);
  ctx.drawImage(board, 0, 0, layout.w, layout.h);

  drawSpawnPulse(ctx, layout, visualTime);
  for (const rift of layout.rifts) drawRiftGlow(ctx, layout, rift, visualTime);

  const buildCost = selectedBuild ? TOWERS[selectedBuild].cost : 0;
  if (game.mode !== 'menu' && selectedBuild) {
    for (const pad of layout.pads) {
      if (padOccupant(pad.i)) continue;
      drawPadGlow(ctx, layout, pad, visualTime, true, game.money >= buildCost);
    }
  } else if (game.mode !== 'menu' && hoverPad && !padOccupant(hoverPad.i)) {
    drawPadGlow(ctx, layout, hoverPad, visualTime, true, game.money >= buildCost || !selectedBuild);
  }

  if (selectedTower) {
    const stats = towerStats(selectedTower);
    drawRange(ctx, selectedTower.x, selectedTower.y, stats.range, '#70e3ca', visualTime);
  }

  if (selectedBuild && hoverPad && !padOccupant(hoverPad.i)) {
    const def = TOWERS[selectedBuild];
    drawRange(ctx, hoverPad.x, hoverPad.y, def.range, game.money >= def.cost ? '#ffd36d' : '#ff7181', visualTime, game.money >= def.cost);
    ctx.save();
    ctx.globalAlpha = .55;
    drawTower(ctx, {
      x: hoverPad.x, y: hoverPad.y, type: selectedBuild, level: 1,
      angle: -.55, recoil: 0, scaleIn: 1, seed: 0, rally: 0
    }, visualTime, false);
    ctx.restore();
  }

  if (game.mode !== 'menu' && game.targetMode === 'quake' && hoverWorld.x > -100) {
    drawTargetReticle(ctx, hoverWorld.x, hoverWorld.y, 112, visualTime);
  }

  const healthRatio = clamp(game.coreHp / game.coreMax, 0, 1);
  drawCore(ctx, layout, visualTime, healthRatio, game.coreFlash);

  const drawables = [];
  for (const tower of game.towers) drawables.push({ y: tower.y, kind: 'tower', item: tower });
  for (const enemy of game.enemies) drawables.push({ y: enemy.y, kind: 'enemy', item: enemy });
  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) {
    if (d.kind === 'tower') drawTower(ctx, d.item, visualTime, d.item === selectedTower);
    else drawEnemy(ctx, d.item, visualTime, game.elapsed || 0);
  }

  for (const projectile of game.projectiles) drawProjectile(ctx, projectile, visualTime);
  for (const effect of game.effects) drawEffect(ctx, effect, visualTime);
  for (const particle of game.particles) drawParticle(ctx, particle);
  for (const t of game.texts) drawFloatText(ctx, t);

  if (game.mode !== 'menu') drawHealthPips(ctx, layout, game.coreHp, game.coreMax);

  ctx.restore();

  for (const m of motes) {
    drawMote(ctx, { ...m, alpha: m.alpha * (.78 + Math.sin(visualTime * 1.4 + m.phase) * .22) });
  }

  drawScreenFlash();
}

// ── Input ────────────────────────────────────────────────────

function updateHover(event) {
  const rect = canvas.getBoundingClientRect();
  const sx = event.clientX - rect.left;
  const sy = event.clientY - rect.top;
  const p = screenToWorld(sx, sy);
  hoverWorld = p;
  hoverPad = findPad(p.x, p.y);
  if (game && game.mode === 'playing') {
    if (game.targetMode === 'quake') canvas.style.cursor = 'crosshair';
    else if (hoverPad) canvas.style.cursor = 'pointer';
    else if (selectedBuild) canvas.style.cursor = 'crosshair';
    else canvas.style.cursor = 'default';
  } else {
    canvas.style.cursor = 'default';
  }
}

function onCanvasDown(event) {
  if (!game || game.mode !== 'playing') return;
  if (event.button != null && event.button !== 0) return;
  updateHover(event);
  const p = hoverWorld;
  if (game.targetMode === 'quake') {
    castQuake(p.x, p.y);
    return;
  }
  const pad = findPad(p.x, p.y);
  if (pad) {
    const tower = padOccupant(pad.i);
    if (tower) {
      selectTower(tower);
      return;
    }
    if (selectedBuild) {
      tryBuild(pad);
      return;
    }
    showToast('Pick a tower below, then tap a cracked pad', false, 2100);
    dom.tutorialTip.classList.add('show');
    return;
  }
  dismissSelection();
}

function onCanvasMove(event) {
  if (!game) return;
  updateHover(event);
}

function onCanvasLeave() {
  hoverPad = null;
  hoverWorld = { x: -9999, y: -9999 };
  canvas.style.cursor = 'default';
}

function togglePause() {
  if (!game) return;
  if (game.mode === 'playing') pauseGame();
  else if (game.mode === 'paused') resumeGame();
}

function openHelp() {
  if (!game) return;
  if (game.mode === 'playing') {
    helpPausedGame = true;
    pauseGame(true);
    dom.pauseOverlay.classList.add('hidden');
  } else {
    helpPausedGame = false;
  }
  dom.howOverlay.classList.remove('hidden');
  Sound.play('click');
}

function closeHelp() {
  dom.howOverlay.classList.add('hidden');
  if (helpPausedGame && game && game.mode === 'paused') {
    resumeGame(true);
  }
  helpPausedGame = false;
  Sound.play('click');
}

function toggleSound() {
  soundOn = !soundOn;
  writeStored(SOUND_KEY, soundOn ? 'on' : 'off');
  dom.btnSound.classList.toggle('muted', !soundOn);
  dom.btnSound.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound');
  if (soundOn) {
    Sound.ensure();
    Sound.play('click');
  }
}

function cycleSpeed() {
  speed = speed === 1 ? 2 : 1;
  if (game) game.speed = speed;
  Sound.play('click');
  updateHUD();
}

function bindEvents() {
  dom.btnStart.addEventListener('click', startNewGame);
  dom.btnHow.addEventListener('click', openHelp);
  dom.btnHowClose.addEventListener('click', closeHelp);
  dom.btnHowDone.addEventListener('click', closeHelp);
  dom.btnHelp.addEventListener('click', openHelp);
  dom.btnPause.addEventListener('click', togglePause);
  dom.btnSpeed.addEventListener('click', cycleSpeed);
  dom.btnSound.addEventListener('click', toggleSound);

  dom.btnWave.addEventListener('click', () => startWave(true));
  dom.abilitySlam.addEventListener('click', toggleQuakeTargeting);
  dom.abilityRally.addEventListener('click', castRally);
  dom.inspector.addEventListener('pointerdown', (e) => e.stopPropagation());
  dom.btnInspectClose.addEventListener('click', dismissSelection);
  dom.btnUpgrade.addEventListener('click', upgradeTower);
  dom.btnSell.addEventListener('click', sellTower);

  for (const card of buildCards) {
    card.addEventListener('click', () => selectBuildType(card.dataset.tower));
  }

  dom.btnResume.addEventListener('click', () => resumeGame());
  dom.btnRestart.addEventListener('click', startNewGame);
  dom.btnQuit.addEventListener('click', showMenu);
  dom.btnAgain.addEventListener('click', startNewGame);
  dom.btnBackMenu.addEventListener('click', showMenu);

  canvas.addEventListener('pointerdown', onCanvasDown);
  canvas.addEventListener('pointermove', onCanvasMove);
  canvas.addEventListener('pointerleave', onCanvasLeave);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('resize', queueResize);

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (!dom.howOverlay.classList.contains('hidden')) {
      if (key === 'escape') closeHelp();
      return;
    }
    if (!game) return;
    if (key === 'escape') {
      if (game.mode === 'playing' && (game.targetMode || selectedTower || selectedBuild)) {
        dismissSelection();
      } else if (game.mode === 'paused') {
        resumeGame();
      } else if (game.mode === 'playing') {
        pauseGame();
      }
      return;
    }
    if (game.mode === 'playing') {
      if (key === '1') selectBuildType('slinger');
      else if (key === '2') selectBuildType('mortar');
      else if (key === '3') selectBuildType('goo');
      else if (key === '4') selectBuildType('kiln');
      else if (key === 'q') toggleQuakeTargeting();
      else if (key === 'e') castRally();
      else if (key === ' ') {
        event.preventDefault();
        startWave(true);
      } else if (key === 'p') {
        pauseGame();
      }
    } else if (game.mode === 'paused' && key === 'p') {
      resumeGame();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && game.mode === 'playing') {
      pauseGame(true);
    } else if (!document.hidden && game && game.mode === 'paused' && game.wasPlaying &&
      dom.howOverlay.classList.contains('hidden')) {
      dom.pauseOverlay.classList.remove('hidden');
    }
  });
}

let resizeQueued = false;
function queueResize() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    resize();
  });
}

// ── Main loop & boot ─────────────────────────────────────────

let lastFrame = performance.now();

function loop(now) {
  const raw = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  visualTime += raw;

  if (game) {
    if (game.mode === 'playing') {
      updateGame(raw * speed);
    } else if (game.mode === 'ended') {
      updateEffects(raw * .6);
    } else if (game.mode === 'menu') {
      for (const tower of game.towers) {
        tower.angle = -.58 + Math.sin(visualTime * .55 + tower.seed) * .25;
      }
    }
  }

  updateMotes(raw);
  render();
  requestAnimationFrame(loop);
}

function boot() {
  layout = chooseLayout();
  game = createMenuState();
  updateBestLine();
  updateSoundButton();
  resize();
  bindEvents();
  requestAnimationFrame(loop);
  document.fonts.ready.then(() => {
    drawAllIcons();
    updateBestLine();
  });
}

function updateSoundButton() {
  dom.btnSound.classList.toggle('muted', !soundOn);
  dom.btnSound.setAttribute('aria-label', soundOn ? 'Mute sound' : 'Enable sound');
}

window.__clayfront = {
  get state() { return game; },
  get layout() { return layout; },
  start: startNewGame,
  menu: showMenu,
  startWave: () => startWave(true),
  place: (type, padIndex) => {
    if (!game || game.mode !== 'playing') return false;
    selectedBuild = type;
    const pad = layout.pads[padIndex];
    if (!pad) return false;
    tryBuild(pad);
    return true;
  },
  setClay: (n) => { if (game) { game.money = n; updateHUD(); } },
  upgrade: (padIndex) => {
    const tower = game && game.towers.find(t => t.pad === padIndex);
    if (!tower) return null;
    selectedTower = tower;
    upgradeTower();
    return { level: tower.level, money: game.money };
  },
  addClay: (n) => { if (game) { game.money += n; game.clayEarned += n; updateHUD(); } },
  spawn: (type, lane = 0) => spawnEnemy(type, lane),
  damageCore: (n = 1) => damageCore(n),
  skipPrep: () => { if (game) game.prepTimer = .01; },
  fastForward: (seconds = 5) => {
    if (!game || game.mode !== 'playing') return 0;
    const step = 1 / 60;
    let t = 0;
    fastForwarding = true;
    try {
      while (t < seconds && game.mode === 'playing') {
        updateGame(step);
        t += step;
      }
    } finally {
      fastForwarding = false;
      updateHUD();
    }
    return t;
  },
  quake: (x, y) => { if (game) { game.targetMode = 'quake'; castQuake(x ?? layout.core.x + 300, y ?? layout.core.y); } },
  rally: () => castRally(),
  speed: (n) => { speed = n === 2 ? 2 : 1; if (game) game.speed = speed; updateHUD(); },
  select: (type) => selectBuildType(type),
  stateSnapshot: () => game && JSON.parse(JSON.stringify({
    mode: game.mode, phase: game.phase, money: game.money, coreHp: game.coreHp,
    waveIndex: game.waveIndex, enemies: game.enemies.length, towers: game.towers.length,
    kills: game.kills, quakeCd: game.quakeCd, rallyCd: game.rallyCd
  }))
};

boot();


