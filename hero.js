'use strict';
// Minecraft 風格英雄養成：答題、照顧讓英雄長大，並在商店買造型、頭盔、盔甲、武器工具、坐騎、寵物、世界
// 所有圖案都是這個檔案用像素方塊自己畫的 SVG（沒有用遊戲的原始素材）
// 這個檔案要在 app.js 之前載入（app.js 的 freshState 會用到 newPet）；其餘函式執行時才用到 app.js 的 S、save、toast 等
// 函式名稱沿用 pet.js（newPet、petPage、petLearn…），app.js 不用改

// ───────── 成長階段 ─────────
const PET_STAGES = [
  // 依 Minecraft 的開荒順序：木頭 → 石頭 → 鐵與金 → 鑽石 → 下界獄髓 → 終界
  { at: 0, name: '木頭新手', emoji: '🪵', size: 0.50, desc: '徒手砍樹，做出木頭工具' },
  { at: 260, name: '石器礦工', emoji: '🪨', size: 0.56, desc: '背起背包挖石頭' },
  { at: 700, name: '鐵器勇者', emoji: '⛏️', size: 0.62, desc: '拿著火把挖到鐵和金' },
  { at: 1300, name: '鑽石大師', emoji: '💎', size: 0.68, desc: '挖到鑽石，披上披風' },
  { at: 2100, name: '下界勇士', emoji: '🔥', size: 0.74, desc: '穿越地獄門，取得獄髓' },
  { at: 3000, name: '終界屠龍者', emoji: '🐉', size: 0.80, desc: '展開鞘翅，打敗終界龍！' },
];
const PET_GOAL = { date: '2027-01-10', label: '總複習結束' }; // 養成目標日（顯示用）
const PET_WEEK_CAP = 330;                 // 每週最多成長多少（避免一下子就養成）
const PET_LEARN = { per: 3, floor: 60, grow: 1 }; // 每答對 1 題：三項狀態各 +3（最多補到 60），成長 +1

// ───────── 照顧（每項 15～50 金幣）─────────
// food 飽食度、happy 心情、clean 體力、grow 成長值
const PET_CARE = [
  { id: 'bread', icon: '🍞', name: '吃麵包', cost: 20, food: 30, grow: 10 },
  { id: 'steak', icon: '🥩', name: '烤牛排', cost: 40, food: 60, happy: 10, grow: 25 },
  { id: 'cake', icon: '🎂', name: '分蛋糕', cost: 30, food: 15, happy: 25, grow: 12 },
  { id: 'mine', icon: '⛏️', name: '一起挖礦', cost: 35, happy: 30, grow: 15 },
  { id: 'build', icon: '🧱', name: '一起蓋房子', cost: 35, happy: 40, grow: 18 },
  { id: 'sleep', icon: '🛏️', name: '上床睡覺', cost: 20, clean: 50, happy: 5, grow: 5 },
  { id: 'enchant', icon: '📚', name: '附魔台讀書', cost: 50, happy: 10, grow: 35 },
];
const PET_STATS = [['food', '🍗', '飽食度', '#f5a524'], ['happy', '❤️', '心情', '#e5484d'], ['clean', '⚡', '體力', '#3fa7e0']];
const PET_PATS_PER_DAY = 3;
const PET_DECAY = { food: 25, happy: 20, clean: 20 };
const RENAME_COST = 10;

// ───────── 像素小工具 ─────────
// rows：每列一個字串，'.' 是透明；pal：字元 → 顏色；同顏色連續的格子合併成一個長方形
function pxArt(rows, pal, x0, y0, s) {
  let out = '';
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length;) {
      const ch = row[c];
      if (ch === '.' || !pal[ch]) { c++; continue; }
      let e = c;
      while (e < row.length && row[e] === ch) e++;
      out += `<rect x="${(x0 + c * s).toFixed(2)}" y="${(y0 + r * s).toFixed(2)}" width="${((e - c) * s + 0.06).toFixed(2)}" height="${(s + 0.06).toFixed(2)}" fill="${pal[ch]}"/>`;
      c = e;
    }
  });
  return out;
}
const pxW = rows => Math.max(...rows.map(r => r.length));
// 把一組像素圖縮放到 100×100 的 viewBox 裡（置中、貼底）
function pxSvg(rows, pal, cls = '', pad = 4) {
  const w = pxW(rows), h = rows.length, s = (100 - pad * 2) / Math.max(w, h);
  return `<svg viewBox="0 0 100 100" class="${cls}" shape-rendering="crispEdges">${pxArt(rows, pal, (100 - w * s) / 2, 100 - pad - h * s, s)}</svg>`;
}

// ───────── 造型（臉＋衣服顏色）─────────
// 臉 8×8：h 頭髮、S 皮膚、W 眼白、E 眼珠、N 鼻子、M 嘴、B 鬍子／眉毛、K 黑、V 紫、G/g 綠、d 深色
const FACE = {
  steve: ['hhhhhhhh', 'hhhhhhhh', 'hSSSSSSh', 'SSSSSSSS', 'SWESSEWS', 'SSSNNSSS', 'SSBMMBSS', 'SSBBBBSS'],
  alex: ['hhhhhhhh', 'hhhhhhhh', 'hhSSSSSh', 'hSSSSSSS', 'hWESSEWS', 'hSSSSSSS', 'hSSMMSSS', 'hSSSSSSS'],
  zombie: ['dddddddd', 'dddddddd', 'dSSSSSSd', 'SSSSSSSS', 'SKKSSKKS', 'SSSNNSSS', 'SSSSSSSS', 'SSMMMMSS'],
  villager: ['hhhhhhhh', 'hSSSSSSh', 'SBBBBBBS', 'SWESSEWS', 'SSSNNSSS', 'SSSNNSSS', 'SSSNNSSS', 'SSSSSSSS'],
  creeper: ['GGGGGGGG', 'GgGGGGgG', 'GKKGGKKG', 'GKKGGKKG', 'GGGKKGGG', 'GGKKKKGG', 'GGKKKKGG', 'GGKGGKGG'],
  ender: ['KKKKKKKK', 'KKKKKKKK', 'KKKKKKKK', 'KKKKKKKK', 'KVVKKVVK', 'KKKKKKKK', 'KKKKKKKK', 'KKKKKKKK'],
};
const SKIN_STYLE = {
  's-steve': { face: 'steve', h: '#3b2a1a', S: '#c69c76', W: '#fff', E: '#4a3fbf', N: '#9c6f4f', M: '#6a3f2a', B: '#5a3a22', T: '#2fa3a8', P: '#3b3f9e', F: '#5b5b5b' },
  's-alex': { face: 'alex', h: '#d9661f', S: '#f0c8a0', W: '#fff', E: '#2e8b57', M: '#c87a5a', T: '#6aa84f', P: '#6b4a2b', F: '#4a3a2a' },
  's-zombie': { face: 'zombie', d: '#2f5a24', S: '#4f8c3a', N: '#3c6e2c', K: '#111', M: '#2a4a1f', T: '#2fa3a8', P: '#3b3f9e', F: '#3a3a3a' },
  's-villager': { face: 'villager', h: '#5a3a22', S: '#c79f7a', W: '#fff', E: '#2e8b57', N: '#a77d58', B: '#4a3020', T: '#7a5230', P: '#7a5230', F: '#4a3020' },
  's-creeper': { face: 'creeper', G: '#5bbf4a', g: '#8ad97a', K: '#1a1a1a', S: '#5bbf4a', T: '#4fa83f', P: '#3f8f33', F: '#2f6b26' },
  's-ender': { face: 'ender', K: '#151515', V: '#d16bff', S: '#151515', T: '#1e1e1e', P: '#151515', F: '#0d0d0d' },
  's-rainbow': { face: 'steve', h: '#3b2a1a', S: '#c69c76', W: '#fff', E: '#4a3fbf', N: '#9c6f4f', M: '#6a3f2a', B: '#5a3a22', T: '#2fa3a8', P: '#3b3f9e', F: '#5b5b5b' },
  's-gold': { face: 'steve', h: '#b8860b', S: '#ffd54a', W: '#fff8d0', E: '#b8860b', N: '#e0a800', M: '#a37400', B: '#c99a1a', T: '#f5c542', P: '#d9a520', F: '#a37400' },
};
// 盔甲材質：A 主色、a 暗邊
const MAT = {
  leather: { A: '#a0623a', a: '#7a4626' }, chain: { A: '#9aa0a6', a: '#5f656b' }, iron: { A: '#e6e6e6', a: '#a9a9a9' },
  gold: { A: '#ffd84a', a: '#d9a520' }, diamond: { A: '#5be3e0', a: '#2aa8b0' }, netherite: { A: '#5b5155', a: '#3a3337' },
  turtle: { A: '#4caf50', a: '#2e7d32' },
};

