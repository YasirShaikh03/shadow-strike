/*
 * Shadow Strike — Ultimate Stickman Fighter
 * Author: SHAIKH YASIR
 * GitHub: https://github.com/YasirShaikh03
 * game.js — Full game engine, characters, backgrounds, AI, audio
 *
 * @author SHAIKH YASIR <https://github.com/YasirShaikh03>
 */

// ══════════════════════════════════════════════
// SAVE SYSTEM
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
const SK = 'ss_v6';
const DEF = {
  playerLevel: 1, xp: 0, coins: 0,
  unlockedLevels: 1, clearedLevels: [],
  owned: [0], equipped: 0,
  totalWins: 0, totalGames: 0,
  winStreak: 0, bestStreak: 0,
  powers: { hp: 0, atk: 0, spd: 0, sp: 0, def: 0 },
  ownedBGs: [0], equippedBG: 0,
  achievements: [],
  dailyDone: null, dailyCoins: 0,
};
let S = JSON.parse(JSON.stringify(DEF));

function loadSave() {
  try {
    const d = localStorage.getItem(SK);
    if (d) {
      const p = JSON.parse(d);
      S = { ...DEF, ...p };
      if (!S.powers) S.powers = { ...DEF.powers };
      if (!S.owned) S.owned = [0];
      if (!S.winStreak) S.winStreak = 0;
      if (!S.bestStreak) S.bestStreak = 0;
      if (!S.ownedBGs) S.ownedBGs = [0];
      if (!S.equippedBG) S.equippedBG = 0;
      if (!S.achievements) S.achievements = [];
    }
  } catch (e) {}
}
function doSave() {
  try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {}
}
loadSave();

function xpN(lv) { return Math.floor(80 * Math.pow(1.15, lv - 1)); }
function addXP(n) {
  let lv = false;
  S.xp += n;
  while (S.playerLevel < 100 && S.xp >= xpN(S.playerLevel)) {
    S.xp -= xpN(S.playerLevel);
    S.playerLevel++;
    lv = true;
  }
  if (S.playerLevel >= 100) S.xp = 0;
  doSave();
  return lv;
}
function addCoins(n) { S.coins += n; doSave(); }

