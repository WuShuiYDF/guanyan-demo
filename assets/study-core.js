/* ══════ 研屿沉潜自习室 · 场景与状态（移植自 innook-clone） ══════ */
'use strict';

// ── 场景定义（与 innook scenes.ts 一致） ──
const AMBIENT_CHANNELS = {
  birds: { id: 'birds', label: '鸟鸣' },
  stream: { id: 'stream', label: '溪流' },
  wind: { id: 'wind', label: '风声' },
  rain: { id: 'rain', label: '雨声' },
  waves: { id: 'waves', label: '海浪' },
  fire: { id: 'fire', label: '篝火' },
};

const SCENES = [
  { id: 'forest-cabin', name: '森林木屋', en: 'Forest Cabin', tagline: '鸟鸣与溪流环绕的林间木屋，适合编程与逻辑思考', image: 'assets/scenes/forest-cabin.jpg', accent: '#6ea178', channels: ['birds', 'stream', 'wind'], defaultActive: ['birds', 'stream'] },
  { id: 'snow-mountain', name: '雪山小屋', en: 'Snow Cabin', tagline: '篝火噼啪作响，风雪在窗外，适合深度阅读与写作', image: 'assets/scenes/snow-mountain.jpg', accent: '#8fb3cc', channels: ['fire', 'wind'], defaultActive: ['fire', 'wind'] },
  { id: 'ocean-cove', name: '海边咖啡馆', en: 'Seaside Café', tagline: '海浪轻拍礁石，适合创意工作与头脑风暴', image: 'assets/scenes/ocean-cove.jpg', accent: '#6f9fb8', channels: ['waves', 'wind'], defaultActive: ['waves'] },
  { id: 'night-library', name: '深夜书房', en: 'Midnight Library', tagline: '雨夜暖灯与旧书页，适合复习与记忆', image: 'assets/scenes/night-library.jpg', accent: '#b39a6b', channels: ['rain', 'fire'], defaultActive: ['rain', 'fire'] },
  { id: 'rainy-cafe', name: '雨天咖啡馆', en: 'Rainy Café', tagline: '玻璃窗上的雨痕与暖光，适合长期专注与书写', image: 'assets/scenes/rainy-cafe.jpg', accent: '#9c8f7f', channels: ['rain', 'fire', 'wind'], defaultActive: ['rain', 'fire'] },
  { id: 'misty-hills', name: '云雾山涧', en: 'Misty Valley', tagline: '高山云雾与鸟鸣溪涧，适合冥想式的专注', image: 'assets/scenes/misty-hills.jpg', accent: '#93a68c', channels: ['wind', 'stream', 'birds'], defaultActive: ['wind', 'birds'] },

  { id: 'rice-pavilion', name: '稻田凉亭', en: 'Rice Pavilion', tagline: '蛙鸣与夏虫环绕的田边凉亭，适合背书与朗读', image: 'assets/scenes/forest-cabin.jpg', accent: '#8aa878', channels: ['birds', 'wind'], defaultActive: ['birds'] },
  { id: 'canyon-stars', name: '峡谷星空', en: 'Canyon Stars', tagline: '夜风穿谷、溪声隐隐，适合深夜刷题', image: 'assets/scenes/misty-hills.jpg', accent: '#7d8fb8', channels: ['wind', 'stream'], defaultActive: ['wind'] },
  { id: 'lakeside-mist', name: '湖畔晨雾', en: 'Lakeside Mist', tagline: '水声拍岸、晨鸟初啼，适合早起第一轮复习', image: 'assets/scenes/misty-hills.jpg', accent: '#8fb3a8', channels: ['waves', 'birds'], defaultActive: ['waves'] },
  { id: 'bamboo-path', name: '竹林小径', en: 'Bamboo Path', tagline: '竹叶沙沙、鸟鸣清脆，适合冷静的错题复盘', image: 'assets/scenes/forest-cabin.jpg', accent: '#7fa886', channels: ['birds', 'wind'], defaultActive: ['birds', 'wind'] },
  { id: 'old-town-books', name: '老城书店', en: 'Old Town Books', tagline: '雨打屋檐与挂钟摆动，适合背诵与默写', image: 'assets/scenes/night-library.jpg', accent: '#a8906b', channels: ['rain'], defaultActive: ['rain'] },
  { id: 'lighthouse-night', name: '灯塔风夜', en: 'Lighthouse Night', tagline: '海浪与强风对峙，适合冲刺期的破釜沉舟', image: 'assets/scenes/ocean-cove.jpg', accent: '#6f9fb8', channels: ['waves', 'wind'], defaultActive: ['waves', 'wind'] },
  { id: 'courtyard-fire', name: '庭院炉火', en: 'Courtyard Fire', tagline: '篝火噼啪、虫鸣四野，适合晚间总结与计划', image: 'assets/scenes/snow-mountain.jpg', accent: '#b3896b', channels: ['fire', 'birds'], defaultActive: ['fire'] },
  { id: 'valley-stream', name: '山谷溪流', en: 'Valley Stream', tagline: '溪水潺潺、林间鸟语，适合长时间沉浸刷卷', image: 'assets/scenes/forest-cabin.jpg', accent: '#79a893', channels: ['stream', 'birds'], defaultActive: ['stream'] },
  { id: 'rooftop-rain', name: '屋顶雨夜', en: 'Rooftop Rain', tagline: '雨点敲铁皮、远处闷雷，适合对抗瞌睡的夜读', image: 'assets/scenes/rainy-cafe.jpg', accent: '#8f8a9c', channels: ['rain', 'wind'], defaultActive: ['rain'] },
  { id: 'tundra-springs', name: '苔原温泉', en: 'Tundra Springs', tagline: '蒸汽氤氲、水声温吞，适合放松式的第二轮过书', image: 'assets/scenes/snow-mountain.jpg', accent: '#9cb8b3', channels: ['waves', 'wind'], defaultActive: ['waves'] },
  { id: 'midnight-reads', name: '午夜书房', en: 'Midnight Reads', tagline: '炉火与雨声各半，适合论文与写作之夜', image: 'assets/scenes/night-library.jpg', accent: '#b39a6b', channels: ['rain', 'fire'], defaultActive: ['fire', 'rain'] },
  { id: 'foggy-bay', name: '晨雾海湾', en: 'Foggy Bay', tagline: '海浪与晨鸟交替，适合唤醒式的晨间任务', image: 'assets/scenes/ocean-cove.jpg', accent: '#93a6b8', channels: ['waves', 'birds'], defaultActive: ['birds'] },
];
function getScene(id) { return SCENES.find(s => s.id === id); }