// ───────── 商店 ─────────
const PET_SHOP = {
  color: { name: '造型', icon: '🎨', items: [
    { id: 's-steve', name: '經典勇者', cost: 0 },
    { id: 's-alex', name: '紅髮冒險家', cost: 20 },
    { id: 's-zombie', name: '殭屍', cost: 40 },
    { id: 's-villager', name: '村民', cost: 60 },
    { id: 's-creeper', name: '苦力怕', cost: 100 },
    { id: 's-ender', name: '終界使者', cost: 200 },
    { id: 's-rainbow', name: '彩虹變色', cost: 500, cls: 'pet-rainbow' },
    { id: 's-gold', name: '閃亮黃金', cost: 1000 },
  ] },
  hat: { name: '頭盔', icon: '⛑️', items: [
    { id: 'h-leather', name: '皮革頭盔', cost: 10, mat: 'leather' },
    { id: 'h-chain', name: '鎖鏈頭盔', cost: 30, mat: 'chain' },
    { id: 'h-iron', name: '鐵頭盔', cost: 60, mat: 'iron' },
    { id: 'h-pumpkin', name: '南瓜頭', cost: 80, pumpkin: 1 },
    { id: 'h-gold', name: '金頭盔', cost: 120, mat: 'gold' },
    { id: 'h-turtle', name: '海龜殼頭盔', cost: 200, mat: 'turtle' },
    { id: 'h-diamond', name: '鑽石頭盔', cost: 300, mat: 'diamond' },
    { id: 'h-netherite', name: '獄髓頭盔', cost: 600, mat: 'netherite' },
  ] },
  outfit: { name: '盔甲', icon: '🛡️', items: [
    { id: 'o-leather', name: '皮革盔甲', cost: 20, mat: 'leather' },
    { id: 'o-chain', name: '鎖鏈盔甲', cost: 50, mat: 'chain' },
    { id: 'o-iron', name: '鐵盔甲', cost: 100, mat: 'iron' },
    { id: 'o-gold', name: '金盔甲', cost: 180, mat: 'gold' },
    { id: 'o-diamond', name: '鑽石盔甲', cost: 400, mat: 'diamond' },
    { id: 'o-elytra', name: '鞘翅', cost: 500, elytra: 1 },
    { id: 'o-netherite', name: '獄髓盔甲', cost: 800, mat: 'netherite' },
  ] },
  gear: { name: '武器工具', icon: '⚔️', items: [
    { id: 'g-wsword', name: '木劍', cost: 10, kind: 'sword', tier: 'wood' },
    { id: 'g-wpick', name: '木鎬', cost: 15, kind: 'pick', tier: 'wood' },
    { id: 'g-spick', name: '石鎬', cost: 40, kind: 'pick', tier: 'stone' },
    { id: 'g-ipick', name: '鐵鎬', cost: 90, kind: 'pick', tier: 'iron' },
    { id: 'g-naxe', name: '獄髓斧', cost: 800, kind: 'axe', tier: 'netherite' },
    { id: 'g-waxe', name: '木斧', cost: 20, kind: 'axe', tier: 'wood' },
    { id: 'g-ssword', name: '石劍', cost: 30, kind: 'sword', tier: 'stone' },
    { id: 'g-shield', name: '盾牌', cost: 60, kind: 'shield' },
    { id: 'g-isword', name: '鐵劍', cost: 80, kind: 'sword', tier: 'iron' },
    { id: 'g-iaxe', name: '鐵斧', cost: 100, kind: 'axe', tier: 'iron' },
    { id: 'g-bow', name: '弓', cost: 120, kind: 'bow' },
    { id: 'g-gsword', name: '金劍', cost: 150, kind: 'sword', tier: 'gold' },
    { id: 'g-dpick', name: '鑽石鎬', cost: 250, kind: 'pick', tier: 'diamond' },
    { id: 'g-dsword', name: '鑽石劍', cost: 300, kind: 'sword', tier: 'diamond' },
    { id: 'g-daxe', name: '鑽石斧', cost: 350, kind: 'axe', tier: 'diamond' },
    { id: 'g-trident', name: '三叉戟', cost: 500, kind: 'trident' },
    { id: 'g-nsword', name: '獄髓劍', cost: 700, kind: 'sword', tier: 'netherite' },
    { id: 'g-esword', name: '附魔鑽石劍', cost: 1000, kind: 'sword', tier: 'diamond', glint: 1 },
  ] },
  mount: { name: '坐騎', icon: '🐎', items: [
    { id: 'm-pig', name: '騎豬', cost: 80 },
    { id: 'm-boat', name: '木船', cost: 150 },
    { id: 'm-horse', name: '馬', cost: 200 },
    { id: 'm-cart', name: '礦車列車', cost: 250 },
    { id: 'm-llama', name: '羊駝', cost: 300 },
    { id: 'm-camel', name: '駱駝', cost: 350 },
    { id: 'm-strider', name: '赤足獸', cost: 500 },
    { id: 'm-dragon', name: '終界龍', cost: 1000 },
  ] },
  buddy: { name: '寵物', icon: '🐔', items: [
    { id: 'p-chicken', name: '小雞', cost: 30 },
    { id: 'p-pig', name: '小豬', cost: 40 },
    { id: 'p-sheep', name: '綿羊', cost: 50 },
    { id: 'p-cat', name: '貓咪', cost: 80 },
    { id: 'p-wolf', name: '狼狗', cost: 100 },
    { id: 'p-fox', name: '狐狸', cost: 150 },
    { id: 'p-bee', name: '蜜蜂', cost: 150 },
    { id: 'p-parrot', name: '鸚鵡', cost: 200 },
    { id: 'p-slime', name: '史萊姆', cost: 200 },
    { id: 'p-axolotl', name: '六角恐龍', cost: 250 },
    { id: 'p-panda', name: '熊貓', cost: 300 },
    { id: 'p-creeper', name: '苦力怕', cost: 400 },
    { id: 'p-skeleton', name: '骷髏弓箭手', cost: 500 },
    { id: 'p-golem', name: '鐵傀儡', cost: 800 },
  ] },
  bg: { name: '世界', icon: '🌍', items: [
    { id: 'b-plains', name: '平原', cost: 0 },
    { id: 'b-forest', name: '森林', cost: 50 },
    { id: 'b-desert', name: '沙漠', cost: 80 },
    { id: 'b-snow', name: '雪原', cost: 100 },
    { id: 'b-ocean', name: '海洋', cost: 120 },
    { id: 'b-cherry', name: '櫻花林', cost: 150 },
    { id: 'b-cave', name: '礦坑', cost: 200 },
    { id: 'b-village', name: '村莊', cost: 250 },
    { id: 'b-mushroom', name: '蘑菇島', cost: 300 },
    { id: 'b-nether', name: '下界', cost: 500 },
    { id: 'b-end', name: '終界', cost: 800 },
    { id: 'b-gold', name: '黃金神殿', cost: 1000 },
  ] },
};
// 每樣東西要升到哪個階段才買得到（照 Minecraft 開荒順序：木 → 石 → 鐵、金 → 鑽石 → 下界獄髓 → 終界）
const ITEM_NEED = { 's-steve': 0, 's-alex': 0, 's-villager': 1, 's-zombie': 1, 's-creeper': 2, 's-rainbow': 3, 's-gold': 4, 's-ender': 5, 'h-leather': 0, 'h-pumpkin': 1, 'h-chain': 1, 'h-iron': 2, 'h-gold': 2, 'h-turtle': 3, 'h-diamond': 3, 'h-netherite': 4, 'o-leather': 0, 'o-chain': 1, 'o-iron': 2, 'o-gold': 2, 'o-diamond': 3, 'o-netherite': 4, 'o-elytra': 5, 'g-wsword': 0, 'g-wpick': 0, 'g-spick': 1, 'g-ipick': 2, 'g-naxe': 4, 'g-waxe': 0, 'g-ssword': 1, 'g-bow': 1, 'g-shield': 2, 'g-isword': 2, 'g-iaxe': 2, 'g-gsword': 2, 'g-dpick': 3, 'g-dsword': 3, 'g-daxe': 3, 'g-trident': 3, 'g-esword': 3, 'g-nsword': 4, 'm-boat': 0, 'm-pig': 1, 'm-horse': 1, 'm-cart': 2, 'm-llama': 2, 'm-camel': 2, 'm-strider': 4, 'm-dragon': 5, 'p-chicken': 0, 'p-pig': 0, 'p-sheep': 0, 'p-cat': 1, 'p-wolf': 1, 'p-fox': 2, 'p-bee': 2, 'p-parrot': 2, 'p-axolotl': 2, 'p-golem': 3, 'p-slime': 3, 'p-panda': 3, 'p-creeper': 3, 'p-skeleton': 4, 'b-plains': 0, 'b-forest': 0, 'b-desert': 1, 'b-snow': 1, 'b-ocean': 1, 'b-cave': 2, 'b-cherry': 2, 'b-village': 2, 'b-mushroom': 3, 'b-nether': 4, 'b-end': 5, 'b-gold': 5 };
for (const c of Object.values(PET_SHOP)) { c.items.forEach(it => { it.need = ITEM_NEED[it.id] || 0; }); c.items.sort((x, y) => x.need - y.need || x.cost - y.cost); }
const PET_SLOTS = ['color', 'hat', 'outfit', 'gear', 'mount', 'buddy', 'bg'];
const PET_ITEM = Object.fromEntries(Object.values(PET_SHOP).flatMap(c => c.items).map(i => [i.id, i]));

function newPet() {
  return {
    name: '史帝夫', grow: 0, food: 70, happy: 70, clean: 70, last: Date.now(),
    owned: ['s-steve', 'b-plains'],
    equip: { color: 's-steve', hat: null, outfit: null, gear: null, mount: null, buddy: null, bg: 'b-plains' },
    pats: {}, renamed: 0,
  };
}