// ══════════════════════════════════════════════
// ACHIEVEMENTS
// ══════════════════════════════════════════════
const ACHIEVEMENTS = [
  { id: 'first_win',   name: 'FIRST BLOOD',   desc: 'Win your first fight',       icon: '🩸', check: () => S.totalWins >= 1 },
  { id: 'win10',       name: 'FIGHTER',        desc: 'Win 10 fights',              icon: '🥊', check: () => S.totalWins >= 10 },
  { id: 'win50',       name: 'WARRIOR',        desc: 'Win 50 fights',              icon: '⚔️', check: () => S.totalWins >= 50 },
  { id: 'streak5',     name: 'ON FIRE',        desc: 'Win 5 in a row',             icon: '🔥', check: () => S.bestStreak >= 5 },
  { id: 'streak10',    name: 'UNSTOPPABLE',    desc: 'Win 10 in a row',            icon: '💀', check: () => S.bestStreak >= 10 },
  { id: 'combo10',     name: 'COMBO KING',     desc: 'Land a 10x combo',           icon: '⚡', check: () => maxCombo >= 10 },
  { id: 'combo20',     name: 'GODLIKE',        desc: 'Land a 20x combo',           icon: '👁️', check: () => maxCombo >= 20 },
  { id: 'level50',     name: 'HALF WAY',       desc: 'Reach level 50',             icon: '🎯', check: () => S.clearedLevels.includes(50) },
  { id: 'level100',    name: 'LEGEND',         desc: 'Clear level 100',            icon: '🏆', check: () => S.clearedLevels.includes(100) },
  { id: 'allchars',    name: 'COLLECTOR',      desc: 'Own all 15 characters',      icon: '🌟', check: () => S.owned.length >= 15 },
  { id: 'plv10',       name: 'VETERAN',        desc: 'Reach player level 10',      icon: '🎖️', check: () => S.playerLevel >= 10 },
  { id: 'rich',        name: 'MILLIONAIRE',    desc: 'Earn 10,000 total coins',    icon: '💰', check: () => S.coins >= 10000 },
];
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!S.achievements.includes(a.id) && a.check()) {
      S.achievements.push(a.id);
      doSave();
      showAchieveToast(a.icon + ' ' + a.name);
      snd('levelup');
    }
  });
}
function showAchieveToast(msg) {
  const el = document.getElementById('achieve-toast');
  el.textContent = '🏅 ACHIEVEMENT: ' + msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

// ══════════════════════════════════════════════
// 15 CHARACTERS
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
const CHARS = [
  // 0 — Free starter
  {
    name: 'STRIKER', icon: '🥊', col: '#e63946', spCol: '#ff8896', price: 0,
    desc: 'Balanced & reliable brawler',
    sname: 'POWER PUNCH',
    bodyStyle: 'normal',
    special(f, o) { sp_punch(f, o); }
  },
  // 1
  {
    name: 'SHADOW', icon: '🥷', col: '#9b59b6', spCol: '#d7aefb', price: 150,
    desc: 'Teleports behind enemy',
    sname: 'SHADOW DASH',
    bodyStyle: 'slim',
    special(f, o) { sp_shadow(f, o); }
  },
  // 2
  {
    name: 'BLAZE', icon: '🔥', col: '#f97316', spCol: '#ffd60a', price: 260,
    desc: 'Burns enemy for 2.5s',
    sname: 'FIRE BURST',
    bodyStyle: 'normal',
    special(f, o) { sp_fire(f, o); }
  },
  // 3
  {
    name: 'FROST', icon: '❄️', col: '#60b4f0', spCol: '#c8eafc', price: 400,
    desc: 'Freezes enemy solid 1s',
    sname: 'BLIZZARD',
    bodyStyle: 'normal',
    special(f, o) { sp_frost(f, o); }
  },
  // 4
  {
    name: 'THUNDER', icon: '⚡', col: '#ffd60a', spCol: '#fff5a0', price: 600,
    desc: 'Triple lightning strike',
    sname: 'LIGHTNING',
    bodyStyle: 'athletic',
    special(f, o) { sp_lightning(f, o); }
  },
  // 5
  {
    name: 'TITAN', icon: '💪', col: '#2ecc71', spCol: '#86efac', price: 800,
    desc: 'Huge ground slam AOE',
    sname: 'GROUND SLAM',
    bodyStyle: 'heavy',
    special(f, o) { sp_titan(f, o); }
  },
  // 6
  {
    name: 'PHANTOM', icon: '👻', col: '#a8e6cf', spCol: '#2ec4b6', price: 1100,
    desc: 'Phase & multi-hit',
    sname: 'PHASE STRIKE',
    bodyStyle: 'slim',
    special(f, o) { sp_phantom(f, o); }
  },
  // 7
  {
    name: 'VIPER', icon: '🐍', col: '#4ade80', spCol: '#86efac', price: 1500,
    desc: 'Deadly poison 4 seconds',
    sname: 'VENOM BITE',
    bodyStyle: 'slim',
    special(f, o) { sp_viper(f, o); }
  },
  // 8
  {
    name: 'DRAGON', icon: '🐉', col: '#ec4899', spCol: '#f9a8d4', price: 2000,
    desc: 'Massive dragon roar AOE',
    sname: 'DRAGON ROAR',
    bodyStyle: 'heavy',
    special(f, o) { sp_dragon(f, o); }
  },
  // 9
  {
    name: 'LEGEND', icon: '⭐', col: '#ffeaa7', spCol: '#fff5c2', price: 2800,
    desc: 'All powers fused — ULTIMATE',
    sname: 'NOVA BLAST',
    bodyStyle: 'athletic',
    special(f, o) { sp_nova(f, o); }
  },
  // 10 — NEW CHARACTERS
  {
    name: 'SAMURAI', icon: '⚔️', col: '#dc143c', spCol: '#ff6b8a', price: 3500,
    desc: 'Precise blade — ignores defense',
    sname: 'BLADE STORM',
    bodyStyle: 'slim',
    special(f, o) { sp_samurai(f, o); }
  },
  // 11
  {
    name: 'NINJA', icon: '🌙', col: '#1e3a5f', spCol: '#4a9abe', price: 4500,
    desc: 'Shuriken volley + stealth',
    sname: 'SHURIKEN STORM',
    bodyStyle: 'slim',
    special(f, o) { sp_ninja(f, o); }
  },
  // 12
  {
    name: 'CYBORG', icon: '🤖', col: '#06b6d4', spCol: '#a5f3fc', price: 5500,
    desc: 'Laser beam + stun 0.8s',
    sname: 'LASER BEAM',
    bodyStyle: 'heavy',
    special(f, o) { sp_cyborg(f, o); }
  },
  // 13
  {
    name: 'VAMPIRE', icon: '🧛', col: '#7b1d1d', spCol: '#f87171', price: 7000,
    desc: 'Drains 30% of damage as HP',
    sname: 'BLOOD DRAIN',
    bodyStyle: 'slim',
    special(f, o) { sp_vampire(f, o); }
  },
  // 14
  {
    name: 'GOD', icon: '👁️', col: '#ffffff', spCol: '#ffd700', price: 10000,
    desc: 'DIVINE WRATH — undodgeable',
    sname: 'DIVINE WRATH',
    bodyStyle: 'divine',
    special(f, o) { sp_god(f, o); }
  },
];

// ══════════════════════════════════════════════
// POWERS
// ══════════════════════════════════════════════
const POWERS = [
  { id: 'hp',  icon: '❤️',  name: 'VITALITY',   desc: '+25% Max HP per level (permanent)',        prices: [100, 200, 350, 550, 800] },
  { id: 'atk', icon: '⚔️',  name: 'ATTACK',     desc: '+18% damage per level (permanent)',         prices: [120, 240, 400, 600, 900] },
  { id: 'spd', icon: '💨',  name: 'SPEED',      desc: '+12% move & attack speed (permanent)',      prices: [100, 220, 380, 580, 850] },
  { id: 'sp',  icon: '⚡',  name: 'SP CHARGE',  desc: '+30% special bar fill rate (permanent)',    prices: [150, 300, 480, 700, 1000] },
  { id: 'def', icon: '🛡️',  name: 'DEFENSE',    desc: '-14% damage taken per level (permanent)',  prices: [130, 260, 430, 650, 950] },
];

// ══════════════════════════════════════════════
// 30 BACKGROUNDS
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
const BG_THEMES = [
  // 0 — Free
  {
    name: 'NIGHT CITY', icon: '🌃', price: 0,
    sky: ['#080c18', '#111b3a'], stars: true, buildings: true, clouds: true,
    floor: ['#1e2f58', '#101828'], floorLine: 'rgba(46,196,182,.32)',
    gridCol: 'rgba(46,196,182,.07)',
    desc: 'Default cyberpunk city',
  },
  // 1
  {
    name: 'SUNSET', icon: '🌅', price: 80,
    sky: ['#ff6b35', '#ff8c42', '#ffb347'],
    stars: false, buildings: true, clouds: true,
    floor: ['#8b3a0f', '#5a1e00'], floorLine: 'rgba(255,165,0,.5)',
    gridCol: 'rgba(255,140,0,.1)',
    desc: 'Golden sunset horizon',
  },
  // 2
  {
    name: 'MOON', icon: '🌕', price: 120,
    sky: ['#050510', '#0a0a20', '#101035'],
    stars: true, buildings: false, clouds: false,
    floor: ['#1a1a2e', '#0d0d1a'], floorLine: 'rgba(200,200,255,.4)',
    gridCol: 'rgba(150,150,255,.06)',
    moonPhase: 'full',
    desc: 'Moonlit void arena',
  },
  // 3
  {
    name: 'LAVA', icon: '🌋', price: 200,
    sky: ['#1a0500', '#3d0c00', '#5a1400'],
    stars: false, buildings: false, clouds: false,
    floor: ['#8b1a00', '#ff4500'], floorLine: 'rgba(255,69,0,.9)',
    gridCol: 'rgba(255,100,0,.15)',
    lava: true,
    desc: 'Volcanic lava pit',
  },
  // 4
  {
    name: 'OCEAN', icon: '🌊', price: 150,
    sky: ['#001428', '#002855', '#003d6b'],
    stars: false, buildings: false, clouds: true,
    floor: ['#0066cc', '#004499'], floorLine: 'rgba(0,200,255,.6)',
    gridCol: 'rgba(0,180,255,.08)',
    desc: 'Underwater ocean depth',
  },
  // 5
  {
    name: 'SNOW', icon: '❄️', price: 180,
    sky: ['#c8d8f0', '#b0c4e0', '#a0b8d8'],
    stars: false, buildings: true, clouds: true,
    floor: ['#e8f0ff', '#d0dff5'], floorLine: 'rgba(150,180,255,.5)',
    gridCol: 'rgba(100,150,255,.08)',
    snow: true,
    desc: 'Blizzard snowstorm',
  },
  // 6
  {
    name: 'FOREST', icon: '🌲', price: 160,
    sky: ['#0a1f0a', '#1a3a1a', '#2d4d2d'],
    stars: false, buildings: false, clouds: false,
    floor: ['#1a3d0a', '#0f2206'], floorLine: 'rgba(100,200,50,.4)',
    gridCol: 'rgba(80,160,30,.08)',
    desc: 'Ancient dark forest',
  },
  // 7
  {
    name: 'SPACE', icon: '🚀', price: 250,
    sky: ['#000005', '#00000f', '#000015'],
    stars: true, buildings: false, clouds: false,
    floor: ['#0a0a1a', '#050510'], floorLine: 'rgba(100,100,255,.3)',
    gridCol: 'rgba(80,80,200,.05)',
    nebula: true,
    desc: 'Deep space nebula',
  },
  // 8
  {
    name: 'NEON CITY', icon: '🏙️', price: 220,
    sky: ['#050518', '#0a0a28', '#080820'],
    stars: false, buildings: true, clouds: false,
    floor: ['#0f0f2a', '#050515'], floorLine: 'rgba(255,0,255,.8)',
    gridCol: 'rgba(255,0,200,.12)',
    neon: true,
    desc: 'Vaporwave neon grid',
  },
  // 9
  {
    name: 'CAVE', icon: '🗿', price: 130,
    sky: ['#050505', '#0a0a0a', '#0f0f0f'],
    stars: false, buildings: false, clouds: false,
    floor: ['#1a1005', '#0f0803'], floorLine: 'rgba(180,120,40,.5)',
    gridCol: 'rgba(150,100,30,.06)',
    desc: 'Dark underground cave',
  },
  // 10
  {
    name: 'STORM', icon: '⛈️', price: 190,
    sky: ['#0a0a14', '#151520', '#1a1a28'],
    stars: false, buildings: true, clouds: true,
    floor: ['#0d1020', '#08090f'], floorLine: 'rgba(80,80,255,.5)',
    gridCol: 'rgba(60,60,220,.08)',
    lightning: true,
    desc: 'Electric thunderstorm',
  },
  // 11
  {
    name: 'SAKURA', icon: '🌸', price: 175,
    sky: ['#1a0820', '#2d0d35', '#3d1545'],
    stars: true, buildings: false, clouds: false,
    floor: ['#1f0a1a', '#12060f'], floorLine: 'rgba(255,100,180,.5)',
    gridCol: 'rgba(220,80,160,.08)',
    petals: true,
    desc: 'Cherry blossom night',
  },
  // 12
  {
    name: 'CYBER GRID', icon: '🔷', price: 280,
    sky: ['#000508', '#000d10', '#001014'],
    stars: false, buildings: false, clouds: false,
    floor: ['#001a14', '#000f0a'], floorLine: 'rgba(0,255,180,.7)',
    gridCol: 'rgba(0,230,160,.12)',
    cybergrid: true,
    desc: 'Matrix cyber grid',
  },
  // 13
  {
    name: 'RUINS', icon: '🏚️', price: 160,
    sky: ['#150a00', '#1e1000', '#251500'],
    stars: false, buildings: true, clouds: false,
    floor: ['#2a1800', '#1a0f00'], floorLine: 'rgba(180,120,40,.4)',
    gridCol: 'rgba(150,100,20,.07)',
    desc: 'Ancient ruins battle',
  },
  // 14
  {
    name: 'ARENA', icon: '🏟️', price: 200,
    sky: ['#0a0505', '#140808', '#1a0a0a'],
    stars: false, buildings: true, clouds: false,
    floor: ['#1a0505', '#100303'], floorLine: 'rgba(220,30,30,.7)',
    gridCol: 'rgba(200,20,20,.1)',
    desc: 'Gladiator colosseum',
  },
  // 15
  {
    name: 'CLOUDS', icon: '☁️', price: 140,
    sky: ['#1a3a6a', '#2a5080', '#3a6090'],
    stars: false, buildings: false, clouds: true,
    floor: ['#4a7aaa', '#3a6090'], floorLine: 'rgba(200,230,255,.5)',
    gridCol: 'rgba(180,210,255,.08)',
    desc: 'Above the clouds',
  },
  // 16
  {
    name: 'RAINBOW', icon: '🌈', price: 300,
    sky: ['#0a0520', '#150a2a', '#1a0f30'],
    stars: false, buildings: false, clouds: false,
    floor: ['#1a0a2a', '#0f0515'], floorLine: 'rgba(200,100,255,.6)',
    gridCol: 'rgba(180,80,255,.1)',
    rainbow: true,
    desc: 'Prismatic rainbow storm',
  },
  // 17
  {
    name: 'DUNGEON', icon: '⛓️', price: 170,
    sky: ['#030303', '#060606', '#080808'],
    stars: false, buildings: false, clouds: false,
    floor: ['#0f0800', '#080500'], floorLine: 'rgba(150,80,0,.5)',
    gridCol: 'rgba(120,60,0,.06)',
    desc: 'Dark dungeon depths',
  },
  // 18
  {
    name: 'HELLFIRE', icon: '😈', price: 350,
    sky: ['#1a0000', '#300000', '#400505'],
    stars: false, buildings: false, clouds: false,
    floor: ['#500000', '#ff1500'], floorLine: 'rgba(255,50,0,1)',
    gridCol: 'rgba(255,30,0,.15)',
    hellfire: true,
    desc: 'Gates of Hell arena',
  },
  // 19
  {
    name: 'CRYSTAL', icon: '💎', price: 320,
    sky: ['#050520', '#0a0a30', '#0f0f3a'],
    stars: true, buildings: false, clouds: false,
    floor: ['#101040', '#080820'], floorLine: 'rgba(150,200,255,.7)',
    gridCol: 'rgba(120,180,255,.1)',
    crystal: true,
    desc: 'Crystalline dimension',
  },
  // 20
  {
    name: 'JUNGLE', icon: '🦁', price: 180,
    sky: ['#050f05', '#0a1a0a', '#0f200f'],
    stars: false, buildings: false, clouds: false,
    floor: ['#0a2a05', '#061503'], floorLine: 'rgba(80,200,30,.4)',
    gridCol: 'rgba(60,160,20,.07)',
    desc: 'Dense jungle clearing',
  },
  // 21
  {
    name: 'UNDERWATER', icon: '🐠', price: 220,
    sky: ['#000a20', '#001030', '#001840'],
    stars: false, buildings: false, clouds: false,
    floor: ['#001a3a', '#000f20'], floorLine: 'rgba(0,200,255,.5)',
    gridCol: 'rgba(0,180,200,.08)',
    bubbles: true,
    desc: 'Deep ocean trench',
  },
  // 22
  {
    name: 'GALACTIC', icon: '🌌', price: 400,
    sky: ['#000000', '#020005', '#040008'],
    stars: true, buildings: false, clouds: false,
    floor: ['#040010', '#020008'], floorLine: 'rgba(200,0,255,.5)',
    gridCol: 'rgba(180,0,220,.08)',
    nebula: true,
    galactic: true,
    desc: 'Galactic void battle',
  },
  // 23
  {
    name: 'WASTELAND', icon: '☢️', price: 240,
    sky: ['#1a1000', '#251500', '#301a00'],
    stars: false, buildings: true, clouds: false,
    floor: ['#2a1500', '#1a0d00'], floorLine: 'rgba(180,160,0,.5)',
    gridCol: 'rgba(150,130,0,.08)',
    desc: 'Post-apocalyptic desert',
  },
  // 24
  {
    name: 'AURORA', icon: '🌠', price: 380,
    sky: ['#000a05', '#001a0f', '#00281a'],
    stars: true, buildings: false, clouds: false,
    floor: ['#001510', '#000c08'], floorLine: 'rgba(0,255,150,.5)',
    gridCol: 'rgba(0,220,130,.08)',
    aurora: true,
    desc: 'Northern lights arena',
  },
  // 25
  {
    name: 'VOLCANO', icon: '🏔️', price: 260,
    sky: ['#0a0500', '#1a0800', '#280c00'],
    stars: false, buildings: false, clouds: false,
    floor: ['#3d0a00', '#8b2500'], floorLine: 'rgba(255,100,0,.8)',
    gridCol: 'rgba(255,80,0,.12)',
    eruption: true,
    desc: 'Active volcano crater',
  },
  // 26
  {
    name: 'SAKURA NIGHT', icon: '🌙', price: 290,
    sky: ['#0a0318', '#150528', '#1a083a'],
    stars: true, buildings: true, clouds: false,
    floor: ['#150828', '#0a0518'], floorLine: 'rgba(255,150,200,.4)',
    gridCol: 'rgba(220,100,180,.07)',
    petals: true,
    desc: 'Sakura blossoms at night',
  },
  // 27
  {
    name: 'VOID', icon: '🕳️', price: 500,
    sky: ['#000000', '#000000', '#000000'],
    stars: false, buildings: false, clouds: false,
    floor: ['#050005', '#030003'], floorLine: 'rgba(150,0,255,.6)',
    gridCol: 'rgba(120,0,200,.1)',
    void_fx: true,
    desc: 'The endless void',
  },
  // 28
  {
    name: 'DAY SKY', icon: '☀️', price: 100,
    sky: ['#1a6ed4', '#2980b9', '#3498db'],
    stars: false, buildings: true, clouds: true,
    floor: ['#3a7a1a', '#285510'], floorLine: 'rgba(100,200,50,.5)',
    gridCol: 'rgba(80,180,30,.07)',
    desc: 'Bright sunny afternoon',
  },
  // 29
  {
    name: 'BLOOD MOON', icon: '🔴', price: 450,
    sky: ['#0f0000', '#1a0000', '#250000'],
    stars: true, buildings: true, clouds: false,
    floor: ['#1a0000', '#0f0000'], floorLine: 'rgba(200,0,0,.7)',
    gridCol: 'rgba(180,0,0,.1)',
    bloodmoon: true,
    desc: 'Crimson blood moon night',
  },
];

// ══════════════════════════════════════════════
// SPECIALS — Original 10
// ══════════════════════════════════════════════
function sp_punch(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 12; }, get y() { return sy + 8; }, w: 140, h: 65, type: 'special', dmg: 42 + rnd(12), life: .30 };
  burst(f.cx + fc * 85, f.cy, '#ff8896', 32);
  shakeScreen(6); flashBG('#e6394622', 220); snd('special');
}
function sp_shadow(f, o) {
  f.x = o.x + (o.fac > 0 ? 38 : -66);
  f.fac = o.cx > f.cx ? 1 : -1;
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 8; }, get y() { return sy + 4; }, w: 95, h: 82, type: 'special', dmg: 36 + rnd(10), life: .28 };
  burst(f.cx, f.cy, '#9b59b6', 28); burst(f.cx + fc * 40, f.cy, '#d7aefb', 14);
  flashBG('#7c3aed1e', 220); snd('special');
}
function sp_fire(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 10; }, get y() { return sy - 8; }, w: 122, h: 95, type: 'special', dmg: 32 + rnd(10), life: .32 };
  if (o) { o._burn = 2.5; o._burnT = 0; }
  burst(f.cx + fc * 65, f.cy - 8, '#f97316', 36); burst(f.cx + fc * 88, f.cy - 28, '#ffd60a', 20);
  shakeScreen(4); flashBG('#f9731628', 250); snd('special');
}
function sp_frost(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 10; }, get y() { return sy - 10; }, w: 118, h: 90, type: 'special', dmg: 28 + rnd(8), life: .30 };
  if (o) o._freeze = 1.0;
  burst(f.cx + fc * 60, f.cy, '#60b4f0', 32); burst(f.cx + fc * 80, f.cy - 20, '#c8eafc', 20);
  flashBG('#60b4f025', 300); snd('freeze2'); snd('special');
}
function sp_lightning(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 8; }, get y() { return sy - 18; }, w: 148, h: 102, type: 'special', dmg: 22 + rnd(8), life: .36 };
  burst(f.cx + fc * 80, f.cy - 18, '#ffd60a', 28); burst(f.cx + fc * 60, f.cy + 10, '#fff5a0', 18); burst(f.cx + fc * 102, f.cy - 5, '#ffd60a', 14);
  shakeScreen(8); flashBG('#ffd60a22', 260); snd('special');
}
function sp_titan(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s - 72; }, get y() { return sy + 25; }, w: 195, h: 62, type: 'special', dmg: 47 + rnd(16), life: .34 };
  burst(f.cx, f.cy + 44, '#2ecc71', 44); burst(f.cx - 56, f.cy + 56, '#86efac', 20); burst(f.cx + 56, f.cy + 56, '#86efac', 20);
  shakeScreen(12); flashBG('#2ecc7120', 300); snd('special');
}
function sp_phantom(f, o) {
  if (o) { f.x = o.x + (o.fac > 0 ? -52 : 32); }
  f.fac = o && o.cx > f.cx ? 1 : -1;
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 6; }, get y() { return sy - 12; }, w: 112, h: 96, type: 'special', dmg: 38 + rnd(12), life: .30 };
  burst(f.cx, f.cy, '#a8e6cf', 24); burst(f.cx + fc * 56, f.cy, '#2ec4b6', 24);
  flashBG('#2ec4b622', 220); snd('special');
}
function sp_viper(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 14; }, get y() { return sy + 18; }, w: 92, h: 72, type: 'special', dmg: 20 + rnd(6), life: .24 };
  if (o) { o._poison = 4.0; o._poisonT = 0; }
  burst(f.cx + fc * 55, f.cy + 12, '#4ade80', 28); burst(f.cx + fc * 75, f.cy, '#86efac', 16);
  flashBG('#4ade801a', 220); snd('special');
}
function sp_dragon(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  f.hb = { get x() { return s + fc * 4; }, get y() { return sy - 22; }, w: 168, h: 118, type: 'special', dmg: 54 + rnd(17), life: .40 };
  burst(f.cx + fc * 86, f.cy - 22, '#ec4899', 46); burst(f.cx + fc * 112, f.cy, '#f9a8d4', 26); burst(f.cx, f.cy, '#ffd60a', 24);
  shakeScreen(14); flashBG('#ec489930', 360); snd('special');
}
function sp_nova(f, o) {
  f.hb = { get x() { return 0; }, get y() { return 0; }, w: 900, h: 400, type: 'special', dmg: 62 + rnd(19), life: .36 };
  for (let i = 0; i < 8; i++) burst(f.cx + rnd(225) - 112, f.cy + rnd(92) - 46, '#ffeaa7', 17);
  burst(f.cx, f.cy, '#fff5c2', 54);
  shakeScreen(18); flashBG('#ffeaa738', 420); snd('special');
}