// ── 学习统计（localStorage，与后端 study-sync 共存） ──
const STATS_KEY = 'innook.stats.v1';
function statsLoad() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || { days: {}, total: { focusSec: 0, pomodoros: 0 } }; }
  catch (e) { return { days: {}, total: { focusSec: 0, pomodoros: 0 } }; }
}
function statsSave(d) { localStorage.setItem(STATS_KEY, JSON.stringify(d)); }
function todayKey(d) {
  const t = d || new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
function recordFocus(seconds, completed, subject) {
  const data = statsLoad();
  const key = todayKey();
  const day = data.days[key] || { focusSec: 0, pomodoros: 0 };
  day.focusSec += seconds;
  if (completed) day.pomodoros += 1;
  data.days[key] = day;
  data.total.focusSec += seconds;
  if (completed) data.total.pomodoros += 1;
  statsSave(data);
  void syncToGuanyan(key, day.focusSec, day.pomodoros, subject);
  return data;
}
/** 专注数据回流研屿后端（同源，静默失败） */
function syncToGuanyan(dayKey, focusSec, pomodoros, subject) {
  const token = localStorage.getItem('gy_token');
  if (!token) return;
  try {
    const body = subject
      ? { entries: [{ date: dayKey, subject, duration_minutes: Math.round(focusSec / 60), pomodoros, source: 'study_room' }] }
      : { days: { [dayKey]: { focusSec, pomodoros } } };
    void fetch('/api/profile/study-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  } catch (e) { /* ignore */ }
}