// ───────── 狀態 ─────────
const petStage = p => { let s = 0; PET_STAGES.forEach((st, i) => { if (p.grow >= st.at) s = i; }); return s; };
function petTick() {
  const p = S.pet;
  p.equip.buddy ??= null;
  const days = (Date.now() - (p.last || Date.now())) / 86400000;
  if (days > 0) {
    for (const k of Object.keys(PET_DECAY)) p[k] = Math.max(0, p[k] - PET_DECAY[k] * days);
    p.last = Date.now();
  }
}
function petMood(p) {
  const avg = (p.food + p.happy + p.clean) / 3;
  if (p.food < 20) return { face: '😵', text: '肚子好餓…飽食度快沒了' };
  if (p.clean < 20) return { face: '😴', text: '好累，想上床睡覺' };
  if (p.happy < 20) return { face: '😢', text: '好無聊，陪我去冒險～' };
  if (avg >= 75) return { face: '😆', text: '超開心！準備出發冒險！' };
  if (avg >= 45) return { face: '🙂', text: '狀態不錯' };
  return { face: '😐', text: '有點需要照顧' };
}
const petNeedsCare = () => { petTick(); const p = S.pet; return p.food < 30 || p.happy < 30 || p.clean < 30; };

// ───────── 武器、工具（16×16 像素）─────────
// O 外框、W 亮面、B 暗面、G 護手、H 握把、M 劍柄尾
const SPR = {
  sword: ['..............OO', '.............OWO', '............OWBO', '...........OWBO.', '..........OWBO..', '.........OWBO...',
    '....OO..OWBO....', '....OGOOWBO.....', '.....OGWBO......', '.....OGGO.......', '....OHOGGO......', '...OHO..OGO.....',
    '..OHO....OO.....', '.OHO............', 'OMO.............', 'OO..............'],
  axe: ['........OOOOO...', '.......OWWWBBO..', '.......OWWBBBBO.', '.......OWBBBBBO.', '........OOHBBBO.', '.........OHOOO..',
    '........OHO.....', '.......OHO......', '......OHO.......', '.....OHO........', '....OHO.........', '...OHO..........',
    '..OHO...........', '.OHO............', 'OHO.............', 'OO..............'],
  pick: ['...OOOOOOO......', '..OWWWWWWBO.....', '...OOOOOOHBO....', '.........OHBO...', '........OHOBBO..', '.......OHO.OBO..',
    '......OHO..OBO..', '.....OHO....OO..', '....OHO.........', '...OHO..........', '..OHO...........', '.OHO............',
    'OHO.............', 'OO..............'],
  shield: ['OOOOOOOOOO', 'OWWWWWWWWO', 'OWBBWWBBWO', 'OWBBWWBBWO', 'OWWWGGWWWO', 'OWWWGGWWWO', 'OWBBWWBBWO', 'OWBBWWBBWO', '.OWWWWWWO.', '..OWWWWO..', '...OOOO...'],
  trident: ['O.....O.....O...', 'W.....W.....W...', 'W.....W.....W...', 'WB....W....BW...', '.WBBBBWBBBBW....', '......W.........',
    '......H.........', '......H.........', '......H.........', '......H.........', '......H.........', '......H.........', '......H.........', '......H.........', '......M.........'],
  bow: ['.......OOO......', '......OHHHO.....', '.....OH...S.....', '....OH.....S....', '...OH......S....', '..OH.......S....',
    '.OH........S....', '.OH........S....', '..OH.......S....', '...OH......S....', '....OH.....S....', '.....OH...S.....', '......OHHHO.....', '.......OOO......'],
  torch: ['.YY.', 'YRRY', '.RY.', '.HH.', '.HH.', '.HH.', '.HH.', '.HH.', '.HH.'],
};
const TIER = {
  wood: { W: '#c69a5a', B: '#8b6236', G: '#6b4a26' }, stone: { W: '#b4b4b4', B: '#7a7a7a', G: '#5c5c5c' },
  iron: { W: '#f5f5f5', B: '#c4c4c4', G: '#8a8a8a' }, gold: { W: '#fff36b', B: '#e3b93a', G: '#b8860b' },
  diamond: { W: '#a6f7f2', B: '#33c9c9', G: '#1e8f91' }, netherite: { W: '#7a6f73', B: '#4a4245', G: '#2c2628' },
};
function itemPal(it) {
  const base = { O: '#2b1d0e', H: '#7a5230', M: '#4a3218', S: '#e9e9e9', Y: '#ffe066', R: '#ff8c1a' };
  if (it.kind === 'shield') return { ...base, W: '#a77b4a', B: '#7a5230', G: '#9aa0a6' };
  if (it.kind === 'trident') return { ...base, W: '#5fd3c4', B: '#3a9e92', H: '#4aa79a', M: '#2f7d73' };
  return { ...base, ...(TIER[it.tier] || TIER.wood) };
}
// 把手上拿的東西畫在 (hx, hy)：mirror＝往左外側拿
function itemArt(it, hx, hy, s, mirror) {
  const rows = SPR[it.kind] || SPR.sword;
  const pal = itemPal(it);
  const grip = { sword: [2, 13], axe: [2, 13], pick: [2, 12], shield: [5, 5], trident: [6, 12], bow: [5, 7], torch: [1, 6] }[it.kind] || [2, 13];
  const glint = it.glint ? `<rect x="0" y="0" width="${pxW(rows)}" height="${rows.length}" fill="#c77dff" opacity=".35"><animate attributeName="opacity" values=".1;.5;.1" dur="1.6s" repeatCount="indefinite"/></rect>` : '';
  return `<g transform="translate(${hx} ${hy}) scale(${mirror ? -s : s} ${s}) translate(${-grip[0] - 0.5} ${-grip[1] - 0.5})">${pxArt(rows, pal, 0, 0, 1)}${glint}</g>`;
}
function itemSvg(it) {
  const rows = SPR[it.kind] || SPR.sword;
  return pxSvg(rows, itemPal(it), 'pet-svg');
}