// ══════════════════════════════════════════════
// SPECIALS — New 5 characters
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
function sp_samurai(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  // Three rapid slashes, ignores block
  f.hb = { get x() { return s + fc * 5; }, get y() { return sy - 10; }, w: 130, h: 90, type: 'special', dmg: 45 + rnd(15), life: .35, piercing: true };
  burst(f.cx + fc * 70, f.cy - 10, '#dc143c', 30);
  burst(f.cx + fc * 100, f.cy + 10, '#ff6b8a', 18);
  burst(f.cx + fc * 50, f.cy - 25, '#ff0044', 14);
  shakeScreen(7); flashBG('#dc143c28', 280); snd('special');
}
function sp_ninja(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  // Multi-projectile shuriken
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      if (o && o.hp > 0) {
        const dmg = 14 + rnd(6);
        if (!o.dge) {
          o.hp = Math.max(0, o.hp - dmg);
          burst(o.cx + rnd(40) - 20, o.cy + rnd(40) - 20, '#4a9abe', 8);
          popup(o.cx, o.y - 5, '-' + dmg, '#4a9abe', 12);
          hud();
        }
      }
    }, i * 90);
  }
  f.hb = { get x() { return s + fc * 6; }, get y() { return sy + 2; }, w: 85, h: 75, type: 'special', dmg: 16 + rnd(8), life: .22 };
  // Stealth effect — brief dodge invincibility
  f.inv = 0.6;
  burst(f.cx + fc * 50, f.cy, '#1e3a5f', 20); burst(f.cx + fc * 80, f.cy - 10, '#4a9abe', 16);
  flashBG('#1e3a5f22', 200); snd('special');
}
function sp_cyborg(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  // Laser beam — stuns enemy
  f.hb = { get x() { return s + fc * 0; }, get y() { return sy + 10; }, w: 200, h: 28, type: 'special', dmg: 38 + rnd(12), life: .50 };
  if (o) o._freeze = 0.8; // "stun"
  // Draw laser visually via particles
  for (let i = 0; i < 12; i++) {
    burst(f.cx + fc * (i * 16), f.cy + 10, '#a5f3fc', 4);
  }
  burst(o ? o.cx : f.cx + fc * 180, f.cy + 10, '#06b6d4', 40);
  shakeScreen(9); flashBG('#06b6d422', 300); snd('special');
}
function sp_vampire(f, o) {
  const s = f.cx, fc = f.fac, sy = f.y;
  const baseDmg = 35 + rnd(12);
  f.hb = { get x() { return s + fc * 8; }, get y() { return sy + 5; }, w: 105, h: 85, type: 'special', dmg: baseDmg, life: .32, onHit: () => { f.hp = Math.min(f.maxHP, f.hp + Math.round(baseDmg * 0.4)); hud(); } };
  burst(f.cx + fc * 55, f.cy + 5, '#7b1d1d', 28); burst(f.cx + fc * 70, f.cy - 10, '#f87171', 18);
  // Spawn blood droplets
  for (let i = 0; i < 6; i++) burst(f.cx + fc * 60 + rnd(30) - 15, f.cy + rnd(30) - 10, '#cc0000', 5);
  flashBG('#7b1d1d30', 350); snd('special');
}
function sp_god(f, o) {
  // Divine wrath — full screen, undodgeable, massive damage
  f.hb = { get x() { return 0; }, get y() { return 0; }, w: 900, h: 400, type: 'special', dmg: 75 + rnd(25), life: .45, piercing: true, undodgeable: true };
  // Massive burst
  for (let i = 0; i < 14; i++) burst(rnd(900), rnd(360), i % 2 === 0 ? '#ffffff' : '#ffd700', 14);
  burst(f.cx, f.cy, '#ffffff', 60);
  shakeScreen(22); flashBG('#ffffff55', 600);
  // Dramatic sound
  snd('special');
  snd('levelup');
}

// ══════════════════════════════════════════════
// FLASH / SHAKE / UTILS
// ══════════════════════════════════════════════
function flashBG(col, dur) {
  const el = document.getElementById('flash');
  el.style.background = col; el.style.opacity = '1';
  setTimeout(() => el.style.opacity = '0', dur);
}
let shakeAmt = 0, shakeT = 0;
function shakeScreen(amt) { shakeAmt = Math.max(shakeAmt, amt); shakeT = 0.22; }
function applyShake() {
  const aw = document.getElementById('arena');
  if (shakeAmt > 0 && shakeT > 0) {
    const ox = (Math.random() - .5) * shakeAmt * 2, oy = (Math.random() - .5) * shakeAmt;
    aw.style.transform = `translate(${ox}px,${oy}px)`;
    shakeAmt *= .82;
  } else {
    aw.style.transform = '';
    shakeAmt = 0;
  }
}

// ══════════════════════════════════════════════
// STUNT SYSTEM
// ══════════════════════════════════════════════
const STUNTS = [
  { name: '🔥 ON FIRE!',      minCombo: 5,  col: '#f97316' },
  { name: '⚡ ELECTRIC!',     minCombo: 8,  col: '#ffd60a' },
  { name: '👊 BEAST MODE',    minCombo: 12, col: '#e63946' },
  { name: '💀 UNSTOPPABLE',   minCombo: 18, col: '#ec4899' },
  { name: '🌟 GODLIKE!!!',    minCombo: 25, col: '#fff5c2' },
];
let lastStuntCombo = 0;
function checkStunt(cb) {
  for (let i = STUNTS.length - 1; i >= 0; i--) {
    const st = STUNTS[i];
    if (cb >= st.minCombo && lastStuntCombo < st.minCombo) {
      showStunt(st.name, st.col);
      lastStuntCombo = cb;
      break;
    }
  }
}
function showStunt(text, col) {
  const el = document.getElementById('stunt-label');
  el.textContent = text; el.style.color = col; el.style.textShadow = `0 0 30px ${col}`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  snd('stunt');
}
function resetStunt() { lastStuntCombo = 0; }

// ══════════════════════════════════════════════
// CONFETTI / VICTORY
// ══════════════════════════════════════════════
function spawnConfetti() {
  const b = document.getElementById('victory-banner');
  b.classList.add('on');
  b.innerHTML = '<div id="win-text">VICTORY!</div>';
  const cols = ['#ffd60a','#e63946','#2ec4b6','#9b59b6','#f97316','#4ade80','#ec4899','#60b4f0'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-p';
    const w = 6 + Math.random() * 10, h = 6 + Math.random() * 10;
    el.style.cssText = `width:${w}px;height:${h}px;left:${Math.random()*100}%;top:-20px;background:${cols[Math.random()*cols.length|0]};animation-duration:${1.4+Math.random()*1.6}s;animation-delay:${Math.random()*.8}s;`;
    b.appendChild(el);
  }
  setTimeout(() => b.classList.remove('on'), 3500);
}

// ══════════════════════════════════════════════
// AUDIO ENGINE
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
let AC, muted = false;
function iAC() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); }
function rAC() { iAC(); if (AC.state === 'suspended') AC.resume(); }
function snd(t) {
  if (muted) return; rAC();
  const now = AC.currentTime, g = AC.createGain(); g.connect(AC.destination);
  if (t === 'punch') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sawtooth';
    o.frequency.setValueAtTime(260, now); o.frequency.exponentialRampToValueAtTime(55, now + .1);
    g.gain.setValueAtTime(.3, now); g.gain.exponentialRampToValueAtTime(.001, now + .12);
    o.start(now); o.stop(now + .13);
    const b = AC.createBuffer(1, AC.sampleRate * .06, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .2;
    const ns = AC.createBufferSource(), ng = AC.createGain();
    ng.gain.setValueAtTime(.18, now); ng.gain.exponentialRampToValueAtTime(.001, now + .06);
    ns.buffer = b; ns.connect(ng); ng.connect(AC.destination); ns.start(now);
  } else if (t === 'kick') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(180, now); o.frequency.exponentialRampToValueAtTime(34, now + .15);
    g.gain.setValueAtTime(.45, now); g.gain.exponentialRampToValueAtTime(.001, now + .17);
    o.start(now); o.stop(now + .18);
  } else if (t === 'special') {
    const o1 = AC.createOscillator(), f1 = AC.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 900;
    o1.connect(f1); f1.connect(g); o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(700, now); o1.frequency.exponentialRampToValueAtTime(90, now + .42);
    g.gain.setValueAtTime(.5, now); g.gain.exponentialRampToValueAtTime(.001, now + .46);
    o1.start(now); o1.stop(now + .46);
    const o2 = AC.createOscillator(), g2 = AC.createGain();
    o2.connect(g2); g2.connect(AC.destination); o2.type = 'sine';
    o2.frequency.setValueAtTime(100, now + .05); o2.frequency.exponentialRampToValueAtTime(28, now + .43);
    g2.gain.setValueAtTime(.7, now + .05); g2.gain.exponentialRampToValueAtTime(.001, now + .46);
    o2.start(now + .05); o2.stop(now + .46);
  } else if (t === 'block') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'square';
    o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(200, now + .07);
    g.gain.setValueAtTime(.15, now); g.gain.exponentialRampToValueAtTime(.001, now + .09);
    o.start(now); o.stop(now + .1);
  } else if (t === 'dodge') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(520, now); o.frequency.exponentialRampToValueAtTime(270, now + .13);
    g.gain.setValueAtTime(.12, now); g.gain.exponentialRampToValueAtTime(.001, now + .14);
    o.start(now); o.stop(now + .15);
  } else if (t === 'ko') {
    for (let i = 0; i < 3; i++) {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.connect(gn); gn.connect(AC.destination); o.type = 'sawtooth';
      o.frequency.setValueAtTime(300 - i * 75, now + i * .13); o.frequency.exponentialRampToValueAtTime(30, now + i * .13 + .2);
      gn.gain.setValueAtTime(.42, now + i * .13); gn.gain.exponentialRampToValueAtTime(.001, now + i * .13 + .22);
      o.start(now + i * .13); o.stop(now + i * .13 + .24);
    }
  } else if (t === 'fight') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(900, now); o.frequency.setValueAtTime(1300, now + .01); o.frequency.exponentialRampToValueAtTime(650, now + .65);
    g.gain.setValueAtTime(.35, now); g.gain.exponentialRampToValueAtTime(.001, now + .75);
    o.start(now); o.stop(now + .78);
  } else if (t === 'jump') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(290, now); o.frequency.exponentialRampToValueAtTime(580, now + .11);
    g.gain.setValueAtTime(.12, now); g.gain.exponentialRampToValueAtTime(.001, now + .13);
    o.start(now); o.stop(now + .14);
  } else if (t === 'coin') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(1046, now); o.frequency.setValueAtTime(1318, now + .06);
    g.gain.setValueAtTime(.25, now); g.gain.exponentialRampToValueAtTime(.001, now + .28);
    o.start(now); o.stop(now + .3);
  } else if (t === 'levelup') {
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.connect(gn); gn.connect(AC.destination); o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(.28, now + i * .1); gn.gain.exponentialRampToValueAtTime(.001, now + i * .1 + .2);
      o.start(now + i * .1); o.stop(now + i * .1 + .22);
    });
  } else if (t === 'burn') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sawtooth';
    o.frequency.setValueAtTime(80 + Math.random() * 40, now);
    g.gain.setValueAtTime(.05, now); g.gain.exponentialRampToValueAtTime(.001, now + .12);
    o.start(now); o.stop(now + .14);
  } else if (t === 'freeze2') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(1800, now); o.frequency.exponentialRampToValueAtTime(400, now + .22);
    g.gain.setValueAtTime(.14, now); g.gain.exponentialRampToValueAtTime(.001, now + .24);
    o.start(now); o.stop(now + .26);
  } else if (t === 'poison') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'sine';
    o.frequency.setValueAtTime(200 + Math.random() * 60, now);
    g.gain.setValueAtTime(.04, now); g.gain.exponentialRampToValueAtTime(.001, now + .15);
    o.start(now); o.stop(now + .17);
  } else if (t === 'stunt') {
    [880, 1100, 1320].forEach((f, i) => {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.connect(gn); gn.connect(AC.destination); o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(.2, now + i * .055); gn.gain.exponentialRampToValueAtTime(.001, now + i * .055 + .14);
      o.start(now + i * .055); o.stop(now + i * .055 + .15);
    });
  } else if (t === 'taunt') {
    const o = AC.createOscillator(); o.connect(g); o.type = 'square';
    o.frequency.setValueAtTime(200, now); o.frequency.setValueAtTime(320, now + .08); o.frequency.setValueAtTime(160, now + .18);
    g.gain.setValueAtTime(.18, now); g.gain.exponentialRampToValueAtTime(.001, now + .30);
    o.start(now); o.stop(now + .32);
  } else if (t === 'victory') {
    [523, 659, 784, 523, 659, 1047].forEach((f, i) => {
      const o = AC.createOscillator(), gn = AC.createGain();
      o.connect(gn); gn.connect(AC.destination); o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(.3, now + i * .11); gn.gain.exponentialRampToValueAtTime(.001, now + i * .11 + .2);
      o.start(now + i * .11); o.stop(now + i * .11 + .22);
    });
  }
}
function toggleMute() { muted = !muted; document.getElementById('mute').textContent = muted ? '🔇' : '🔊'; }

// ══════════════════════════════════════════════
// CANVAS SETUP
// ══════════════════════════════════════════════
const CV = document.getElementById('gc'), X = CV.getContext('2d');
const W = 900, H = 360, GY = H - 100;
const STARS = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * (H - 130), r: .3 + Math.random() * 1.8, a: .08 + Math.random() * .5, t: Math.random() * 6.28 }));
const BLDGS = Array.from({ length: 18 }, (_, i) => ({ x: i * (W / 15) - 8 + Math.random() * 20, w: 22 + Math.random() * 55, h: 32 + Math.random() * 88 }));
const CLOUDS = Array.from({ length: 6 }, () => ({ x: Math.random() * W, y: 16 + Math.random() * 65, w: 70 + Math.random() * 130, spd: .12 + Math.random() * .22 }));
const cX = CLOUDS.map(c => c.x);
// Special BG particles (petals, snow, bubbles, etc.)
let bgParticles = [];
function resetBgParticles() {
  bgParticles = [];
  const bg = BG_THEMES[S.equippedBG];
  if (!bg) return;
  const count = 30;
  if (bg.petals) {
    for (let i = 0; i < count; i++) bgParticles.push({ x: Math.random() * W, y: Math.random() * H, vx: .3 + Math.random() * .6, vy: .4 + Math.random() * .5, r: 3 + Math.random() * 4, col: ['#ffb7c5','#ff85a1','#ffc0cb','#ff69b4'][i % 4], type: 'petal', a: Math.random() * 6.28 });
  }
  if (bg.snow) {
    for (let i = 0; i < 50; i++) bgParticles.push({ x: Math.random() * W, y: Math.random() * H, vx: -.2 + Math.random() * .4, vy: .5 + Math.random() * .8, r: 1 + Math.random() * 3, col: '#ddeeff', type: 'snow' });
  }
  if (bg.bubbles) {
    for (let i = 0; i < 20; i++) bgParticles.push({ x: Math.random() * W, y: H + Math.random() * 100, vx: -.2 + Math.random() * .4, vy: -(0.4 + Math.random() * .8), r: 4 + Math.random() * 10, col: 'rgba(0,180,255,.3)', type: 'bubble' });
  }
}
resetBgParticles();

const C = { gold: '#ffd60a', teal: '#2ec4b6', hit: '#ff9f43', blk: '#6b8aaa', wht: '#fff' };

// ══════════════════════════════════════════════
// GAME STATE
// ══════════════════════════════════════════════
let gState = 'idle', curLv = 1, round = 1, pW = 0, eW = 0;
let tsec = 99, tIv = null, combo = 0, comboT = 0, maxCombo = 0;
let hits = 0, t0 = 0;
let P = null, E = null, parts = [], pops = [];
let rageMode = false;

// Daily challenge state
let dailyChallenge = null;

// ══════════════════════════════════════════════
// LEVEL CONFIG
// ══════════════════════════════════════════════
function getLvCfg(lv) {
  const t = (lv - 1) / 99;
  return {
    // AI behaviour (reaction time, aggression, block rate, jump rate)
    aiR: 0.45 - t * 0.38, aiA: 0.80 + t * 0.18, aiB: 0.15 + t * 0.65, aiJ: 0.08 + t * 0.18,
    // Enemy stats — scaled more gently so player powers stay meaningful
    eHP: 0.60 + t * 1.80,   // was 0.55 + t*2.6  → max ~2.4× instead of 3.15×
    eDM: 0.60 + t * 1.70,   // was 0.55 + t*2.5  → max ~2.3× instead of 3.05×
    eSP: 120 + t * 160,     // enemy move speed
    eSR: 0.70 + t * 1.30,   // enemy SP fill rate
    time: Math.max(35, 99 - Math.floor(t * 36)),
  };
}
function getDiff(lv) {
  if (lv <= 10) return { l: 'BEGINNER', c: '#4ade80' };
  if (lv <= 25) return { l: 'EASY', c: '#a3e635' };
  if (lv <= 45) return { l: 'MEDIUM', c: '#ffd60a' };
  if (lv <= 65) return { l: 'HARD', c: '#f97316' };
  if (lv <= 82) return { l: 'BRUTAL', c: '#e63946' };
  return { l: 'LEGEND', c: '#ec4899' };
}

// ══════════════════════════════════════════════
// FIGHTER CLASS
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
class Fighter {
  constructor(sx, isP, ci, cfg) {
    this.isP = isP; this.ci = ci;
    const ch = CHARS[ci];
    this.col = ch.col; this.spCol = ch.spCol; this.charDef = ch;
    // ── PLAYER POWER UPGRADES — permanent, strong bonuses ──
    // Each level gives a meaningful flat multiplier that persists across ALL levels.
    // Enemy stats come from cfg (level-scaled) and are NEVER affected by player powers.
    const aM  = isP ? (1 + S.powers.atk * 0.18) : cfg.eDM;   // +18% dmg per lv (was 10%)
    const hM  = isP ? (1 + S.powers.hp  * 0.25) : cfg.eHP;   // +25% HP  per lv (was 15%)
    const sM  = isP ? (1 + S.powers.spd * 0.12) : 1;         // +12% spd per lv (was 8%)
    const spM = isP ? (1 + S.powers.sp  * 0.30) : cfg.eSR;   // +30% SP  per lv (was 20%)
    const dM  = isP ? (1 + S.powers.def * 0.14) : 1;         // +14% def per lv (was 8%)
    this.maxHP = Math.round(100 * hM); this.hp = this.maxHP;
    this.aM = aM; this.sM = sM; this.dM = dM;
    this.sp = 0; this.spR = isP ? (1.4 * spM) : spM;
    this._burn = 0; this._burnT = 0; this._freeze = 0; this._poison = 0; this._poisonT = 0;
    this.x = sx; this.y = GY; this.vx = 0; this.vy = 0; this.fac = isP ? 1 : -1;
    this.st = 'idle'; this.stT = 0; this.onG = true; this.inv = 0;
    this.blk = false; this.dge = false; this.hb = null; this.fr = 0; this.aT = 0;
    this.W = ch.bodyStyle === 'heavy' ? 34 : ch.bodyStyle === 'slim' ? 24 : 28;
    this.H = ch.bodyStyle === 'heavy' ? 80 : ch.bodyStyle === 'slim' ? 68 : 72;
    this.cfg = cfg;
    this.doFlip = false; this.flipT = 0; this.flipA = 0;
    this.taunting = false; this.tauntT = 0;
    this.koSlide = false; this.koSlideV = 0;
  }
  get cx() { return this.x + this.W / 2; }
  get cy() { return this.y + this.H / 2; }
  setSt(s, d = 0) {
    this.st = s; this.stT = d;
    this.blk = (s === 'block');
    this.dge = (s === 'dodge');
    if (!['punch', 'kick', 'special'].includes(s)) this.hb = null;
  }
  update(dt, o) {
    if (this._freeze > 0) { this._freeze -= dt; this.vx = 0; this.aT += dt; if (this.aT > .1) { this.aT = 0; this.fr++; } return; }
    if (!this.onG) this.vy += 1480 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y >= GY) { this.y = GY; this.vy = 0; this.onG = true; if (this.st === 'jump') this.setSt('idle'); }
    this.x = Math.max(6, Math.min(W - this.W - 6, this.x));
    if (!['punch', 'kick', 'special', 'hurt', 'taunt'].includes(this.st)) this.fac = o.cx > this.cx ? 1 : -1;
    if (this.stT > 0) { this.stT -= dt; if (this.stT <= 0 && this.st !== 'jump') this.setSt('idle'); }
    if (this.inv > 0) this.inv -= dt;
    if (this.hb) { this.hb.life -= dt; if (this.hb.life <= 0) this.hb = null; }
    this.aT += dt; if (this.aT > .1) { this.aT = 0; this.fr++; }
    if (this.sp < 100) this.sp = Math.min(100, this.sp + 9 * dt * this.spR);
    if (this._burn > 0) { this._burn -= dt; this._burnT -= dt; if (this._burnT <= 0) { this._burnT = .35; this.hp = Math.max(0, this.hp - 3); hud(); burst(this.cx, this.cy - 10, '#f97316', 5); snd('burn'); } }
    if (this._poison > 0) { this._poison -= dt; this._poisonT -= dt; if (this._poisonT <= 0) { this._poisonT = .5; this.hp = Math.max(0, this.hp - 2); hud(); burst(this.cx, this.cy, '#4ade80', 4); snd('poison'); } }
    if (this.doFlip) { this.flipT -= dt; this.flipA += dt * 14; if (this.flipT <= 0) this.doFlip = false; }
    if (this.taunting) { this.tauntT -= dt; if (this.tauntT <= 0) { this.taunting = false; if (this.st === 'taunt') this.setSt('idle'); } }
    if (this.koSlide) { this.koSlideV *= 0.88; this.x += this.koSlideV * dt; this.x = Math.max(6, Math.min(W - this.W - 6, this.x)); if (Math.abs(this.koSlideV) < 8) this.koSlide = false; }
  }
  punch() {
    if (!['idle', 'walk', 'jump'].includes(this.st)) return;
    const d = .24 / Math.max(1, this.sM * .5 + .5);
    this.setSt('punch', d); snd('punch');
    const s = this.cx, fc = this.fac, sy = this.y;
    this.hb = { get x() { return s + fc * 18; }, get y() { return sy + 18; }, w: 72, h: 38, type: 'punch', dmg: Math.round((8 + rnd(6)) * this.aM), life: .13 };
  }
  kick() {
    if (!['idle', 'walk', 'jump'].includes(this.st)) return;
    const d = .32 / Math.max(1, this.sM * .5 + .5);
    this.setSt('kick', d); snd('kick');
    const s = this.cx, fc = this.fac, sy = this.y;
    this.hb = { get x() { return s + fc * 16; }, get y() { return sy + 42; }, w: 86, h: 38, type: 'kick', dmg: Math.round((15 + rnd(8)) * this.aM), life: .15 };
  }
  special(o) {
    if (this.sp < 100 || !['idle', 'walk'].includes(this.st)) return;
    this.sp = 0; this.setSt('special', .50);
    this.charDef.special(this, o); spBU();
  }
  dodge() {
    if (!this.onG || this.sp < 22 || !['idle', 'walk'].includes(this.st)) return;
    this.sp = Math.max(0, this.sp - 22); this.setSt('dodge', .22); snd('dodge');
    this.vx = -this.fac * 315;
    const me = this; setTimeout(() => { if (me.st === 'dodge') { me.vx = 0; me.setSt('idle'); } }, 200);
  }
  jump() {
    if (!this.onG) return;
    this.vy = -692; this.onG = false; this.setSt('jump', 99); snd('jump');
  }
  flipJump() {
    if (!this.onG) return;
    this.vy = -820; this.onG = false; this.setSt('jump', 99);
    this.doFlip = true; this.flipT = 0.55; this.flipA = 0; snd('jump');
  }
  taunt() {
    if (!['idle', 'walk'].includes(this.st)) return;
    this.setSt('taunt', .65); this.taunting = true; this.tauntT = .65;
    snd('taunt'); this.sp = Math.min(100, this.sp + 10); spBU();
  }
  tryHit(o) {
    if (!this.hb || o.inv > 0) return;
    // Undodgeable special (GOD)
    if (!this.hb.undodgeable && o.dge) return;
    const hb = this.hb, hX = hb.x, hY = hb.y;
    if (!(o.x < hX + hb.w && o.x + o.W > hX && o.y < hY + hb.h && o.y + o.H > hY)) return;
    this.hb = null;
    let dmg = hb.dmg;
    if (o.isP) dmg = Math.max(1, Math.round(dmg / Math.max(1, o.dM * .8 + .2)));
    // Piercing ignores block
    if (o.blk && o.onG && !hb.piercing) {
      dmg = Math.max(1, Math.round(dmg * .12));
      burst(o.cx, o.cy, C.blk, 6); snd('block');
    } else {
      o.setSt('hurt', .18); o.inv = .24; o.vx = this.fac * 162;
      if (o.hp - dmg <= 0) { o.koSlide = true; o.koSlideV = this.fac * 400; }
      const oo = o; setTimeout(() => { if (oo.st !== 'jump') oo.vx = 0; }, 165);
      if (this.isP) { combo++; comboT = 2.0; hits++; if (combo > maxCombo) maxCombo = combo; checkStunt(combo); }
      const isSp = hb.type === 'special';
      burst(o.cx, o.cy - 12, isSp ? this.spCol : C.hit, isSp ? 28 : 11);
      popup(o.cx, o.y - 5, isSp ? this.charDef.sname : `-${dmg}`, isSp ? this.spCol : C.wht, isSp ? 20 : 13);
      // Vampire drain
      if (hb.onHit) hb.onHit();
      if (isSp) {
        if (this.charDef.name === 'FROST' && !o._freeze) { o._freeze = 1.0; snd('freeze2'); }
        if (this.charDef.name === 'BLAZE' && !o._burn) { o._burn = 2.5; o._burnT = 0; }
        if (this.charDef.name === 'VIPER' && !o._poison) { o._poison = 4.0; o._poisonT = 0; }
      }
    }
    o.hp = Math.max(0, o.hp - dmg);
    this.sp = Math.min(100, this.sp + dmg * .85 * this.spR);
    hud(); spBU();
  }
}

function rnd(n) { return Math.random() * n | 0; }
function burst(x, y, col, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 75 + Math.random() * 235;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 55, life: .28 + Math.random() * .34, ml: .60, col, r: 1.8 + Math.random() * 3.2 });
  }
}
function popup(x, y, text, col, size) { pops.push({ x, y, vy: -80, text, col, size, life: .68, ml: .68 }); }