// ───────── 畫英雄（正面，16×32 格）─────────
function heroGrid(skin) {
  const st = SKIN_STYLE[skin] || SKIN_STYLE['s-steve'];
  const g = Array.from({ length: 32 }, () => Array(16).fill('.'));
  FACE[st.face].forEach((row, r) => [...row].forEach((ch, c) => { g[r][4 + c] = ch; }));
  for (let r = 8; r < 20; r++) {
    for (let c = 4; c < 12; c++) g[r][c] = 'T';
    for (const c of [0, 1, 2, 3, 12, 13, 14, 15]) g[r][c] = r < 12 ? 'T' : 'S';
  }
  for (let c = 4; c < 12; c++) g[8][c] = c >= 6 && c <= 9 ? 'S' : 'T'; // 領口
  for (let r = 20; r < 32; r++) for (let c = 4; c < 12; c++) g[r][c] = r >= 30 ? 'F' : 'P';
  return { g, st };
}
// 盔甲、頭盔：把格子改成 A／a
function wearArmor(g, mat, part) {
  const set = (r, c, ch) => { if (g[r] && g[r][c] !== undefined) g[r][c] = ch; };
  if (part === 'head') {
    for (let c = 3; c < 13; c++) { set(-1 + 1, c, 'A'); }
    for (let r = 0; r < 2; r++) for (let c = 4; c < 12; c++) set(r, c, 'A');
    for (let r = 2; r < 6; r++) { set(r, 4, 'a'); set(r, 11, 'a'); }
    for (let c = 4; c < 12; c++) set(2, c, c === 4 || c === 11 ? 'a' : g[2][c]);
  } else {
    for (let r = 8; r < 20; r++) for (let c = 4; c < 12; c++) set(r, c, r === 8 || r === 19 || c === 4 || c === 11 ? 'a' : 'A');
    for (let r = 8; r < 13; r++) for (const c of [0, 1, 2, 3, 12, 13, 14, 15]) set(r, c, r === 12 ? 'a' : 'A');
    for (let r = 20; r < 28; r++) for (let c = 4; c < 12; c++) set(r, c, c === 7 || c === 8 ? 'a' : 'A');
    for (let r = 29; r < 32; r++) for (let c = 4; c < 12; c++) set(r, c, r === 29 ? 'a' : 'A');
  }
}
let petUid = 0;
// 畫英雄：stage 階段、colorId 造型、outfitId 盔甲、gearId 手上拿的、hatId 頭盔（參數順序和 pet.js 一樣）
function petSvg(stage, colorId, outfitId, gearId, hatId) {
  const u = ++petUid;
  const { g, st } = heroGrid(colorId);
  const outfit = outfitId && PET_ITEM[outfitId], hat = hatId && PET_ITEM[hatId], gear = gearId && PET_ITEM[gearId];
  const pal = { ...st };
  if (outfit && outfit.mat) { wearArmor(g, outfit.mat, 'body'); }
  if (hat && hat.mat) { wearArmor(g, hat.mat, 'head'); }
  const armorPal = m => MAT[m] || {};
  // 盔甲和頭盔可能是不同材質：頭盔用 X/x
  if (hat && hat.mat && outfit && outfit.mat && hat.mat !== outfit.mat) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) { if (g[r][c] === 'A') g[r][c] = 'X'; if (g[r][c] === 'a') g[r][c] = 'x'; }
    pal.X = armorPal(hat.mat).A; pal.x = armorPal(hat.mat).a;
  }
  Object.assign(pal, armorPal((outfit && outfit.mat) || (hat && hat.mat)));
  if (hat && hat.mat && !(outfit && outfit.mat)) Object.assign(pal, armorPal(hat.mat));
  const s = 2.9, x0 = 50 - 8 * s, y0 = 96 - 32 * s;
  let back = '', front = '';
  // 階段配件
  const cape = stage === 3 || stage === 4, wings = stage >= 5 || (outfit && outfit.elytra);
  if (stage === 1 || stage === 2) back += pxArt(['BBBBBBBBBB', 'BbbbbbbbbB', 'BbbbbbbbbB', 'BBBBBBBBBB', 'BbbbbbbbbB', 'BbbbbbbbbB', 'BBBBBBBBBB'], { B: '#6b4a26', b: '#8b6236' }, x0 + 3 * s, y0 + 9 * s, s);
  if (cape) back += `<path d="M${x0 + 3 * s} ${y0 + 8 * s} L${x0 + 13 * s} ${y0 + 8 * s} L${x0 + 15 * s} ${y0 + 27 * s} L${x0 + 1 * s} ${y0 + 27 * s} Z" fill="#c1121f"/><path d="M${x0 + 1 * s} ${y0 + 27 * s} H${x0 + 15 * s}" stroke="#f2c14e" stroke-width="${s * 0.6}"/>`;
  if (wings) {
    const wing = ['....GG', '...GGg', '..GGgg', '.GGggg', 'GGgggg', 'GGgggg', '.Ggggg', '..ggg.', '...g..'];
    const wp = { G: '#8d8f9e', g: '#b9bccb' };
    back += pxArt(wing, wp, x0 - 3 * s, y0 + 7 * s, s * 1.2) + `<g transform="translate(${x0 + 19 * s} 0) scale(-1 1)">${pxArt(wing, wp, 0, y0 + 7 * s, s * 1.2)}</g>`;
  }
  if (stage === 5) back = `<circle cx="50" cy="${y0 + 14 * s}" r="40" fill="url(#ha${u})"/>` + back;
  const rows = g.map(r => r.join(''));
  let body = pxArt(rows, pal, x0, y0, s);
  // 南瓜頭
  if (hat && hat.pumpkin) body += pxArt(['OOOOOOOO', 'OoOOOOoO', 'OKKOOKKO', 'OKKOOKKO', 'OOOOOOOO', 'OKOKKOKO', 'OOKKKKOO', 'OOOOOOOO'], { O: '#e8871e', o: '#f4a53a', K: '#3a1f05' }, x0 + 4 * s, y0, s) +
    `<rect x="${x0 + 7 * s}" y="${y0 - 1.5 * s}" width="${2 * s}" height="${1.5 * s}" fill="#5a7a2a"/>`;
  // 王冠（終界屠龍者）
  if (stage === 5) front += pxArt(['Y.Y.Y.Y.Y.', 'YYYYYYYYYY', 'YRYYBYYRYY'], { Y: '#ffd43b', R: '#e63946', B: '#4dabf7' }, x0 + 3 * s, y0 - 3.4 * s, s);
  // 火把（鐵器勇者以後）
  if (stage >= 2) front += `<circle cx="${x0 + 14 * s}" cy="${y0 + 13 * s}" r="${s * 3}" fill="#ffd36b" opacity=".35"/>` + itemArt({ kind: 'torch' }, x0 + 14 * s, y0 + 19 * s, s * 0.9, false);
  // 粒子
  if (stage === 4) front += [[10, 90], [86, 84], [16, 70]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="3" fill="${i % 2 ? '#ff8c1a' : '#ffd43b'}"><animate attributeName="y" values="${y};${y - 10};${y}" dur="${1.4 + i * .3}s" repeatCount="indefinite"/></rect>`).join('');
  if (stage === 3) front += [[8, 40], [88, 30], [14, 74], [84, 66]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="3" fill="#7ff3ee"><animate attributeName="opacity" values="1;.2;1" dur="${1.2 + i * .3}s" repeatCount="indefinite"/></rect>`).join('');
  if (stage === 5) front += [[6, 30], [90, 22], [10, 64], [88, 58]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#9bf04a" stroke="#5fae1f" stroke-width=".6"><animate attributeName="cy" values="${y};${y - 6};${y}" dur="${1.6 + i * .2}s" repeatCount="indefinite"/></circle>`).join('');
  // 手上拿的
  if (gear) front += itemArt(gear, x0 + 2 * s, y0 + 19 * s, s * 0.95, true);
  const rainbow = colorId === 's-rainbow' ? ' class="pet-rainbow-g"' : '';
  return `<svg viewBox="0 0 100 100" class="pet-svg" style="overflow:visible" shape-rendering="crispEdges"><defs><radialGradient id="ha${u}"><stop offset="0" stop-color="#fff3a0" stop-opacity=".9"/><stop offset="1" stop-color="#ffd43b" stop-opacity="0"/></radialGradient></defs>` +
    back + `<g${rainbow}>${body}</g>` + front + '</svg>';
}

// ───────── 坐騎 ─────────
const MOUNTS = {
  'm-pig': { w: 0.62, rows: ['....SSSSSS..........', '.PPPPPPPPPPPPPPPP...', 'PPEPPPPPPPPPPPPPPP..', 'PNNPPPPPPPPPPPPPPPP.', 'PNNPPPPPPPPPPPPPPPP.', '.PPPPPPPPPPPPPPPPPP.', '..PPPPPPPPPPPPPPPP..', '..PP..PP....PP..PP..', '..pp..pp....pp..pp..'],
    pal: { P: '#f0a5a2', p: '#c97a76', N: '#e07a75', E: '#222', S: '#6b4226' } },
  'm-horse': { w: 0.72, rows: ['..MM..................', '.HHHM.................', 'HHEHHM................', 'HHHHHMM...............', '.NHHHHMHHHHHHHHHHH....', '..HHHHSSSSHHHHHHHHHT..', '...HHHHHHHHHHHHHHHHTT.', '....HHHHHHHHHHHHHHH.T.', '....HH.HH.....HH.HH...', '....HH.HH.....HH.HH...', '....hh.hh.....hh.hh...'],
    pal: { H: '#8b5a2b', M: '#3b2614', h: '#2b1a0e', N: '#6b4422', E: '#111', T: '#3b2614', S: '#5a3a22' } },
  'm-boat': { w: 0.86, rows: ['W......................W', 'WW....................WW', 'wWWWWWWWWWWWWWWWWWWWWWWw', '.wwwwwwwwwwwwwwwwwwwwww.', '..wwwwwwwwwwwwwwwwwwww..', 'BBBBBBBBBBBBBBBBBBBBBBBB', 'bBBbBBBbBBBbBBBbBBBbBBBb'],
    pal: { W: '#c69a5a', w: '#8b6236', B: '#3f76e4', b: '#2c56b0' } },
  'm-cart': { w: 0.78, rows: ['OOOOOOOOOOOOOOOOOOOO', 'OggggggggggggggggggO', 'OgDDDDDDDDDDDDDDDDgO', 'OgDDDDDDDDDDDDDDDDgO', 'OggggggggggggggggggO', '.OOOOOOOOOOOOOOOOOO.', '...KK..........KK...', '...KK..........KK...', 'RRRRRRRRRRRRRRRRRRRR', '.T..T..T..T..T..T..T'],
    pal: { O: '#3c4043', g: '#9ea4aa', D: '#5b6066', K: '#222', R: '#a8a8a8', T: '#6b4a26' } },
  'm-llama': { w: 0.6, rows: ['..LL............', '..LLL...........', '.LLELL..........', '.LLLLL..........', '..LLLL..........', '..LLLL..........', '..LLLLLLLLLLLLL.', '..RRRRRRRRRRRRL.', '..RYRYRYRYRYRYL.', '..LLLLLLLLLLLLL.', '...LL.LL..LL.LL.', '...LL.LL..LL.LL.', '...ll.ll..ll.ll.'],
    pal: { L: '#f1e6c8', l: '#b9a77e', E: '#222', R: '#d23b3b', Y: '#f2c14e' } },
  'm-camel': { w: 0.76, rows: ['..CC....................', '.CCCC...................', 'CCECC...................', '.CCCC.......CCC.........', '..CCC......CCCCC........', '..CCCCCCCCCCCCCCCC......', '..CCCCCCCCCCCCCCCCC.....', '...CCCCCCCCCCCCCCCC.....', '....CC..CC....CC..CC....', '....CC..CC....CC..CC....', '....CC..CC....CC..CC....', '....cc..cc....cc..cc....'],
    pal: { C: '#d9b36c', c: '#8a6b3a', E: '#222' } },
  'm-strider': { w: 0.5, rows: ['..H..H...H..H...', 'RRRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRRR', 'RREERRRRRRRREERR', 'RRRRRRRRRRRRRRRR', 'RRRMMMMMMMMMMRRR', 'RRRRRRRRRRRRRRRR', 'rrrrrrrrrrrrrrrr', '....LL....LL....', '....LL....LL....', '....LL....LL....', '....LL....LL....', '..OOllOOOOllOO..', 'OOOOOOOOOOOOOOOO'],
    pal: { R: '#b8423a', r: '#8c2f29', E: '#1a1a1a', M: '#5a1a16', H: '#e0d6c8', L: '#7a2a24', l: '#5a1a16', O: '#ff8c1a' } },
  'm-dragon': { w: 0.95, rows: ['.......................GGG......', '....................GGGGGGGG....', '.................GGGGGGGGGGGG...', 'KKKKK.........KKKKKKKKKKKKKKKK..', 'KPKKKKK.....KKKKKKKKKKKKKKKKKKKK', 'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', '.KKKKKKKKKKKKKKKKKKKKKKKKKKKK.KK', '....KK.....KK....KK.....KK....KK', '....KK.....KK....KK.....KK.....K'],
    pal: { K: '#1d1b26', P: '#d16bff', G: '#4a4560' } },
};
function mountSvg(id) { const m = MOUNTS[id]; return m ? pxSvg(m.rows, m.pal, 'pet-svg') : ''; }