// ══════════════════════════════════════════════
// AI SYSTEM
// ══════════════════════════════════════════════
let aiT = 0;
function tickAI(dt) {
  if (gState !== 'fight' || !E || !P) return;

  const d = Math.abs(P.cx - E.cx);
  const c = E.cfg;
  const canAct = ['idle','walk'].includes(E.st) && E._freeze <= 0;

  // ── MOVEMENT: runs every frame for smooth chasing ──
  if (E._freeze <= 0 && !['hurt','block','special','punch','kick'].includes(E.st)) {
    if (d > 90) {
      // Far — chase at full speed toward player
      const dir = P.cx > E.cx ? 1 : -1;
      E.vx = dir * (c.eSP * 1.2);
    } else if (d < 40) {
      // Too close — step back
      const dir = P.cx > E.cx ? -1 : 1;
      E.vx = dir * (c.eSP * 0.5);
    } else {
      E.vx = 0; // in sweet-spot range — stand and fight
    }
  }

  // ── DECISIONS: on timer ──
  aiT -= dt;
  if (aiT > 0) return;
  aiT = c.aiR + Math.random() * 0.06;

  if (E._freeze > 0) return;

  const rBlock  = Math.random();
  const rAttack = Math.random();
  const rMove   = Math.random();
  const rJump   = Math.random();

  // React to player attacks with block
  if (['punch','kick','special'].includes(P.st) && rBlock < c.aiB && canAct) {
    E.setSt('block', 0.22);
    E.vx = 0;
    return;
  }

  // Attack when close enough
  if (d < 120 && canAct && rAttack < c.aiA) {
    if (E.sp >= 100 && rMove < 0.22) {
      E.special(P);
    } else if (rMove < 0.55) {
      E.punch();
    } else {
      E.kick();
    }
    return;
  }

  // Jump occasionally
  if (rJump < c.aiJ && E.onG && canAct) E.jump();
}

// ══════════════════════════════════════════════
// INPUT SYSTEM
// ══════════════════════════════════════════════
const K = {}, PK = {};
let lastJumpTime = 0;
document.addEventListener('keydown', e => {
  if (['Space','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','KeyF','KeyT','Escape'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape' && gState === 'fight') { gState = 'idle'; clearInterval(tIv); showTitle(); return; }
  K[e.code] = true;
});
document.addEventListener('keyup', e => { K[e.code] = false; });

function doInput() {
  if (gState !== 'fight' || !P) return;
  if (K['KeyA']) { P.vx = -196 * P.sM; if (P.st === 'idle') P.setSt('walk'); }
  else if (K['KeyD']) { P.vx = 196 * P.sM; if (P.st === 'idle') P.setSt('walk'); }
  else { P.vx = 0; if (P.st === 'walk') P.setSt('idle'); }
  if (K['KeyW'] && !PK['KeyW']) {
    const now = Date.now();
    if (now - lastJumpTime < 280 && P.onG) P.flipJump();
    else P.jump();
    lastJumpTime = now;
  }
  if (K['KeyJ'] && !PK['KeyJ']) P.punch();
  if (K['KeyK'] && !PK['KeyK']) P.kick();
  if (K['KeyL'] && !PK['KeyL']) P.special(E);
  if (K['Space'] && !PK['Space']) P.dodge();
  if (K['KeyF']) P.setSt('block', .05);
  if (K['KeyT'] && !PK['KeyT']) P.taunt();
  for (const k in PK) PK[k] = false;
  for (const k in K) if (K[k]) PK[k] = true;
}

function bindBtn(id, code) {
  const el = document.getElementById(id); if (!el) return;
  const pr = () => { K[code] = true; el.classList.add('pressed'); rAC(); };
  const rl = () => { K[code] = false; el.classList.remove('pressed'); };
  el.addEventListener('touchstart', e => { e.preventDefault(); pr(); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); rl(); }, { passive: false });
  el.addEventListener('touchcancel', e => { e.preventDefault(); rl(); }, { passive: false });
  el.addEventListener('mousedown', () => pr());
  el.addEventListener('mouseup', () => rl());
  el.addEventListener('mouseleave', () => rl());
}
['tU','tL','tC','tR','tP','tK','tS','tB'].forEach((id, i) => bindBtn(id, ['KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','KeyF'][i]));

function spBU() {
  const b = document.getElementById('tS'); if (!b) return;
  if (P && P.sp >= 100) b.classList.add('rdy');
  else b.classList.remove('rdy');
}

// ══════════════════════════════════════════════
// HUD
// ══════════════════════════════════════════════
function hud() {
  if (!P || !E) return;
  document.getElementById('php').style.width = (P.hp / P.maxHP * 100) + '%';
  document.getElementById('ehp').style.width = (E.hp / E.maxHP * 100) + '%';
  document.getElementById('psp').style.width = P.sp + '%';
  document.getElementById('esp').style.width = E.sp + '%';
  document.getElementById('psp').style.background = P.spCol;
  document.getElementById('esp').style.background = E.spCol;
  const dot = n => '●'.repeat(n) + '○'.repeat(Math.max(0, 2 - n));
  document.getElementById('pw').textContent = dot(pW);
  document.getElementById('ew').textContent = dot(eW);
  document.getElementById('rl').textContent = 'ROUND ' + round;
  spBU();
  const pct = P.hp / P.maxHP;
  if (pct < 0.25 && !rageMode) {
    rageMode = true;
    document.getElementById('php').style.background = 'linear-gradient(90deg,#ff00aa,#e63946)';
    popup(P.cx, P.y - 20, '⚠ RAGE MODE!', '#ff00aa', 16);
    flashBG('#e6394630', 500);
  } else if (pct >= 0.25 && rageMode) {
    rageMode = false;
    document.getElementById('php').style.background = 'linear-gradient(90deg,#c0392b,var(--red))';
  }
}
function tickCombo(dt) {
  if (combo <= 1) return;
  comboT -= dt;
  const el = document.getElementById('comb');
  el.textContent = combo >= 5 ? `${combo}x COMBO!!` : `${combo}x HIT`;
  el.style.background = combo >= 5 ? C.teal : C.gold;
  el.style.color = combo >= 5 ? '#fff' : '#000';
  if (comboT <= 0) { combo = 0; resetStunt(); el.textContent = '—'; el.style.background = C.gold; el.style.color = '#000'; }
}

// ══════════════════════════════════════════════
// TIMER
// ══════════════════════════════════════════════
function startTimer() {
  const cfg = getLvCfg(curLv); tsec = cfg.time;
  clearInterval(tIv);
  const el = document.getElementById('tim'); el.textContent = tsec; el.className = 'tim';
  tIv = setInterval(() => {
    if (gState !== 'fight') return;
    tsec--; el.textContent = tsec; el.className = 'tim' + (tsec <= 10 ? ' dng' : '');
    if (tsec <= 0) { clearInterval(tIv); timeout(); }
  }, 1000);
}
function timeout() {
  if (!P || !E) return;
  if (P.hp > E.hp) endRound('p');
  else if (E.hp > P.hp) endRound('e');
  else endRound('d');
}

// ══════════════════════════════════════════════
// SCREEN MANAGEMENT
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
function hideAll() {
  ['ts','level-screen','shop-screen','pshop-screen','bgshop-screen','sb'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'scr off';
  });
  document.getElementById('game-wrap').style.display = 'none';
}
function showTitle() { hideAll(); document.getElementById('ts').className = 'scr'; gState = 'idle'; clearInterval(tIv); updateUI(); }
function showLevelSelect() { hideAll(); document.getElementById('level-screen').className = 'scr'; buildLvGrid(); }
function showCharShop() { hideAll(); document.getElementById('shop-screen').className = 'scr'; buildCharGrid(); }
function showPowerShop() { hideAll(); document.getElementById('pshop-screen').className = 'scr'; buildPowerGrid(); }
function showBGShop() { hideAll(); document.getElementById('bgshop-screen').className = 'scr'; buildBGGrid(); }

function showHelp() {
  document.getElementById('help-modal').classList.add('on');
}
function closeHelp() {
  document.getElementById('help-modal').classList.remove('on');
}

function showSB() { hideAll(); document.getElementById('sb').className = 'scr'; }

function updateUI() {
  document.getElementById('ts-lvl').textContent = S.playerLevel;
  document.getElementById('ts-coins').textContent = S.coins;
  document.getElementById('ts-wins').textContent = S.totalWins;
  document.getElementById('ts-streak').textContent = S.bestStreak || 0;
  const xn = xpN(S.playerLevel), pct = S.playerLevel >= 100 ? 100 : Math.floor(S.xp / xn * 100);
  document.getElementById('ts-xp').style.width = pct + '%';
  document.getElementById('ts-xpn').textContent = S.playerLevel >= 100 ? 'MAX' : `${S.xp}/${xn}`;
  // Update daily challenge display
  updateDailyChallenge();
}

// ══════════════════════════════════════════════
// DAILY CHALLENGE
// ══════════════════════════════════════════════
function getDailyKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function updateDailyChallenge() {
  const key = getDailyKey();
  const el = document.getElementById('daily-info');
  if (!el) return;
  if (S.dailyDone === key) {
    el.textContent = '✅ DAILY DONE! (' + S.dailyCoins + ' earned)';
    el.style.color = '#4ade80';
  } else {
    // Generate daily based on date
    const lvls = [15, 30, 45, 60, 75, 90];
    const dailyLv = lvls[new Date().getDate() % lvls.length];
    el.textContent = `🎯 DAILY: Beat Level ${dailyLv} for 2x coins!`;
    el.style.color = '#ffd60a';
    dailyChallenge = dailyLv;
  }
}

// ══════════════════════════════════════════════
// GRID BUILDERS
// ══════════════════════════════════════════════
function buildLvGrid() {
  document.getElementById('ls-sub').textContent = `Player Lv ${S.playerLevel} · Coins ${S.coins} · Wins ${S.totalWins} · Progress: ${S.clearedLevels.length}/100`;
  const g = document.getElementById('lgrid'); g.innerHTML = '';
  for (let lv = 1; lv <= 100; lv++) {
    const btn = document.createElement('div');
    const done = S.clearedLevels.includes(lv);
    const unlk = lv <= S.unlockedLevels;
    const isCur = lv === S.unlockedLevels && !done;
    const { l, c } = getDiff(lv);
    btn.className = 'lvb' + (done ? ' ld' : isCur ? ' lc' : unlk ? ' lu' : ' ll');
    btn.innerHTML = `${lv}<span class="dlbl" style="color:${c}">${done ? '✓' : ''}</span>`;
    btn.title = `Level ${lv} — ${l}`;
    if (unlk) btn.onclick = () => startGame(lv);
    g.appendChild(btn);
  }
}
function buildCharGrid() {
  document.getElementById('scoins').textContent = S.coins;
  const g = document.getElementById('cgrid'); g.innerHTML = '';
  CHARS.forEach((ch, i) => {
    const ow = S.owned.includes(i), eq = S.equipped === i;
    const card = document.createElement('div');
    card.className = 'cc' + (eq ? ' sel' : '');
    card.style.setProperty('--char-col', ch.col);
    // Rarity label
    const rarity = i >= 14 ? '✦ DIVINE' : i >= 12 ? '★ LEGENDARY' : i >= 10 ? '◆ EPIC' : i >= 7 ? '◇ RARE' : '';
    card.innerHTML = `${eq ? '<span class="cbdg eq">EQUIPPED</span>' : ow ? '<span class="cbdg ow">OWNED</span>' : '<span class="cbdg lk">🔒</span>'}
      <div class="ci">${ch.icon}</div>
      <div class="cn" style="color:${ch.col}">${ch.name}</div>
      ${rarity ? `<div style="font-size:9px;color:${ch.spCol};margin-bottom:2px;">${rarity}</div>` : ''}
      <div class="cd">${ch.desc}</div>
      <div class="cs" style="color:${ch.spCol}">⚡ ${ch.sname}</div>
      ${ow
        ? (eq
          ? `<div style="font-size:11px;color:var(--gold);margin-top:5px;">★ IN USE</div>`
          : `<button class="btn b4 bsm" style="margin-top:6px" onclick="equipChar(${i})">EQUIP</button>`)
        : `<div class="cp">💰 ${ch.price}</div><button class="btn bsm" style="margin-top:4px${S.coins < ch.price ? ';opacity:.35' : ''}" onclick="buyChar(${i})" ${S.coins < ch.price ? 'disabled' : ''}>BUY</button>`}`;
    g.appendChild(card);
  });
}
function buyChar(i) {
  const ch = CHARS[i];
  if (S.coins < ch.price) { showToast('Not enough coins!'); return; }
  S.coins -= ch.price; S.owned.push(i); S.equipped = i;
  doSave(); snd('coin'); buildCharGrid();
  document.getElementById('scoins').textContent = S.coins;
  updateUI(); checkAchievements();
}
function equipChar(i) {
  if (!S.owned.includes(i)) return;
  S.equipped = i; doSave(); snd('coin'); buildCharGrid();
}
function buildPowerGrid() {
  document.getElementById('pcoins').textContent = S.coins;
  const g = document.getElementById('pgrid'); g.innerHTML = '';
  const bonusNow = {
    hp:  lv => lv > 0 ? `HP: ${Math.round(100*(1+lv*0.25))} (+${lv*25}%)` : 'No bonus yet',
    atk: lv => lv > 0 ? `DMG x${(1+lv*0.18).toFixed(2)} (+${lv*18}%)` : 'No bonus yet',
    spd: lv => lv > 0 ? `SPD x${(1+lv*0.12).toFixed(2)} (+${lv*12}%)` : 'No bonus yet',
    sp:  lv => lv > 0 ? `SP Fill x${(1+lv*0.30).toFixed(2)} (+${lv*30}%)` : 'No bonus yet',
    def: lv => lv > 0 ? `DMG taken -${lv*14}%` : 'No bonus yet',
  };
  const bonusNext = {
    hp:  nl => `HP: ${Math.round(100*(1+nl*0.25))}`,
    atk: nl => `DMG x${(1+nl*0.18).toFixed(2)}`,
    spd: nl => `SPD x${(1+nl*0.12).toFixed(2)}`,
    sp:  nl => `SP x${(1+nl*0.30).toFixed(2)}`,
    def: nl => `DEF -${nl*14}%`,
  };
  POWERS.forEach(pw => {
    const lv = S.powers[pw.id] || 0, mx = lv >= 5;
    const np = mx ? null : pw.prices[lv];
    const card = document.createElement('div'); card.className = 'pc';
    const stars = '★'.repeat(lv) + '☆'.repeat(5 - lv);
    card.innerHTML = `
      <div class="pi">${pw.icon}</div>
      <div class="pn">${pw.name}</div>
      <div class="pd">${pw.desc}</div>
      <div class="pl" style="font-size:15px;margin:4px 0">${stars}</div>
      <div class="pl">Level ${lv}/5${mx ? ' — MAXED ✓' : ''}</div>
      <div style="font-size:11px;color:${lv>0?'#ffd60a':'var(--muted)'};margin:3px 0;font-weight:700">${bonusNow[pw.id](lv)}</div>
      <div style="font-size:9px;color:var(--teal);letter-spacing:1px;margin-bottom:4px">⚡ PERMANENT — ALL LEVELS</div>
      ${mx ? '' : `<div style="font-size:9px;color:var(--muted);margin-bottom:3px">Next: ${bonusNext[pw.id](lv+1)}</div><div class="pp">💰 ${np}</div><button class="btn b5 bsm" style="margin-top:5px${S.coins < np ? ';opacity:.35' : ''}" onclick="buyPower('${pw.id}')" ${S.coins < np ? 'disabled' : ''}>UPGRADE</button>`}`;
    g.appendChild(card);
  });
}
function buyPower(id) {
  const pw = POWERS.find(p => p.id === id);
  const lv = S.powers[id] || 0;
  if (lv >= 5) { showToast('Already maxed!'); return; }
  const pr = pw.prices[lv];
  if (S.coins < pr) { showToast('Not enough coins!'); return; }
  S.coins -= pr; S.powers[id] = lv + 1;
  doSave(); snd('coin'); buildPowerGrid();
  document.getElementById('pcoins').textContent = S.coins;
  updateUI();
}
function buildBGGrid() {
  document.getElementById('bgcoins').textContent = S.coins;
  const g = document.getElementById('bggrid'); g.innerHTML = '';
  BG_THEMES.forEach((bg, i) => {
    const ow = S.ownedBGs.includes(i), eq = S.equippedBG === i;
    const card = document.createElement('div');
    card.className = 'bgc' + (eq ? ' sel' : '');
    const previewGrad = `linear-gradient(180deg, ${bg.sky[0]}, ${bg.sky[bg.sky.length - 1]})`;
    card.innerHTML = `${eq ? '<span class="bgbdg eq">ON</span>' : ow ? '<span class="bgbdg ow">OWN</span>' : '<span class="bgbdg lk">🔒</span>'}
      <div class="bgprev" style="background:${previewGrad}">${bg.icon}</div>
      <div class="bgn">${bg.name}</div>
      <div style="font-size:9px;color:var(--muted);margin:2px 0">${bg.desc}</div>
      ${ow
        ? (eq
          ? `<div style="font-size:10px;color:var(--gold)">ACTIVE</div>`
          : `<button class="btn b4 bsm" style="margin-top:4px" onclick="equipBG(${i})">USE</button>`)
        : `<div class="bgp">💰 ${bg.price}</div><button class="btn bsm" style="margin-top:3px;font-size:10px${S.coins < bg.price ? ';opacity:.35' : ''}" onclick="buyBG(${i})" ${S.coins < bg.price ? 'disabled' : ''}>BUY</button>`}`;
    g.appendChild(card);
  });
}
function buyBG(i) {
  const bg = BG_THEMES[i];
  if (S.coins < bg.price) { showToast('Not enough coins!'); return; }
  S.coins -= bg.price; S.ownedBGs.push(i); S.equippedBG = i;
  doSave(); snd('coin'); buildBGGrid();
  document.getElementById('bgcoins').textContent = S.coins;
  updateUI(); resetBgParticles();
}
function equipBG(i) {
  if (!S.ownedBGs.includes(i)) return;
  S.equippedBG = i; doSave(); snd('coin'); buildBGGrid(); resetBgParticles();
}