// ───────── 寵物（跟在英雄旁邊）─────────
const BUDDIES = {
  'p-chicken': { rows: ['..WWWW....', '..WEWW....', 'YYWWWW....', '..RWWWWWWW', '...WWWWWWW', '...WWWWWW.', '....O..O..', '...OO.OO..'], pal: { W: '#f5f5f5', E: '#222', Y: '#f2b705', R: '#d62f2f', O: '#e8871e' } },
  'p-pig': { rows: ['.PPPPPPPPPPP', 'PEPPPPPPPPPP', 'NNPPPPPPPPPP', 'NNPPPPPPPPPP', '.PPPPPPPPPPP', '.PP.PP..PP.PP'], pal: { P: '#f0a5a2', N: '#e07a75', E: '#222' } },
  'p-sheep': { rows: ['.WWWWWWWWWW.', 'GGWWWWWWWWWW', 'GEWWWWWWWWWW', 'GGWWWWWWWWWW', '.WWWWWWWWWW.', '.GG.GG..GG.GG'], pal: { W: '#f2f2f2', G: '#c9b9a8', E: '#222' } },
  'p-cat': { rows: ['O.O.........', 'OOO.........', 'OEOO........', 'OOOOOOOOOO.T', '.ODODODOOO.T', '.OOOOOOOOOT.', '.OO.OO.OO.O.'], pal: { O: '#f0a040', D: '#c76f1e', E: '#2a8f3a', T: '#c76f1e' } },
  'p-wolf': { rows: ['G..G........', 'GGGG........', 'GEGGG.......', 'GGGGGGGGGGGT', '.RRGGGGGGGGT', '.GGGGGGGGGG.', '.GG.GG.GG.GG'], pal: { G: '#d8d8d8', E: '#222', R: '#d62f2f', T: '#b9b9b9' } },
  'p-fox': { rows: ['O..O........', 'OOOO........', 'OEOOO.......', 'WWOOOOOOOOOO', '.WOOOOOOOOWW', '.OOOOOOOOO..', '.KK.KK.KK.KK'], pal: { O: '#e8742a', W: '#f5efe6', E: '#222', K: '#3a2a1a' } },
  'p-bee': { rows: ['..cc.cc...', '.YYKKYYKK.', 'YEYKKYYKKY', 'YYYKKYYKKY', '.YYKKYYKK.'], pal: { Y: '#f6c90e', K: '#2a2a2a', E: '#222', c: '#cfe9ff' } },
  'p-parrot': { rows: ['.RR.', 'RERR', 'YRRR', '.RRB', '.RRB', '.BBB', '..BB', '.O.O'], pal: { R: '#e23b3b', E: '#222', Y: '#f2b705', B: '#2f6fd6', O: '#555' } },
  'p-slime': { rows: ['GGGGGGGG', 'GggggggG', 'GgKggKgG', 'GggggggG', 'GggKKggG', 'GGGGGGGG'], pal: { G: '#62c54a', g: '#8ee07a', K: '#2a5a20' } },
  'p-axolotl': { rows: ['R.R.......', 'PPPPPPPPP.', 'PEPPPPPPPP', 'PPPPPPPPPP', '.PP.PP.PP.'], pal: { P: '#f5a3c7', R: '#d9467c', E: '#222' } },
  'p-panda': { rows: ['K.....K...', 'WWWWWWW...', 'WKWWKWW...', 'WWWKWWWWWW', 'KKKKKKKWWW', 'KKKKKKKKKK', '.KK.KK.KK.'], pal: { W: '#f2f2f2', K: '#222' } },
  'p-creeper': { rows: ['GGGGGG', 'GKGGKG', 'GGKKGG', 'GKKKKG', 'GKGGKG', 'GGGGGG', '.gggg.', '.gggg.', '.gggg.', '.gggg.', 'GG..GG', 'GG..GG'], pal: { G: '#5bbf4a', g: '#4fa83f', K: '#1a1a1a' } },
  'p-skeleton': { rows: ['..WWWW..', '..KWWK..', '..WKKW..', '..WWWW..', '...WW...', 'W.WWWW.W', 'W..WW..W', 'W.WWWW.W', 'W..WW..W', '...WW...', '..W..W..', '..W..W..', '..W..W..'], pal: { W: '#e9e9e9', K: '#333' }, bow: true },
  'p-golem': { rows: ['..IIII..', '..IKKI..', '..IIII..', '...NN...', 'IIIIIIII', 'IIIVIIII', 'II.IIIII', 'II.II.II', 'II.II.II', '..II.II.', '..II.II.', '..II.II.'], pal: { I: '#d8d2c8', K: '#7a3a1a', N: '#a89c8c', V: '#5a8f3a' } },
};
function buddySvg(id) {
  const b = BUDDIES[id];
  if (!b) return '';
  let s = pxSvg(b.rows, b.pal, 'pet-svg', 6);
  if (b.bow) s = s.replace('</svg>', `<g transform="translate(70 30)">${pxArt(SPR.bow, itemPal({ kind: 'bow' }), 0, 0, 1.5)}</g></svg>`);
  return s;
}

// ───────── 世界（背景）─────────
// 背景用 CSS 漸層畫天空，地面、樹、建築用像素方塊畫在 SVG（座標 0～100）
function blockRow(y, n, top, side, h = 10, speck) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = i * 10;
    s += `<rect x="${x}" y="${y}" width="10.05" height="${h}" fill="${side}"/>`;
    if (top) s += `<rect x="${x}" y="${y}" width="10.05" height="3" fill="${top}"/><rect x="${x + (i % 3) * 3}" y="${y + 3}" width="2" height="2" fill="${top}"/>`;
    if (speck) s += `<rect x="${x + 2 + (i * 7) % 5}" y="${y + 5}" width="2" height="2" fill="${speck}"/><rect x="${x + 6 - (i * 3) % 4}" y="${y + 7.5}" width="2" height="2" fill="${speck}"/>`;
  }
  return s;
}
const ground = (top, side, speck, under = side) => blockRow(72, 10, top, side, 10, speck) + `<rect x="0" y="82" width="100" height="18" fill="${under}"/>` + blockRow(82, 10, null, under, 10, speck);
const oak = (x, y, leaf = '#3f9a2f', dark = '#2f7a22', trunk = '#6b4a26') =>
  `<rect x="${x + 7}" y="${y + 14}" width="6" height="${72 - y - 14}" fill="${trunk}"/><rect x="${x}" y="${y}" width="20" height="16" fill="${leaf}"/><rect x="${x + 3}" y="${y - 5}" width="14" height="6" fill="${leaf}"/>` +
  `<rect x="${x + 2}" y="${y + 3}" width="4" height="3" fill="${dark}"/><rect x="${x + 12}" y="${y + 8}" width="4" height="3" fill="${dark}"/><rect x="${x + 8}" y="${y - 3}" width="3" height="3" fill="${dark}"/>`;