function showToast(msg) {
  const el = document.getElementById('achieve-toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// ══════════════════════════════════════════════
// GAME FLOW
// ══════════════════════════════════════════════
function startGame(lv) {
  curLv = lv;
  hideAll();
  document.getElementById('game-wrap').style.display = 'flex';
  round = 1; pW = 0; eW = 0; hits = 0; maxCombo = 0; t0 = Date.now();
  rageMode = false; resetStunt();
  newRound();
}
function restartLevel() { startGame(curLv); }
function nextLevel() { startGame(Math.min(100, curLv + 1)); }

function newRound() {
  const cfg = getLvCfg(curLv);
  // Pick a TRULY random character from ALL 15 — every level gets variety
  let eidx = Math.floor(Math.random() * CHARS.length);
  // Don't mirror the player's character
  if (eidx === S.equipped && CHARS.length > 1) {
    eidx = (eidx + 1 + Math.floor(Math.random() * (CHARS.length - 1))) % CHARS.length;
  }
  P = new Fighter(88, true, S.equipped, cfg);
  E = new Fighter(W - 116, false, eidx, cfg);
  document.getElementById('p-icon').textContent = CHARS[S.equipped].icon;
  document.getElementById('p-name').textContent = CHARS[S.equipped].name;
  document.getElementById('e-icon').textContent = CHARS[eidx].icon;
  document.getElementById('e-lvl').textContent = curLv;
  document.getElementById('p-splbl').textContent = '⚡ ' + CHARS[S.equipped].sname;
  document.getElementById('e-splbl').textContent = CHARS[eidx].sname + ' ⚡';
  parts = []; pops = []; combo = 0; aiT = 0; rageMode = false;
  hud(); spBU();
  showOv('ROUND ' + round, 'LEVEL ' + curLv, false);
  setTimeout(() => { hideOv(); gState = 'fight'; startTimer(); snd('fight'); }, 1350);
}
function endRound(w) {
  if (gState !== 'fight') return;
  gState = 'rover'; clearInterval(tIv); snd('ko');
  if (w === 'p') { pW++; showOv('KO!', 'YOU WIN', false); }
  else if (w === 'e') { eW++; showOv('KO!', 'ENEMY WINS', false); }
  else showOv('DRAW', 'TIME UP', false);
  hud();
  if (pW >= 2 || eW >= 2) setTimeout(() => endGame(pW >= 2 ? 'p' : 'e'), 1800);
  else { round++; setTimeout(newRound, 2200); }
}
function endGame(w) {
  gState = 'gameover'; hideOv(); S.totalGames++;
  const won = (w === 'p'), lv = curLv, cfg = getLvCfg(lv);
  const base = 30 + lv * 2;
  if (won) { S.winStreak++; if (S.winStreak > S.bestStreak) S.bestStreak = S.winStreak; }
  else { S.winStreak = 0; }
  const streakBonus = won ? Math.floor(S.winStreak * 0.15) : 0;
  // Daily challenge bonus
  let dailyBonus = 0, isDaily = false;
  const key = getDailyKey();
  if (won && dailyChallenge && lv === dailyChallenge && S.dailyDone !== key) {
    S.dailyDone = key;
    dailyBonus = Math.round(base * (1 + cfg.aiA * .5));
    S.dailyCoins += dailyBonus;
    isDaily = true;
  }
  const co = won ? Math.round((base * (1 + cfg.aiA * .5)) * (1 + streakBonus)) + dailyBonus : Math.round(8 + lv * .2);
  const xp = won ? Math.round((50 + lv * 3) * (1 + cfg.aiA * .3)) : Math.round(12 + lv * .5);
  if (won) {
    S.totalWins++;
    if (!S.clearedLevels.includes(lv)) S.clearedLevels.push(lv);
    if (lv >= S.unlockedLevels && lv < 100) S.unlockedLevels = lv + 1;
  }
  addCoins(co);
  const lu = addXP(xp);
  updateUI(); doSave();
  checkAchievements();
  document.getElementById('sb-title').textContent = won ? 'VICTORY!' : 'DEFEATED';
  document.getElementById('sb-title').style.color = won ? '#c48000' : '#e63946';
  document.getElementById('sb-res').textContent = won ? 'WIN 🏆' : 'LOSS';
  document.getElementById('sb-lv').textContent = 'Level ' + lv + ' (' + getDiff(lv).l + ')';
  document.getElementById('sb-co').textContent = '+' + co + (isDaily ? ' (🎯 DAILY BONUS!)' : streakBonus > 0 ? ' (🔥 x' + S.winStreak + ' streak!)' : '');
  document.getElementById('sb-xp').textContent = '+' + xp + ' XP';
  document.getElementById('sb-h').textContent = hits;
  document.getElementById('sb-c').textContent = maxCombo + 'x';
  document.getElementById('sb-streak').textContent = S.winStreak + (won && S.winStreak > 1 ? ' 🔥' : '');
  document.getElementById('sb-yl').textContent = 'Lv.' + S.playerLevel + (S.playerLevel >= 100 ? ' (MAX)' : '');
  document.getElementById('sb-next').style.display = (won && lv < 100) ? 'inline-block' : 'none';
  const b = document.getElementById('luban');
  if (lu) { b.classList.add('show'); b.textContent = '⬆ LEVEL UP! → Lv.' + S.playerLevel; snd('levelup'); }
  else b.classList.remove('show');
  if (won) { spawnConfetti(); snd('victory'); setTimeout(() => flashBG('#ffd60a25', 600), 300); }
  showSB();
}
function showOv(t, s, btn) {
  const ov = document.getElementById('ov');
  ov.style.background = 'rgba(8,10,22,.85)';
  ov.classList.add('on');
  document.getElementById('ov-t').textContent = t;
  document.getElementById('ov-t').style.color = t.includes('KO') ? '#ffd60a' : t.includes('FIGHT') ? '#2ec4b6' : '#edf2f4';
  document.getElementById('ov-s').textContent = s;
  document.getElementById('ov-btn').style.display = btn ? 'block' : 'none';
}
function hideOv() { document.getElementById('ov').classList.remove('on'); }
function nextRound() { hideOv(); newRound(); }

// ══════════════════════════════════════════════
// BG DRAWING ENGINE — 30 Themes
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
function drawBG(dt) {
  const bg = BG_THEMES[S.equippedBG] || BG_THEMES[0];
  const skyColors = bg.sky;

  // Sky gradient
  const grad = X.createLinearGradient(0, 0, 0, H - 100);
  skyColors.forEach((col, i) => grad.addColorStop(i / (skyColors.length - 1), col));
  X.fillStyle = grad; X.fillRect(0, 0, W, H - 100);

  // SPECIAL BG EFFECTS
  const t = Date.now() * 0.001;

  // Nebula
  if (bg.nebula) {
    for (let ni = 0; ni < 3; ni++) {
      const nx = W * (.2 + ni * .3), ny = 60 + ni * 20;
      const ng = X.createRadialGradient(nx, ny, 10, nx, ny, 80 + ni * 30);
      const cols = bg.galactic
        ? ['rgba(150,0,255,.14)', 'rgba(0,100,255,.08)', 'transparent']
        : ['rgba(100,30,180,.12)', 'rgba(30,80,160,.07)', 'transparent'];
      ng.addColorStop(0, cols[0]); ng.addColorStop(.5, cols[1]); ng.addColorStop(1, cols[2]);
      X.fillStyle = ng; X.fillRect(0, 0, W, H - 100);
    }
  }
  // Moon
  if (bg.moonPhase || bg.bloodmoon) {
    const mcol = bg.bloodmoon ? '#cc2200' : '#e8e8c8';
    const mglow = bg.bloodmoon ? 'rgba(180,0,0,.3)' : 'rgba(230,230,200,.2)';
    const mg = X.createRadialGradient(750, 50, 2, 750, 50, 50);
    mg.addColorStop(0, mcol); mg.addColorStop(.7, mcol); mg.addColorStop(1, 'transparent');
    X.fillStyle = mglow; X.beginPath(); X.arc(750, 50, 55, 0, Math.PI * 2); X.fill();
    X.fillStyle = mg; X.beginPath(); X.arc(750, 50, 32, 0, Math.PI * 2); X.fill();
    // Moon craters
    X.fillStyle = bg.bloodmoon ? 'rgba(100,0,0,.3)' : 'rgba(150,150,120,.3)';
    [[738,44,5],[760,60,7],[752,38,3]].forEach(([cx,cy,r]) => { X.beginPath(); X.arc(cx,cy,r,0,Math.PI*2); X.fill(); });
  }
  // Lava flowing floor effect
  if (bg.lava || bg.hellfire || bg.eruption) {
    const lavaT = t * (bg.hellfire ? 2.5 : 1.5);
    for (let lx = 0; lx < W; lx += 8) {
      const ly = H - 100 + Math.sin(lx * 0.04 + lavaT) * 6;
      const lg = X.createLinearGradient(lx, ly, lx, ly + 20);
      lg.addColorStop(0, bg.hellfire ? '#ff1500' : '#ff4500');
      lg.addColorStop(1, bg.hellfire ? '#8b0000' : '#8b1a00');
      X.fillStyle = lg; X.fillRect(lx, ly, 8, 20);
    }
  }
  // Aurora
  if (bg.aurora) {
    for (let ai = 0; ai < 4; ai++) {
      const ax = W * (.1 + ai * .25) + Math.sin(t * .3 + ai) * 40;
      const aGrad = X.createLinearGradient(ax, 0, ax + 60, H - 100);
      const aurCols = ['rgba(0,255,120,.12)', 'rgba(0,200,255,.08)', 'rgba(100,255,150,.1)', 'rgba(50,150,255,.09)'];
      aGrad.addColorStop(0, aurCols[ai % aurCols.length]);
      aGrad.addColorStop(.5, aurCols[(ai + 1) % aurCols.length]);
      aGrad.addColorStop(1, 'transparent');
      X.fillStyle = aGrad; X.fillRect(ax, 0, 60, H - 100);
    }
  }
  // Rainbow
  if (bg.rainbow) {
    const rainbowCols = ['rgba(255,0,0,.08)','rgba(255,165,0,.08)','rgba(255,255,0,.07)','rgba(0,255,0,.07)','rgba(0,100,255,.07)','rgba(150,0,255,.08)'];
    rainbowCols.forEach((col, i) => {
      X.strokeStyle = col; X.lineWidth = 28;
      X.beginPath(); X.arc(W / 2, H, 180 + i * 30, Math.PI, 2 * Math.PI); X.stroke();
    });
  }
  // Void warping effect
  if (bg.void_fx) {
    const vg = X.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*.6);
    vg.addColorStop(0, `rgba(80,0,150,${0.08 + 0.05 * Math.sin(t * 2)})`);
    vg.addColorStop(.5, `rgba(40,0,80,${0.05 + 0.03 * Math.sin(t * 1.5)})`);
    vg.addColorStop(1, 'transparent');
    X.fillStyle = vg; X.fillRect(0, 0, W, H - 100);
    // Void circles
    for (let vi = 0; vi < 3; vi++) {
      X.strokeStyle = `rgba(150,0,255,${0.1 + 0.05 * Math.sin(t + vi)})`;
      X.lineWidth = 2;
      X.beginPath(); X.arc(W/2, H/2, 60 + vi*50 + Math.sin(t*0.8+vi)*20, 0, Math.PI*2); X.stroke();
    }
  }
  // Crystal sparkles
  if (bg.crystal) {
    for (let ci = 0; ci < 5; ci++) {
      const cx = 100 + ci * 160, cy = 30 + ci * 15;
      const cg = X.createRadialGradient(cx, cy, 0, cx, cy, 40);
      cg.addColorStop(0, 'rgba(180,220,255,.18)'); cg.addColorStop(1, 'transparent');
      X.fillStyle = cg; X.fillRect(cx - 40, cy - 40, 80, 80);
      X.strokeStyle = `rgba(150,200,255,${0.15 + 0.1 * Math.sin(t * 2 + ci)})`;
      X.lineWidth = 1; X.beginPath(); X.arc(cx, cy, 15 + ci * 8, 0, Math.PI * 2); X.stroke();
    }
  }
  // Cyber grid
  if (bg.cybergrid) {
    X.strokeStyle = 'rgba(0,255,180,.08)'; X.lineWidth = 1;
    // Perspective grid
    for (let cgi = 0; cgi < 20; cgi++) {
      const fx = cgi * (W / 20);
      X.beginPath(); X.moveTo(fx, 0); X.lineTo(W / 2, H - 100); X.stroke();
    }
    for (let cgj = 0; cgj < 8; cgj++) {
      const fy = cgj * ((H - 100) / 8);
      X.beginPath(); X.moveTo(0, fy); X.lineTo(W, fy); X.stroke();
    }
  }
  // Neon buildings glow
  if (bg.neon && bg.buildings) {
    const neonCols = ['#ff00ff','#00ffff','#ff0080','#0080ff'];
    BLDGS.forEach((b, bi) => {
      const nc = neonCols[bi % neonCols.length];
      X.shadowColor = nc; X.shadowBlur = 14;
      X.strokeStyle = nc; X.lineWidth = 1.5;
      X.strokeRect(b.x, H - 100 - b.h, b.w, b.h);
      X.shadowBlur = 0;
    });
  }
  // Stars
  if (bg.stars) {
    STARS.forEach(s => {
      s.t += .018;
      X.globalAlpha = s.a * (.7 + .3 * Math.sin(s.t));
      X.fillStyle = bg.bloodmoon ? '#ffaaaa' : '#b8d4ff';
      X.beginPath(); X.arc(s.x, s.y, s.r, 0, Math.PI * 2); X.fill();
    });
    X.globalAlpha = 1;
  }
  // Clouds
  if (bg.clouds) {
    CLOUDS.forEach((c, i) => {
      cX[i] = (cX[i] + c.spd) % (W + 160);
      const cx2 = cX[i] - 80;
      X.fillStyle = bg.sky[0].startsWith('#1a6') ? 'rgba(255,255,255,.22)' : 'rgba(180,210,255,.07)';
      X.beginPath(); X.ellipse(cx2, c.y, c.w * .52, 19, 0, 0, Math.PI * 2); X.fill();
      X.beginPath(); X.ellipse(cx2 + c.w * .22, c.y - 11, c.w * .34, 15, 0, 0, Math.PI * 2); X.fill();
    });
  }
  // Buildings
  if (bg.buildings) {
    const buildCol = bg.neon ? '#060812' : bg.ruins ? '#2a1800' : '#141e38';
    BLDGS.forEach(b => {
      const top = H - 100 - b.h;
      X.fillStyle = buildCol; X.fillRect(b.x, top, b.w, b.h);
      for (let wy = 8; wy < b.h - 10; wy += 13) {
        for (let wx = 4; wx < b.w - 5; wx += 9) {
          const shine = Math.sin(b.x * 6.7 + wy * 2.9 + wx);
          if (bg.neon) {
            X.fillStyle = shine > .3 ? 'rgba(255,0,255,.2)' : 'rgba(0,255,255,.08)';
          } else if (bg.ruins) {
            X.fillStyle = shine > .5 ? 'rgba(180,120,40,.15)' : 'rgba(60,40,10,.05)';
          } else {
            X.fillStyle = shine > .3 ? 'rgba(255,220,80,.27)' : 'rgba(60,120,200,.05)';
          }
          X.fillRect(b.x + wx, top + wy, 5, 7);
        }
      }
    });
  }

  // Floor
  const fgGrad = X.createLinearGradient(0, H - 100, 0, H);
  fgGrad.addColorStop(0, bg.floor[0]); fgGrad.addColorStop(1, bg.floor[1]);
  X.fillStyle = fgGrad; X.fillRect(0, H - 100, W, 100);
  // Floor line
  X.fillStyle = bg.floorLine; X.fillRect(0, H - 100, W, 2);
  // Floor grid
  X.strokeStyle = bg.gridCol; X.lineWidth = 1;
  for (let fx = 0; fx < W; fx += 44) { X.beginPath(); X.moveTo(fx, H - 100); X.lineTo(fx, H); X.stroke(); }
  for (let fy = H - 80; fy < H; fy += 26) { X.beginPath(); X.moveTo(0, fy); X.lineTo(W, fy); X.stroke(); }

  // Storm lightning flash
  if (bg.lightning && Math.random() < 0.004) {
    X.fillStyle = 'rgba(80,80,255,.18)';
    X.fillRect(0, 0, W, H - 100);
    const lx = 100 + Math.random() * 700, lw = 1 + Math.random() * 3;
    X.strokeStyle = `rgba(200,200,255,${0.5 + Math.random() * .4})`;
    X.lineWidth = lw;
    X.beginPath(); X.moveTo(lx, 0);
    for (let ly = 0; ly < H - 100; ly += 20) { X.lineTo(lx + Math.random() * 30 - 15, ly); }
    X.stroke();
  }

  // BG particles (petals, snow, bubbles)
  bgParticles.forEach(p => {
    if (p.type === 'petal') {
      p.x += p.vx; p.y += p.vy;
      p.a += 0.05;
      if (p.x > W + 20) p.x = -20;
      if (p.y > H) p.y = -10;
      X.save(); X.globalAlpha = .7; X.fillStyle = p.col;
      X.translate(p.x, p.y); X.rotate(p.a);
      X.beginPath(); X.ellipse(0, 0, p.r, p.r * .5, 0, 0, Math.PI * 2); X.fill();
      X.restore();
    } else if (p.type === 'snow') {
      p.x += p.vx; p.y += p.vy;
      if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
      X.globalAlpha = .5; X.fillStyle = p.col;
      X.beginPath(); X.arc(p.x, p.y, p.r, 0, Math.PI * 2); X.fill();
    } else if (p.type === 'bubble') {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -20) { p.y = H + 10; p.x = Math.random() * W; }
      X.globalAlpha = .4; X.strokeStyle = p.col; X.lineWidth = 1.5;
      X.beginPath(); X.arc(p.x, p.y, p.r, 0, Math.PI * 2); X.stroke();
    }
    X.globalAlpha = 1;
  });

  // Rage mode vignette
  if (rageMode) {
    const rt = Date.now() * .004;
    const vg = X.createRadialGradient(W / 2, H / 2, W * .2, W / 2, H / 2, W * .7);
    vg.addColorStop(0, 'rgba(230,57,70,0)');
    vg.addColorStop(1, `rgba(230,57,70,${0.10 + 0.06 * Math.sin(rt)})`);
    X.fillStyle = vg; X.fillRect(0, 0, W, H);
  }
}