const cloud = (x, y) => `<rect x="${x}" y="${y}" width="18" height="5" fill="#fff" opacity=".9"/><rect x="${x + 4}" y="${y - 3}" width="10" height="3" fill="#fff" opacity=".9"/>`;
const WORLDS = {
  'b-plains': { bg: 'linear-gradient(#7fb8ff, #cfe6ff 70%)', art: () => `<rect x="76" y="6" width="12" height="12" fill="#ffe066"/>` + cloud(8, 14) + cloud(48, 8) + ground('#5fae3a', '#8b5a2b', '#6e4520') },
  'b-forest': { bg: 'linear-gradient(#8cc8ff, #dff0ff 70%)', art: () => cloud(40, 8) + oak(2, 40) + oak(78, 34) + oak(62, 48, '#4caf3a', '#2f7a22') + ground('#4f9e32', '#8b5a2b', '#6e4520') },
  'b-desert': { bg: 'linear-gradient(#ffd08a, #fff1cf 70%)', art: () => `<rect x="70" y="8" width="14" height="14" fill="#fff3a0"/>` +
    `<rect x="12" y="44" width="6" height="28" fill="#4f9a3a"/><rect x="6" y="52" width="6" height="4" fill="#4f9a3a"/><rect x="6" y="46" width="3" height="8" fill="#4f9a3a"/><rect x="18" y="56" width="5" height="4" fill="#4f9a3a"/><rect x="20" y="50" width="3" height="8" fill="#4f9a3a"/>` +
    `<path d="M62 72 L80 50 L98 72 Z" fill="#e3c27a"/><path d="M80 50 L98 72 L84 72 Z" fill="#c9a659"/>` + ground('#efdc9a', '#e3c97a', '#d4b664') },
  'b-snow': { bg: 'linear-gradient(#bcd7f0, #eef6ff 70%)', art: () => `<rect x="6" y="38" width="16" height="6" fill="#2f5a3a"/><rect x="9" y="30" width="10" height="8" fill="#2f5a3a"/><rect x="2" y="44" width="24" height="8" fill="#2f5a3a"/><rect x="0" y="52" width="28" height="8" fill="#2f5a3a"/><rect x="11" y="60" width="6" height="12" fill="#4a3220"/>` +
    `<rect x="10" y="30" width="8" height="2" fill="#fff"/><rect x="3" y="44" width="10" height="2" fill="#fff"/>` +
    [[40, 14], [60, 26], [86, 10], [70, 44], [34, 40]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`).join('') + ground('#ffffff', '#8b5a2b', '#6e4520') },
  'b-ocean': { bg: 'linear-gradient(#7cc4ff, #d9f0ff 55%)', art: () => cloud(14, 10) + `<rect x="0" y="56" width="100" height="44" fill="#2f6fd6"/><rect x="0" y="56" width="100" height="3" fill="#5f9bf0"/>` +
    blockRow(66, 4, '#efdc9a', '#e3c97a', 6) + oak(4, 34, '#3f9a2f').replace(/height="\d+(\.\d+)?" fill="#6b4a26"/, 'height="18" fill="#6b4a26"') +
    `<rect x="70" y="80" width="8" height="5" fill="#ff8c1a"/><rect x="78" y="81" width="3" height="3" fill="#ff8c1a"/><rect x="71" y="81" width="1.5" height="1.5" fill="#222"/>` },
  'b-cherry': { bg: 'linear-gradient(#ffd6e8, #fff4f8 70%)', art: () => oak(4, 38, '#f7a8c8', '#e57aa8', '#5a3a2a') + oak(74, 32, '#f7a8c8', '#e57aa8', '#5a3a2a') +
    [[40, 20], [52, 34], [30, 46], [64, 12]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2.4" height="2.4" fill="#f7a8c8"/>`).join('') + ground('#6fbf4a', '#8b5a2b', '#6e4520') },
  'b-cave': { bg: 'linear-gradient(#2b2b30, #45454c)', art: () => {
    let s = '';
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if ((r * 7 + c * 3) % 5 === 0) s += `<rect x="${c * 10 + 3}" y="${r * 10 + 4}" width="3" height="2" fill="#5a5a62"/>`;
    s += [[14, 20, '#5be3e0'], [76, 30, '#ffd84a'], [30, 54, '#e04848'], [84, 58, '#5be3e0']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="3" height="3" fill="${c}"/><rect x="${x + 4}" y="${y + 2}" width="2" height="2" fill="${c}"/>`).join('');
    s += [[8, 36], [90, 40]].map(([x, y]) => `<circle cx="${x + 1}" cy="${y}" r="7" fill="#ffd36b" opacity=".25"/><rect x="${x}" y="${y}" width="2" height="7" fill="#7a5230"/><rect x="${x - .5}" y="${y - 2.5}" width="3" height="3" fill="#ffb02e"/>`).join('');
    return s + ground(null, '#6b6b72', '#55555c', '#5a5a60');
  } },
  'b-village': { bg: 'linear-gradient(#8cc8ff, #e2f2ff 70%)', art: () => cloud(30, 8) +
    `<rect x="60" y="44" width="34" height="28" fill="#b08850"/><path d="M56 46 L77 28 L98 46 Z" fill="#6b4a26"/><rect x="72" y="56" width="9" height="16" fill="#5a3a20"/><rect x="63" y="52" width="6" height="6" fill="#bfe3f5"/><rect x="85" y="52" width="6" height="6" fill="#bfe3f5"/>` +
    `<rect x="60" y="44" width="34" height="2" fill="#7a5a30"/>` + oak(4, 40) + ground('#5fae3a', '#8b5a2b', '#6e4520') + `<rect x="34" y="72" width="22" height="3" fill="#a88a5a"/>` },
  'b-mushroom': { bg: 'linear-gradient(#9fb4ff, #e5ebff 70%)', art: () => `<rect x="72" y="40" width="8" height="32" fill="#e8dcc8"/><rect x="58" y="28" width="36" height="14" fill="#c62f2f"/><rect x="64" y="22" width="24" height="6" fill="#c62f2f"/>` +
    `<rect x="64" y="31" width="5" height="4" fill="#fff"/><rect x="80" y="29" width="5" height="4" fill="#fff"/><rect x="72" y="24" width="4" height="3" fill="#fff"/><rect x="88" y="34" width="4" height="4" fill="#fff"/>` +
    `<rect x="12" y="62" width="3" height="10" fill="#e8dcc8"/><rect x="8" y="58" width="11" height="5" fill="#9a6a4a"/>` + ground('#8e7a9a', '#8b5a2b', '#6e4520') },
  'b-nether': { bg: 'linear-gradient(#3a0a0a, #6b1a1a 70%)', art: () => `<rect x="10" y="4" width="10" height="8" fill="#ffd36b"/><rect x="14" y="12" width="4" height="4" fill="#ffd36b"/><rect x="76" y="4" width="12" height="7" fill="#ffd36b"/>` +
    ground(null, '#7a2a2a', '#5a1a1a', '#6b2222') + `<rect x="54" y="72" width="34" height="6" fill="#ff8c1a"/><rect x="54" y="72" width="34" height="2" fill="#ffd36b"/><rect x="58" y="70" width="4" height="2" fill="#ffb02e" opacity=".8"><animate attributeName="opacity" values=".2;1;.2" dur="1.5s" repeatCount="indefinite"/></rect>` },
  'b-end': { bg: 'linear-gradient(#0d0a1a, #2a1a40)', art: () => [[10, 10], [30, 6], [52, 16], [70, 8], [88, 18], [40, 30], [76, 34]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.6" height="1.6" fill="#e0c8ff"/>`).join('') +
    `<rect x="6" y="30" width="10" height="42" fill="#1a1426"/><rect x="84" y="22" width="10" height="50" fill="#1a1426"/><rect x="7" y="26" width="8" height="4" fill="#d16bff" opacity=".7"/><rect x="85" y="18" width="8" height="4" fill="#d16bff" opacity=".7"/>` +
    ground(null, '#dfe0a8', '#c8c98e', '#d2d39a') },
  'b-gold': { bg: 'linear-gradient(#ffe9a8, #fff6d6 70%)', art: () => `<rect x="58" y="34" width="36" height="38" fill="#f5c542"/><path d="M54 36 L76 18 L98 36 Z" fill="#e0a800"/>` +
    [62, 70, 78, 86].map(x => `<rect x="${x}" y="40" width="4" height="32" fill="#ffe27a"/>`).join('') +
    [[10, 16], [30, 8], [44, 24]].map(([x, y]) => `<rect x="${x}" y="${y}" width="3" height="3" fill="#fff"/>`).join('') + ground('#ffe27a', '#e3b93a', '#c99a1a') },
};
WORLDS['b-ocean'].noGround = true;

// px：場景大小；mini：首頁左上角的小頭像（不畫手上的東西和寵物）
function petSceneHtml(px, mini = false) {
  const p = S.pet;
  const si = petStage(p);
  const w = WORLDS[p.equip.bg] || WORLDS['b-plains'];
  const mount = p.equip.mount && MOUNTS[p.equip.mount];
  const buddy = !mini && p.equip.buddy && BUDDIES[p.equip.buddy];
  const petPx = px * PET_STAGES[si].size * (mount ? 0.78 : 1) * (buddy ? 0.92 : 1);
  const ground = px * 0.26;
  const lift = mount ? px * ({ 'm-boat': 0.1, 'm-cart': 0.14, 'm-dragon': 0.13 }[p.equip.mount] ?? 0.17) : 0;
  const heroLeft = (px - petPx) / 2 - (buddy ? px * 0.08 : 0);
  let h = `<div class="pet-scene" style="width:${px}px;height:${px}px;background:${w.bg}">`;
  h += `<svg class="pet-art" viewBox="0 0 100 100" preserveAspectRatio="none" shape-rendering="crispEdges">${w.art()}</svg>`;
  if (mount) {
    const mw = px * mount.w * 0.8;
    h += `<div class="pet-part" style="width:${mw}px;height:${mw}px;left:${heroLeft + petPx / 2 - mw / 2}px;bottom:${ground - mw * (p.equip.mount === 'm-dragon' ? 0.05 : 0.32)}px">${mountSvg(p.equip.mount)}</div>`;
  }
  h += `<div class="pet-part pet-body${p.equip.color === 's-rainbow' ? ' pet-rainbow' : ''}${p.equip.color === 's-gold' ? ' pet-gold' : ''}" style="width:${petPx}px;height:${petPx}px;left:${heroLeft}px;bottom:${ground - px * 0.02 + lift}px">` +
    petSvg(si, p.equip.color, p.equip.outfit, mini ? null : p.equip.gear, p.equip.hat) + '</div>';
  if (buddy) {
    const bw = px * (['p-golem', 'p-skeleton', 'p-creeper'].includes(p.equip.buddy) ? 0.3 : 0.22);
    h += `<div class="pet-part pet-buddy" style="width:${bw}px;height:${bw}px;right:${px * 0.04}px;bottom:${ground - px * 0.02}px">${buddySvg(p.equip.buddy)}</div>`;
  }
  return h + '</div>';
}
function petMini() {
  return petSceneHtml(64, true) + (petNeedsCare() ? '<span class="pet-alert">!</span>' : '');
}

// ───────── 英雄頁 ─────────
let petTab = 'care';
function petPage() {
  petTick(); save();
  const p = S.pet;
  const si = petStage(p), st = PET_STAGES[si], next = PET_STAGES[si + 1];
  const mood = petMood(p);
  const free = spendable();
  const pats = p.pats[today()] || 0;
  const bar = (icon, label, v, color) => `
    <div class="pet-stat"><span>${icon} ${label}</span><div class="pet-bar"><div style="width:${Math.round(v)}%;background:${color}"></div></div><b>${Math.round(v)}</b></div>`;
  const tabs = [['care', '🍖 照顧'], ...PET_SLOTS.map(k => [k, `${PET_SHOP[k].icon} ${PET_SHOP[k].name}`])];
  app.innerHTML = `
    <div class="top-bar"><button class="back" onclick="home()">← 首頁</button><h2>⛏️ 我的英雄</h2><span class="small muted" style="margin-left:auto">可用 🪙 ${free}</span></div>
    <div class="card pet-card">
      <div class="pet-stage-wrap" onclick="petPat()">${petSceneHtml(Math.min(300, innerWidth - 80))}</div>
      <div class="pet-info">
        <div class="row between wrap"><div class="title-line">${esc(p.name)} <span class="small muted">${st.name}</span></div>
          <button class="btn-sm" onclick="petRename()">✏️ 改名${p.renamed ? `（🪙 ${RENAME_COST}）` : '（免費）'}</button></div>
        <div class="small" style="margin:4px 0 8px">${mood.face} ${mood.text}</div>
        ${next ? `<div class="small muted">成長 ${p.grow} / ${next.at} → 下一階段「${next.name}」</div>
          <div class="xpbar"><div style="width:${((p.grow - st.at) / (next.at - st.at) * 100).toFixed(1)}%;background:var(--ok)"></div></div>`
          : `<div class="small">🌟 已經是最高階段「${st.name}」了！成長值 ${p.grow}</div>`}
        <div style="margin-top:10px">${PET_STATS.map(([k, icon, label, color]) => bar(icon, label, p[k], color)).join('')}</div>
        <div class="small muted" style="margin-top:6px">點英雄可以免費擊掌（今天還有 ${Math.max(0, PET_PATS_PER_DAY - pats)} 次）。
          每答對 1 題，英雄成長 +${PET_LEARN.grow}，飽食度、心情、體力也會補一點（最多到 ${PET_LEARN.floor}）。肚子太餓時長得比較慢喔！</div>
        <div class="small" style="margin-top:4px">📅 本週成長 <b>${petWeekGrow()} / ${PET_WEEK_CAP}</b>${petWeekGrow() >= PET_WEEK_CAP ? '（已滿，下週一再長大；照顧仍會讓英雄開心）' : ''}</div>
        ${S.petDailyLimit ? `<div class="small muted">爸媽設定：每天最多花 ${S.petDailyLimit} 金幣在英雄身上（今天已花 ${ensureDay().petSpent || 0}）</div>` : ''}
      </div>
    </div>
    ${petRoadmapHtml()}
    <div class="pet-tabs">${tabs.map(([k, label]) => `<button class="${petTab === k ? 'on' : ''}" onclick="petTab='${k}';petPage()">${label}</button>`).join('')}</div>
    <div class="card">${petTab === 'care' ? petCareHtml(free) : petShopHtml(petTab, free)}</div>`;
}
// 成長路線圖
function petRoadmapHtml() {
  const p = S.pet;
  const si = petStage(p);
  const last = PET_STAGES[PET_STAGES.length - 1];
  const t = today();
  const recent = Array.from({ length: 7 }, (_, i) => S.days[addDays(t, -i)]?.petGrow || 0);
  const active = recent.filter(v => v > 0).length;
  const perDay = active ? Math.min(recent.reduce((a, b) => a + b, 0) / active, PET_WEEK_CAP / 7) : 0;
  const left = Math.max(0, last.at - p.grow);
  let eta = '';
  if (si === PET_STAGES.length - 1) eta = `🎉 已經養成「${last.name}」了，太厲害了！`;
  else if (perDay > 0) {
    const days = Math.ceil(left / perDay);
    const when = addDays(t, days);
    eta = `照最近的速度（每天約 ${Math.round(perDay)}），大約 <b>${days} 天後（${shortDate(when)}）</b>變成「${last.name}」` +
      (when <= PET_GOAL.date ? '，趕得上目標！💪' : `，要再加油才趕得上 ${shortDate(PET_GOAL.date)} 喔！`);
  } else eta = '開始答題、照顧英雄，就能算出還要多久升級！';
  return `
    <div class="card">
      <div class="row between wrap"><h3>🗺️ 成長路線圖</h3><span class="small muted">目標：${PET_GOAL.label}（${shortDate(PET_GOAL.date)}）成為「${last.name}」</span></div>
      <div class="pet-road">${PET_STAGES.map((st, i) => {
        const state = i < si ? 'done' : i === si ? 'now' : 'next';
        return `<div class="road-step ${state}">
          <span class="road-emoji">${petSvg(i, p.equip.color, null, null, null)}</span>
          <b>${st.name}</b><span class="small muted">${st.desc}</span>
          <span class="small">🔓 ${Object.values(PET_SHOP).flatMap(c => c.items).filter(it => it.need === i).length} 樣新東西</span>
          <span class="road-tag">${state === 'done' ? '✓ 完成' : state === 'now' ? '現在' : `還差 ${st.at - p.grow}`}</span>
        </div>`;
      }).join('<span class="road-arrow">➜</span>')}</div>
      <div class="xpbar" style="margin-top:12px"><div style="width:${Math.min(100, p.grow / last.at * 100).toFixed(1)}%;background:var(--ok)"></div></div>
      <div class="small" style="margin-top:6px">總成長 ${p.grow} / ${last.at}。${eta}</div>
    </div>`;
}

// ───────── 家長頁：金幣去向與英雄花費上限 ─────────
function coinFlowHtml() {
  const t = today();
  const week = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const sum = key => week.reduce((a, k) => a + ((S.days[k] || {})[key] || 0), 0);
  const doneIn = r => r.done && week.includes(r.doneDate || r.date);
  const rewardWeek = S.redeems.filter(doneIn).reduce((a, r) => a + r.cost, 0);
  const rewardAll = S.redeems.filter(r => r.done).reduce((a, r) => a + r.cost, 0);
  return `
    <div class="card">
      <h3>🪙 金幣去向</h3>
      <table>
        <tr><th></th><th class="num">今天</th><th class="num">近 7 天</th><th class="num">累計</th></tr>
        <tr><td>賺到的金幣</td><td class="num">${ensureDay().earned || 0}</td><td class="num">${sum('earned')}</td><td class="num">—</td></tr>
        <tr><td>⛏️ 花在英雄</td><td class="num">${ensureDay().petSpent || 0}</td><td class="num">${sum('petSpent')}</td><td class="num">${S.pet.spent || 0}</td></tr>
        <tr><td>🎁 兌換獎勵</td><td class="num">—</td><td class="num">${rewardWeek}</td><td class="num">${rewardAll}</td></tr>
        <tr><td>🛡️ 保護卡</td><td class="num">${ensureDay().shieldSpent || 0}</td><td class="num">${sum('shieldSpent')}</td><td class="num">${S.shieldSpent || 0}</td></tr>
      </table>
      <p class="small muted">目前剩 ${S.coins} 金幣。英雄成長 ${S.pet.grow} / ${PET_STAGES[PET_STAGES.length - 1].at}（${PET_STAGES[petStage(S.pet)].name}），本週 ${petWeekGrow()} / ${PET_WEEK_CAP}。</p>
      <div class="row wrap">
        <span>英雄每天最多花</span>
        <input id="petlim" type="tel" value="${S.petDailyLimit || ''}" placeholder="不限制" style="width:100px">
        <span>金幣</span>
        <button class="btn-sm" onclick="setPetLimit()">儲存</button>
      </div>
      <p class="small muted">留空或 0 ＝ 不限制。照顧、商店、改名都算在內。</p>
    </div>`;
}
function setPetLimit() {
  const v = parseInt(document.getElementById('petlim').value, 10);
  S.petDailyLimit = v > 0 ? v : 0;
  save();
  toast(S.petDailyLimit ? `英雄每天最多花 ${S.petDailyLimit} 金幣` : '英雄花費不限制');
  parentPage();
}

function petCareHtml(free) {
  const full = petWeekGrow() >= PET_WEEK_CAP;
  return `${full ? '<p class="small pending">本週成長已滿 🌙 現在照顧只會讓英雄開心，不會長大，下週一再一起努力！</p>' : ''}
    <div class="pet-grid">${PET_CARE.map(c => {
    const fx = [c.food && `🍗+${c.food}`, c.happy && `❤️+${c.happy}`, c.clean && `⚡+${c.clean}`, `🌱+${c.grow}`].filter(Boolean).join(' ');
    return `<button class="pet-item" onclick="petCare('${c.id}')" ${free >= c.cost ? '' : 'disabled'}>
      <span class="pi-ico">${c.icon}</span><b>${c.name}</b><span class="small muted">${fx}</span><span class="pi-cost">🪙 ${c.cost}</span></button>`;
  }).join('')}</div>`;
}
function petShopHtml(slot, free) {
  const p = S.pet;
  const st = Math.max(1, petStage(p));
  return `<div class="pet-grid">${PET_SHOP[slot].items.map(it => {
    const owned = p.owned.includes(it.id);
    const on = p.equip[slot] === it.id;
    const preview = slot === 'color' ? petSvg(st, it.id)
      : slot === 'outfit' ? petSvg(st, p.equip.color, it.id)
      : slot === 'hat' ? petSvg(st, p.equip.color, null, null, it.id)
      : slot === 'gear' ? itemSvg(it)
      : slot === 'mount' ? mountSvg(it.id)
      : slot === 'buddy' ? buddySvg(it.id)
      : `<svg class="pet-svg" viewBox="0 0 100 100" preserveAspectRatio="none" shape-rendering="crispEdges">${WORLDS[it.id].art()}</svg>`;
    const box = slot === 'bg' ? `<span class="pi-ico pi-bg" style="background:${WORLDS[it.id].bg}">${preview}</span>` : `<span class="pi-ico pi-svg">${preview}</span>`;
    const locked = !owned && it.need > petStage(p);
    const label = on ? (slot === 'color' || slot === 'bg' ? '使用中' : '使用中（點一下卸下）') : owned ? '點一下換上'
      : locked ? `🔒 升到「${PET_STAGES[it.need].name}」` : it.cost ? `🪙 ${it.cost}` : '免費';
    return `<button class="pet-item ${on ? 'on' : ''} ${locked ? 'locked' : ''}" onclick="petShopTap('${slot}','${it.id}')" ${!owned && (locked || free < it.cost) ? 'disabled' : ''}>
      ${box}<b>${it.name}</b><span class="pi-cost ${owned ? 'owned' : ''}">${label}</span></button>`;
  }).join('')}</div>`;
}

// ───────── 動作 ─────────
function petSpend(cost, what) {
  const d = ensureDay();
  const limit = S.petDailyLimit || 0;
  if (limit && (d.petSpent || 0) + cost > limit) { toast(`今天花在英雄的金幣已達爸媽設定的上限 ${limit} 個`); return false; }
  if (spendable() < cost) { toast('金幣不夠喔'); return false; }
  if (cost >= 100 && !confirm(`用 ${cost} 金幣買「${what}」嗎？`)) return false;
  S.coins -= cost;
  d.petSpent = (d.petSpent || 0) + cost;
  S.pet.spent = (S.pet.spent || 0) + cost;
  return true;
}
// 答對題目時由 app.js 呼叫
function petLearn() {
  petTick();
  const p = S.pet;
  for (const k of ['food', 'happy', 'clean']) if (p[k] < PET_LEARN.floor) p[k] = Math.min(PET_LEARN.floor, p[k] + PET_LEARN.per);
  petGrow(PET_LEARN.grow);
}
function petWeekGrow() {
  const ws = weekStart(today());
  return Array.from({ length: 7 }, (_, i) => S.days[addDays(ws, i)]?.petGrow || 0).reduce((a, b) => a + b, 0);
}
function petGrow(n) {
  const p = S.pet;
  const before = petStage(p);
  const d = ensureDay();
  const room = Math.max(0, PET_WEEK_CAP - petWeekGrow());
  const got = Math.min(room, p.food < 20 ? Math.ceil(n / 2) : n);
  if (got < n && !d.petCapNoticed && room === 0) { d.petCapNoticed = true; toast(`🌙 ${p.name} 這週已經成長很多了，下週一再繼續升級！`); }
  p.grow += got;
  d.petGrow = (d.petGrow || 0) + got;
  const after = petStage(p);
  if (after > before) setTimeout(() => { burst('🎉', 20); toast(`🎊 ${p.name} 升級了！變成「${PET_STAGES[after].name}」`); }, 300);
  return got;
}
function petCare(id) {
  const c = PET_CARE.find(x => x.id === id);
  petTick();
  if (!c) return;
  if (petWeekGrow() >= PET_WEEK_CAP && !confirm(`本週成長已經滿了，這次「${c.name}」只會讓英雄狀態變好，不會長大。還要花 ${c.cost} 金幣嗎？`)) return;
  if (!petSpend(c.cost, c.name)) return;
  const p = S.pet;
  for (const k of ['food', 'happy', 'clean']) if (c[k]) p[k] = Math.min(100, p[k] + c[k]);
  const got = petGrow(c.grow);
  save();
  burst(c.icon, 8);
  toast(`${c.icon} ${p.name}：謝謝你！${got ? `成長 +${got}` : '（本週成長已滿，但我很開心！）'}`);
  petPage();
}
function petPat() {
  const p = S.pet, t = today();
  const used = p.pats[t] || 0;
  if (used >= PET_PATS_PER_DAY) { toast(`${p.name} 今天擊掌夠了，明天再來～`); return; }
  p.pats = { [t]: used + 1 };
  p.happy = Math.min(100, p.happy + 8);
  petGrow(2);
  save();
  burst('✋', 6);
  petPage();
}
function petRename() {
  const p = S.pet;
  const cost = p.renamed ? RENAME_COST : 0;
  if (cost && spendable() < cost) { toast('金幣不夠喔'); return; }
  const name = (prompt(`幫英雄取新名字（最多 8 個字）${cost ? `，要花 ${cost} 金幣` : ''}：`, p.name) || '').trim().slice(0, 8);
  if (!name || name === p.name) return;
  if (cost && !petSpend(cost, '改名')) return;
  p.name = name; p.renamed++;
  save();
  toast(`英雄的新名字是「${name}」！`);
  petPage();
}
function petShopTap(slot, id) {
  const p = S.pet, it = PET_ITEM[id];
  if (!it) return;
  if (!p.owned.includes(id)) {
    if (it.need > petStage(p)) { toast(`要先升到「${PET_STAGES[it.need].name}」才能拿到「${it.name}」喔！`); return; }
    if (!petSpend(it.cost, it.name)) return;
    p.owned.push(id);
    p.equip[slot] = id;
    burst('✨', 12);
    toast(`得到「${it.name}」，已經裝備上了！`);
  } else if (p.equip[slot] === id) {
    if (slot === 'color' || slot === 'bg') return; // 造型和世界一定要有一個
    p.equip[slot] = null;
  } else {
    p.equip[slot] = id;
  }
  save();
  petPage();
}

// ───────── 樣式 ─────────
(function petStyles() {
  const css = `
  .avatar.pet-mini { padding: 0; overflow: visible; position: relative; background: none; }
  .avatar.pet-mini .pet-scene { border-radius: 14px; box-shadow: 0 2px 6px rgba(0,0,0,.18); }
  .pet-alert { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: var(--bad); color: #fff; font-weight: 800; font-size: 15px; display: grid; place-items: center; animation: pop .4s infinite alternate; }
  .pet-scene { position: relative; overflow: hidden; border-radius: 16px; flex: none; image-rendering: pixelated; }
  .pet-art { position: absolute; inset: 0; width: 100%; height: 100%; }
  .pet-svg { width: 100%; height: 100%; display: block; }
  .pet-part { position: absolute; line-height: 1; }
  .pet-body { animation: petBob 2.4s ease-in-out infinite; }
  .pet-buddy { animation: petBob 1.8s ease-in-out infinite reverse; }
  @keyframes petBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3%); } }
  .pet-rainbow { animation: petBob 2.4s ease-in-out infinite, petHue 3s linear infinite; }
  .pet-rainbow-g { animation: petHue 3s linear infinite; }
  @keyframes petHue { from { filter: hue-rotate(0deg) saturate(1.4); } to { filter: hue-rotate(360deg) saturate(1.4); } }
  .pet-gold { filter: drop-shadow(0 0 6px #ffd54a); }
  .pet-card { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
  .pet-stage-wrap { cursor: pointer; margin: 0 auto; }
  .pet-info { flex: 1; min-width: 240px; }
  .pet-stat { display: grid; grid-template-columns: 86px 1fr 34px; align-items: center; gap: 8px; font-size: 15px; margin: 5px 0; }
  .pet-bar { height: 12px; border-radius: 3px; background: var(--bg); overflow: hidden; }
  .pet-bar > div { height: 100%; transition: width .4s; }
  .pet-stat b { text-align: right; font-size: 14px; }
  .pet-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px; -webkit-overflow-scrolling: touch; }
  .pet-tabs button { flex: none; padding: 9px 14px; border-radius: 10px; background: var(--card); box-shadow: var(--shadow); font-weight: 700; font-size: 16px; }
  .pet-tabs button.on { background: var(--brand); color: #fff; }
  .pet-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .pet-item { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 12px 8px; border-radius: 12px; background: var(--bg); border: 3px solid transparent; text-align: center; }
  .pet-item.on { border-color: var(--ok); background: var(--ok-soft); }
  .pet-item:disabled { opacity: .45; }
  .pet-item.locked .pi-svg, .pet-item.locked .pi-bg { filter: grayscale(1) brightness(.7); }
  .pet-item.locked .pi-cost { color: var(--muted); font-size: 13px; }
  .pet-item b { font-size: 16px; }
  .pi-ico { font-size: 38px; line-height: 1.1; display: inline-block; }
  .pi-svg { width: 72px; height: 72px; }
  .pi-bg { width: 80px; height: 60px; border-radius: 8px; position: relative; overflow: hidden; }
  .pi-cost { font-size: 14px; font-weight: 700; color: #a76a00; }
  .pi-cost.owned { color: var(--ok); }
  .pet-road { display: flex; align-items: stretch; gap: 4px; overflow-x: auto; padding: 8px 2px 4px; -webkit-overflow-scrolling: touch; }
  .road-step { flex: none; width: 112px; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; padding: 10px 6px; border-radius: 12px; background: var(--bg); border: 3px solid transparent; }
  .road-step b { font-size: 15px; }
  .road-step .small { font-size: 12px; line-height: 1.3; }
  .road-step.now { border-color: var(--brand); background: var(--brand-soft); }
  .road-step.next .road-emoji { opacity: .6; }
  .road-step.done { opacity: .75; }
  .road-emoji { width: 64px; height: 64px; display: inline-block; }
  .road-tag { margin-top: auto; font-size: 13px; font-weight: 800; color: var(--brand-dark); }
  .road-step.done .road-tag { color: var(--ok); }
  .road-arrow { align-self: center; color: var(--muted); flex: none; }
  `;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
})();