// ══════════════════════════════════════════════
// FIGHTER DRAWING — Unique per bodyStyle
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
function drawShadow(f) {
  X.save(); X.globalAlpha = .24; X.fillStyle = '#000';
  X.beginPath(); X.ellipse(f.cx, GY, f.W * .92, 7, 0, 0, Math.PI * 2); X.fill();
  X.restore();
}
function drawGlow(f) {
  if (f.sp < 100 && !rageMode) return;
  const gt = Date.now() * .006;
  const col = (rageMode && f.isP) ? '#ff4466' : f.spCol;
  X.save();
  X.globalAlpha = .2 + .1 * Math.sin(gt); X.strokeStyle = col; X.lineWidth = 2.5;
  X.beginPath(); X.arc(f.cx, f.cy, 46, 0, Math.PI * 2); X.stroke();
  X.globalAlpha = .08 + .05 * Math.sin(gt * 2); X.fillStyle = col;
  X.beginPath(); X.arc(f.cx, f.cy, 46, 0, Math.PI * 2); X.fill();
  if (f.sp >= 100) {
    X.globalAlpha = .14 + .08 * Math.sin(gt * 3); X.strokeStyle = f.col; X.lineWidth = 1;
    X.beginPath(); X.arc(f.cx, f.cy, 30, 0, Math.PI * 2); X.stroke();
  }
  X.restore();
}
function drawFX(f) {
  const fxt = Date.now() * .01;
  if (f._freeze > 0) {
    X.save(); X.globalAlpha = .35 + .1 * Math.sin(fxt * 3); X.strokeStyle = '#60b4f0'; X.lineWidth = 3;
    X.beginPath(); X.arc(f.cx, f.cy, 50, 0, Math.PI * 2); X.stroke();
    X.globalAlpha = .1; X.fillStyle = '#c8eafc';
    X.beginPath(); X.arc(f.cx, f.cy, 50, 0, Math.PI * 2); X.fill();
    X.restore();
  }
  if (f._burn > 0) {
    X.save(); X.globalAlpha = .28 + .12 * Math.sin(fxt * 4); X.strokeStyle = '#f97316'; X.lineWidth = 2.5;
    X.beginPath(); X.arc(f.cx, f.cy, 48, 0, Math.PI * 2); X.stroke();
    X.restore();
  }
  if (f._poison > 0) {
    X.save(); X.globalAlpha = .25 + .08 * Math.sin(fxt * 2.5); X.strokeStyle = '#4ade80'; X.lineWidth = 2;
    X.beginPath(); X.arc(f.cx, f.cy, 46, 0, Math.PI * 2); X.stroke();
    X.restore();
  }
}
function lc(h, a = 50) {
  const n = parseInt(h.replace('#', ''), 16);
  return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 255) + a)},${Math.min(255, (n & 255) + a)})`;
}

function drawFighter(f) {
  X.save();
  if (f._freeze > 0) X.globalAlpha = .65;
  else if (f.st === 'hurt') X.globalAlpha = .55 + .45 * Math.sin(f.fr * 6);
  else if (f.st === 'dodge') X.globalAlpha = .38;
  else if (f.inv > 0 && f.st !== 'hurt') X.globalAlpha = .68;

  const col = f.col, fac = f.fac, fr = f.fr;
  const bs = f.charDef.bodyStyle;

  // Flip rotation
  if (f.doFlip) {
    X.translate(f.cx, f.cy);
    X.rotate(f.flipA);
    X.translate(-f.cx, -f.cy);
  }

  X.translate(f.cx, f.y);
  X.lineCap = 'round'; X.lineJoin = 'round';

  // Head size varies by bodyStyle
  const headR = bs === 'heavy' ? 13 : bs === 'slim' ? 10 : 11;
  const lineW = bs === 'heavy' ? 4.5 : bs === 'slim' ? 2.8 : 3.4;

  // ── DIVINE (GOD) extra glow ──
  if (bs === 'divine') {
    X.save();
    X.globalAlpha = .2 + .1 * Math.sin(Date.now() * .005);
    X.strokeStyle = '#ffd700'; X.lineWidth = 3;
    for (let halo = 0; halo < 3; halo++) {
      X.beginPath(); X.arc(0, 12, headR + halo * 8, 0, Math.PI * 2); X.stroke();
    }
    X.restore();
  }

  // Head
  X.lineWidth = lineW; X.strokeStyle = col;
  X.beginPath(); X.arc(0, 12, headR, 0, Math.PI * 2);
  X.fillStyle = col; X.fill();
  X.strokeStyle = lc(col, 60); X.lineWidth = 1.4; X.stroke();

  // Eyes
  const eyeX = fac * (headR * 0.4);
  const eyeR = bs === 'slim' ? 1.8 : 2.2;
  // Special eye color per character
  const eyeWhite = bs === 'divine' ? '#fffde7' : 'rgba(255,255,255,.88)';
  X.fillStyle = eyeWhite; X.beginPath(); X.arc(eyeX, 11.5, eyeR, 0, Math.PI * 2); X.fill();
  X.fillStyle = bs === 'divine' ? '#ffd700' : '#08080f';
  X.beginPath(); X.arc(eyeX + fac * .8, 11.5, eyeR * 0.5, 0, Math.PI * 2); X.fill();

  // Character icon on head
  X.save(); X.globalAlpha = 1; X.font = `${bs === 'heavy' ? 15 : 12}px serif`;
  X.textAlign = 'center'; X.fillText(CHARS[f.ci].icon, 0, -5);
  X.restore();

  // Taunt expression
  if (f.st === 'taunt') {
    X.save(); X.strokeStyle = '#fff'; X.lineWidth = 1.5;
    X.beginPath(); X.arc(0, 14, 5, .2, Math.PI - .2); X.stroke();
    X.globalAlpha = .7; X.font = 'bold 10px "Bebas Neue"';
    X.textAlign = 'center'; X.fillStyle = '#ffd60a'; X.fillText('COME ON!', 0, -22);
    X.restore();
  }

  // Body
  const bob = f.st === 'walk' ? Math.sin(fr * 2.8) * 2.2 : 0;
  const tT = 24, tB = tT + (bs === 'heavy' ? 34 : bs === 'slim' ? 26 : 29) + bob * .4;
  const ll = f.H - tB;

  // CYBORG body segments
  if (bs === 'heavy' && f.charDef.name === 'CYBORG') {
    X.strokeStyle = '#06b6d4'; X.lineWidth = 5;
    X.beginPath(); X.moveTo(-4, tT); X.lineTo(-4, tB); X.stroke();
    X.beginPath(); X.moveTo(4, tT); X.lineTo(4, tB); X.stroke();
    // chest plate
    X.fillStyle = 'rgba(6,182,212,.25)';
    X.fillRect(-10, tT + 2, 20, 16);
  } else {
    X.strokeStyle = col; X.lineWidth = lineW;
    X.beginPath(); X.moveTo(0, tT); X.lineTo(0, tB); X.stroke();
  }

  // NINJA cape
  if (f.charDef.name === 'NINJA') {
    X.save(); X.globalAlpha = .5;
    X.fillStyle = f.col;
    X.beginPath(); X.moveTo(0, tT); X.lineTo(-fac * 20, tT + 20); X.lineTo(-fac * 15, tT + 35); X.lineTo(0, tB); X.fill();
    X.restore();
  }
  // DRAGON wings
  if (f.charDef.name === 'DRAGON') {
    X.save(); X.globalAlpha = .4;
    X.strokeStyle = f.col; X.lineWidth = 2.5;
    X.beginPath(); X.moveTo(0, tT + 5); X.lineTo(-28, tT - 20); X.lineTo(-18, tT + 10); X.stroke();
    X.beginPath(); X.moveTo(0, tT + 5); X.lineTo(28, tT - 20); X.lineTo(18, tT + 10); X.stroke();
    X.restore();
  }
  // LEGEND sparkles
  if (f.charDef.name === 'LEGEND') {
    X.save(); X.globalAlpha = .6;
    for (let sp = 0; sp < 4; sp++) {
      const sa = (fr * .15) + sp * 1.57;
      const sr = 26;
      X.fillStyle = '#ffd60a'; X.font = '8px serif';
      X.fillText('✦', Math.cos(sa) * sr - 3, Math.sin(sa) * sr + 3);
    }
    X.restore();
  }

  // Legs
  let llx, lly, rlx, rly;
  if (f.st === 'walk') { const sw = Math.sin(fr * 2.8) * 22; llx = fac * sw; lly = ll + bob; rlx = -fac * sw; rly = ll + bob; }
  else if (f.st === 'jump' || f.doFlip) { llx = -18; lly = ll - 28; rlx = 18; rly = ll - 28; }
  else if (f.st === 'kick') { llx = -10; lly = ll; rlx = fac * 38; rly = ll - 19; }
  else if (f.st === 'hurt') { llx = -16; lly = ll; rlx = 16; rly = ll - 8; }
  else if (f.st === 'taunt') { const tw = Math.sin(fr * 4) * 8; llx = -14 + tw; lly = ll; rlx = 14 - tw; rly = ll; }
  else { llx = -12; lly = ll; rlx = 12; rly = ll; }

  X.strokeStyle = col; X.lineWidth = lineW;
  X.beginPath(); X.moveTo(0, tB); X.lineTo(llx * .52, tB + lly * .52); X.lineTo(llx * .97, tB + lly); X.stroke();
  X.beginPath(); X.moveTo(0, tB); X.lineTo(rlx * .52, tB + rly * .52); X.lineTo(rlx * .97, tB + rly); X.stroke();

  // Arms
  const shy = tT + 5;
  let lax, lay, rax, ray;
  if (f.st === 'punch') { X.strokeStyle = '#ff7f50'; X.lineWidth = lineW + 1.1; lax = fac * 46; lay = -5; rax = -fac * 10; ray = 12; }
  else if (f.st === 'kick') { lax = -fac * 13; lay = 8; rax = fac * 13; ray = 8; }
  else if (f.st === 'special') { X.strokeStyle = f.spCol; X.lineWidth = lineW + 2.1; lax = fac * 28; lay = -25; rax = fac * 28; ray = -25; }
  else if (f.st === 'block') { X.strokeStyle = C.blk; X.lineWidth = lineW; lax = fac * 16; lay = -13; rax = fac * 16; ray = 10; }
  else if (f.st === 'hurt') { lax = -fac * 22; lay = -13; rax = fac * 10; ray = -19; }
  else if (f.st === 'taunt') { const ta = Math.sin(fr * 3) * 15; lax = fac * 22; lay = -18 + ta; rax = -fac * 14; ray = 8; }
  else if (f.doFlip) { lax = fac * 24; lay = -32; rax = -fac * 24; ray = -32; }
  else { const sw2 = Math.sin(fr * 2.8 + Math.PI) * 6; lax = fac * 14 + sw2; lay = 14; rax = -fac * 14 - sw2; ray = 14; }
  if (!['punch','special','block'].includes(f.st)) { X.strokeStyle = col; X.lineWidth = lineW; }
  X.beginPath(); X.moveTo(0, shy); X.lineTo(lax * .52, shy + lay * .52); X.lineTo(lax, shy + lay); X.stroke();
  X.beginPath(); X.moveTo(0, shy); X.lineTo(rax * .52, shy + ray * .52); X.lineTo(rax, shy + ray); X.stroke();

  // SAMURAI sword
  if (f.charDef.name === 'SAMURAI' && ['idle','walk','punch','special'].includes(f.st)) {
    X.save(); X.strokeStyle = '#c0c0c0'; X.lineWidth = 2.5;
    X.beginPath(); X.moveTo(fac * 15, shy + 5); X.lineTo(fac * 55, shy - 30); X.stroke();
    X.strokeStyle = '#8b4513'; X.lineWidth = 5;
    X.beginPath(); X.moveTo(fac * 13, shy + 7); X.lineTo(fac * 22, shy); X.stroke();
    X.restore();
  }
  // VIPER tail
  if (f.charDef.name === 'VIPER') {
    X.save(); X.strokeStyle = f.col; X.lineWidth = 2;
    X.beginPath(); X.moveTo(0, tB); X.bezierCurveTo(-fac * 20, tB + 10, -fac * 10, tB + 25, -fac * 25, tB + 30); X.stroke();
    X.restore();
  }
  // VAMPIRE cloak
  if (f.charDef.name === 'VAMPIRE') {
    X.save(); X.globalAlpha = .5;
    X.fillStyle = '#4a0010';
    X.beginPath(); X.moveTo(-14, tT + 2); X.lineTo(-22, tB + 15); X.lineTo(22, tB + 15); X.lineTo(14, tT + 2); X.fill();
    X.restore();
  }

  // KO stars
  if (f.hp <= 0) {
    for (let ks = 0; ks < 3; ks++) {
      const sa2 = f.fr * .3 + ks * 2.1;
      X.save(); X.font = '14px serif'; X.globalAlpha = .85;
      X.fillText('⭐', f.cx - 14 + Math.cos(sa2) * 22, f.y - 10 + Math.sin(sa2 * .7) * 8);
      X.restore();
    }
  }
  X.restore();
}

function drawParts(dt) {
  parts = parts.filter(p => p.life > 0);
  parts.forEach(p => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 545 * dt; p.life -= dt;
    const a = Math.max(0, p.life / p.ml), r = Math.max(0, p.r * a);
    X.globalAlpha = a; X.fillStyle = p.col;
    X.beginPath(); X.arc(p.x, p.y, r, 0, Math.PI * 2); X.fill();
  });
  X.globalAlpha = 1;
}
function drawPops(dt) {
  pops = pops.filter(p => p.life > 0);
  pops.forEach(p => {
    p.y += p.vy * dt; p.vy *= .88; p.life -= dt;
    X.globalAlpha = Math.max(0, p.life / p.ml);
    X.fillStyle = p.col;
    X.font = `bold ${p.size}px "Bebas Neue",sans-serif`;
    X.textAlign = 'center';
    X.strokeStyle = 'rgba(0,0,0,.8)'; X.lineWidth = 3.5;
    X.strokeText(p.text, p.x, p.y); X.fillText(p.text, p.x, p.y);
  });
  X.globalAlpha = 1; X.textAlign = 'left';
}
function drawHUD2() {
  const lv = S.playerLevel;
  X.save();
  X.fillStyle = 'rgba(8,12,24,.78)'; X.fillRect(W / 2 - 82, 4, 164, 20);
  X.strokeStyle = 'rgba(46,196,182,.22)'; X.lineWidth = 1; X.strokeRect(W / 2 - 82, 4, 164, 20);
  const pct = lv >= 100 ? 1 : S.xp / xpN(lv);
  X.fillStyle = 'rgba(46,196,182,.22)'; X.fillRect(W / 2 - 80, 6, Math.floor(160 * pct), 16);
  X.fillStyle = '#edf2f4'; X.font = 'bold 10px "Rajdhani",sans-serif'; X.textAlign = 'center';
  X.fillText(`PLAYER LV ${lv}${lv >= 100 ? ' MAX' : ''} · ${lv >= 100 ? 'MAX' : S.xp + '/' + xpN(lv) + ' XP'}`, W / 2, 19);
  const { l, c } = getDiff(curLv);
  X.fillStyle = c; X.font = 'bold 10px "Orbitron",sans-serif'; X.textAlign = 'right';
  X.fillText(`LV ${curLv} · ${l}`, W - 7, 18);
  if (S.winStreak >= 3) { X.fillStyle = '#ffd60a'; X.textAlign = 'left'; X.font = 'bold 10px "Orbitron",sans-serif'; X.fillText(`🔥 ${S.winStreak}`, 8, 18); }
  // BG name
  const bg = BG_THEMES[S.equippedBG];
  if (bg) { X.fillStyle = 'rgba(255,255,255,.3)'; X.textAlign = 'left'; X.font = '9px "Rajdhani"'; X.fillText(bg.icon + ' ' + bg.name, 8, H - 4); }
  X.restore(); X.textAlign = 'left';
}

// ══════════════════════════════════════════════
// MAIN LOOP
// Author: SHAIKH YASIR | github.com/YasirShaikh03
// ══════════════════════════════════════════════
let last = 0;
function loop(ts) {
  const dt = Math.min((ts - last) / 1000, .05);
  last = ts;
  X.clearRect(0, 0, W, H);
  drawBG(dt);
  applyShake();
  if (shakeT > 0) shakeT -= dt;
  else { shakeAmt = 0; const aw = document.getElementById('arena'); if (aw) aw.style.transform = ''; }
  if (P && E) {
    if (gState === 'fight') {
      doInput(); tickAI(dt);
      P.update(dt, E); E.update(dt, P);
      P.tryHit(E); E.tryHit(P);
      tickCombo(dt);
      if (P.vx !== 0 && P.onG && P.st === 'idle') P.setSt('walk');
      if (P.vx === 0 && P.st === 'walk') P.setSt('idle');
      if (E.vx !== 0 && E.onG && E.st === 'idle') E.setSt('walk');
      if (E.vx === 0 && E.st === 'walk') E.setSt('idle');
      if (P.hp <= 0 && gState === 'fight') endRound('e');
      else if (E.hp <= 0 && gState === 'fight') endRound('p');
      document.getElementById('psp').style.width = P.sp + '%';
      document.getElementById('esp').style.width = E.sp + '%';
      spBU();
    } else {
      P.aT += dt; if (P.aT > .1) { P.aT = 0; P.fr++; }
      E.aT += dt; if (E.aT > .1) { E.aT = 0; E.fr++; }
    }
    drawShadow(P); drawShadow(E);
    drawGlow(P); drawGlow(E);
    drawFX(P); drawFX(E);
    drawFighter(P); drawFighter(E);
    drawParts(dt); drawPops(dt);
  }
  drawHUD2();
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
updateUI();
requestAnimationFrame(ts => { last = ts; requestAnimationFrame(loop); });

/*
 * Shadow Strike — Game Engine
 * © SHAIKH YASIR — https://github.com/YasirShaikh03
 * All rights reserved.
 */