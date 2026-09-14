/* 研屿 · 共享 JS：API 客户端 / 认证 / 工具函数 */
'use strict';

const API = '/api';

// ── 认证 ──
let TOKEN = localStorage.getItem('gy_token') || null;
let USER = null;

function _gotoLogin() {
  const cur = location.pathname.split('/').pop() || 'index.html';
  location.href = `login.html?next=${encodeURIComponent(cur + location.search)}`;
}

/** 强制鉴权：本地无有效 token（或校验失败）时跳转登录页并抛错。 */
async function requireAuth() {
  const user = await peekAuth();
  if (user) return user;
  localStorage.removeItem('gy_token');
  TOKEN = null; USER = null;
  _gotoLogin();
  throw new Error('需要登录');
}

/** 公开页探测登录态：不跳转，已登录返回用户，否则返回 null。 */
async function peekAuth() {
  if (USER && TOKEN) return USER;
  TOKEN = localStorage.getItem('gy_token') || null;
  if (TOKEN) {
    try {
      const r = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${TOKEN}` } });
      if (r.ok) { USER = await r.json(); return USER; }
    } catch (e) { /* 服务不可达：按未登录处理 */ }
  }
  return null;
}

/** 退出登录：清除本地凭证并回到登录页。 */
function logout() {
  localStorage.removeItem('gy_token');
  TOKEN = null; USER = null;
  location.href = 'login.html';
}

async function api(path, { method = 'GET', body, silent } = {}) {
  await requireAuth();
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) { // token 失效 → 回登录页，登录后回到当前页
    localStorage.removeItem('gy_token');
    TOKEN = null; USER = null;
    _gotoLogin();
    throw new Error('登录已过期');
  }
  if (!r.ok) {
    let detail = `HTTP ${r.status}`;
    try { detail = (await r.json()).detail || detail; } catch (e) { /* ignore */ }
    if (r.status === 402) {
      if (!silent) {
        try { showQuotaExhaustedModal(detail); } catch (e) { toast(detail, 'err'); }
      }
      throw new Error(detail);
    }
    if (!silent) toast(`${detail}`, 'err');
    throw new Error(detail);
  }
  return r.json();
}

// ── 公开接口（无需登录） ──
async function publicApi(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ── 主题（双配色：暖棕·冷锚 dark / 暖白纸张 light） ──
function applyTheme(t, persist = true) {
  const changed = document.documentElement.getAttribute('data-theme') !== t;
  document.documentElement.setAttribute('data-theme', t);
  if (persist) localStorage.setItem('gy_theme', t);
  document.querySelectorAll('#themeToggle, #admThemeToggle').forEach(btn => {
    const moon = btn.querySelector('.icon-moon');
    const sun = btn.querySelector('.icon-sun');
    if (moon && sun) {
      moon.style.display = t === 'dark' ? '' : 'none';
      sun.style.display = t === 'light' ? '' : 'none';
    }
  });
  // 仅在主题真正变化时广播（图表页据此刷新）；初始化不派发，避免无限重载
  if (changed) {
    document.dispatchEvent(new CustomEvent('gy-theme-change', { detail: { theme: t } }));
  }
}
function toggleTheme() {
  applyTheme((localStorage.getItem('gy_theme') || 'dark') === 'dark' ? 'light' : 'dark');
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
function brandRgb() { return cssVar('--brand-rgb', '244, 231, 211'); }

/** 通用 ECharts 主题重着色（语义双向映射，幂等）：把 option 里旧主题的语义色
    （brand/line/panel/bg）替换为当前主题对应值，任意次执行都收敛。 */
function refitECharts() {
  if (!window.echarts) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const SEM = {
    brand: { dark: ['244, 231, 211'], light: ['61, 55, 48'] },
    line:  { dark: ['255, 255, 255'], light: ['0, 0, 0'] },
    panel: { dark: ['20, 18, 15', '15, 14, 12', '5, 5, 4', '30, 25, 20'], light: ['255, 255, 255', '250, 247, 241'] },
    bg:    { dark: ['38, 35, 34'], light: ['250, 247, 241'] },
  };
  const names = Object.keys(SEM);
  const variants = arr => arr.map(v => v.split(', ').map(x => x.trim()).join(',\\s*')).join('|');
  const alts = names.map(n => '(' + variants(SEM[n].dark) + '|' + variants(SEM[n].light) + ')').join('|');
  const pattern = new RegExp('rgba\\(' + alts, 'g');
  const semanticOf = (digits) => {
    const key = digits.join(', ');
    for (const n of names) {
      if (SEM[n].dark.concat(SEM[n].light).some(v => v === key)) return n;
    }
    return null;
  };
  const walk = v => {
    if (typeof v === 'string') {
      if (v.indexOf('rgba(') !== 0 && v.indexOf('rgb(') !== 0) return v;
      return v.replace(/rgba?\(([^)]+)\)/g, (m0, inner) => {
        const parts = inner.split(',').map(x => x.trim());
        const sem = semanticOf(parts.slice(0, 3));
        if (!sem) return m0;
        const target = SEM[sem][theme][0].split(', ');
        const rest = parts.slice(3);
        return 'rgba(' + target.join(', ') + (rest.length ? ', ' + rest.join(', ') : '') + ')';
      });
    }
    if (Array.isArray(v)) return v.map(walk);
    // 仅重组普通对象/数组；LinearGradient 等类实例原样保留（拆成普通对象会让 setOption 抛错）
    if (v && typeof v === 'object' && v.constructor === Object) { const o = {}; for (const k in v) o[k] = walk(v[k]); return o; }
    return v;
  };
  for (const dom of document.querySelectorAll('[_echarts_instance_]')) {
    const chart = echarts.getInstanceByDom(dom);
    if (!chart) continue;
    try {
      const opt = chart.getOption();
      const clean = Array.isArray(opt) ? opt[0] : opt;
      chart.setOption(walk(clean));
    } catch (e) { /* 单图失败不影响其它 */ }
  }
}
/* 页面级主题重绘注册：页面把「用当前 CSS 变量重画图表」的函数推进来，
   主题切换时在 refitECharts 之后逐个执行——比字符串重映射更可靠。 */
window.__gyRedraws = window.__gyRedraws || [];
function onThemeRedraw(fn) {
  window.__gyRedraws.push(fn);
  return fn;
}
document.addEventListener('gy-theme-change', () => {
  setTimeout(() => {
    try { refitECharts(); } catch (e) {}
    for (const fn of window.__gyRedraws) { try { fn(); } catch (e) {} }
  }, 60);
});

// ── 工具 ──
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 1 });
}
function fmtK(n) {
  if (n === null || undefined) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : fmtNum(n);
}
function pct(v, digits = 0) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}
function signed(v, digits = 0) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(digits)}%`;
}
function fmtTime(s) {
  if (!s) return '';
  const d = new Date(s);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (sameDay) return `今天 ${hm}`;
  const days = Math.round((now - d) / 86400000);
  if (days === 1) return `昨天 ${hm}`;
  if (days < 7) return `${days}天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function escHtml(s) { return esc(s); }

// 极简 Markdown 渲染（标题/加粗/列表/代码块/换行）
function mdLite(text) {
  const lines = String(text || '').split('\n');
  let html = '';
  let inCode = false, inList = false, buf = [];
  const closeList = () => { if (inList) { html += `<ul>${buf.join('')}</ul>`; buf = []; inList = false; } };
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--bold-c)">$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*(?![*])/, '$1<em style="color:var(--italic-c)">$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line.startsWith('```')) {
      closeList();
      if (inCode) { html += `<pre><code>${buf.join('\n')}</code></pre>`; buf = []; inCode = false; }
      else { inCode = true; buf = []; }
      continue;
    }
    if (inCode) { buf.push(esc(line)); continue; }
    if (/^###\s/.test(line)) { closeList(); html += `<h3 style="color:var(--h3-c)">${inline(line.slice(4))}</h3>`; continue; }
    if (/^##\s/.test(line)) { closeList(); html += `<h2 style="color:var(--h2-c)">${inline(line.slice(3))}</h2>`; continue; }
    if (/^#\s/.test(line)) { closeList(); html += `<h2 style="color:var(--h1-c)">${inline(line.slice(2))}</h2>`; continue; }
    if (/^[-*]\s/.test(line)) { inList = true; buf.push(`<li>${inline(line.slice(2))}</li>`); continue; }
    closeList();
    if (line.trim() === '') { html += '<p></p>'; continue; }
    html += `<p>${inline(line)}</p>`;
  }
  closeList();
  if (inCode && buf.length) html += `<pre><code>${buf.join('\n')}</code></pre>`;
  return html;
}

// ── Toast ──
function toast(msg, type) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type || ''}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

// ── 侧边导航 ──
function navSidebar(active) {
  const icon = {
    index: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    dashboard: '<path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/>',
    'study-room': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'agent-chat': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'decision-cards': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/>',
    report: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  };
  const items = [
    ['study-room', '沉浸自习室', 'study-room.html',
     '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'],
    ['search', '搜索', 'search',
     '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'],
    ['dashboard', '舆情分析', 'dashboard.html',
     '<path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/>'],
    ['agent-chat', 'Agent 对话', 'agent-chat.html',
     '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'],
    ['decision-cards', '决策卡片', 'decision-cards.html',
     '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/>'],
    ['report', '分析报告', 'report.html',
     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'],
    ['profile', '个人主页', 'profile.html',
     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'],
    ['notifications', '通知中心', 'notifications.html',
     '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'],
  ];
  // 手机端底栏分区：工具 | 分析 | 我的（真实分隔元素，不随选中态消失）
  const renderItem = ([key, tip, href, path]) => key === 'search' ? `
      <button class="nav-sidebar-item" onclick="openGlobalSearch()" title="搜索院校 / 专业">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
        <span class="nav-sidebar-tooltip">${tip}</span>
      </button>` : `
      <a class="nav-sidebar-item ${key === active ? 'active' : ''}" href="${href}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
        ${key === 'notifications' ? '<span class="nav-badge" id="notifBadge" hidden></span>' : ''}
        <span class="nav-sidebar-tooltip">${tip}</span>
      </a>`;
  const div = '<span class="nav-divider-m"></span>';
  const groups = [items.slice(0, 2), items.slice(2, 6), items.slice(6)]
    .map(g => g.map(renderItem).join(''));
  return `
  <nav class="nav-sidebar">
    <a class="nav-sidebar-logo" href="index.html" title="主页">
      <img src="assets/favicon.png" alt="研屿">
    </a>
    <div class="nav-sidebar-nav">
      ${groups.join(div)}
    </div>
    <div class="nav-sidebar-bottom">
      <button class="nav-sidebar-item" id="themeToggle" onclick="toggleTheme()" title="切换主题">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <span class="nav-sidebar-tooltip">切换主题</span>
      </button>
      <button class="nav-sidebar-item" onclick="openSettings()" title="设置">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span class="nav-sidebar-tooltip">设置</span>
      </button>
    </div>
  </nav>`;
}

// 页头阶段徽章（舆情日历）
async function fillStageBadge() {
  const els = document.querySelectorAll('.stage-badge, .ph-stage');
  if (!els.length) return;
  try {
    const cal = await publicApi('/macro/calendar');
    const c = cal.current;
    els.forEach(el => {
      el.textContent = c.stage_name;
    });
  } catch (e) { /* 保持占位 */ }
}

// 专业代码 → 名称（懒加载缓存）
let _majorNameCache = null;
async function majorName(code) {
  if (!code || !/^\d{4,6}$/.test(code)) return code || '';
  if (!_majorNameCache) {
    try {
      const data = await publicApi('/majors?page=1&page_size=100');
      _majorNameCache = Object.fromEntries((data.items || []).map(m => [m.code, m.name]));
    } catch (e) { return code; }
  }
  return _majorNameCache[code] || code;
}

// 决策卡片渲染（dashboard drawer / decision-cards / 对话内复用）
function decisionCardHtml(c, { compact } = {}) {
  const heat = c.heat || {};
  const disc = c.discouragement || {};
  const baoyan = c.baoyan_pressure || {};
  const gap = c.info_gap || {};
  const trend = c.trend_prediction || {};
  const mhi = heat.mhi ?? null;
  const scoreCls = mhi >= 80 ? 'score-low' : mhi >= 60 ? 'score-mid' : 'score-high';
  const growth = heat.mom_growth ?? 0;
  const d = disc.discouragement_index ?? 0;
  const b = baoyan.baoyan_pressure ?? 0;
  const gapV = gap.info_gap ?? 0;
  const trendCn = { rising: '上升', falling: '下降', stable: '平稳' }[trend.direction] || '—';
  const posts = (c.recent_posts && c.recent_posts.posts) || [];
  const finding = posts.length
    ? `${esc(posts[0].snippet.slice(0, 60))}…${posts.length > 1 ? ` 等近期讨论值得关注。` : ''}`
    : '暂无足够样本帖，信号置信度有限。';
  const advice = gapV > 0.1
    ? '存在被低估空间，可重点关注官方招简与推免占比。'
    : gapV < -0.1 ? '讨论热度高于学科实力，警惕泡沫与陪跑风险。'
      : (growth > 0.3 ? '热度快速上升，尽早锁定备考策略。' : '热度与实力基本匹配，按部就班即可。');
  const risks = [];
  if (d >= 0.3) risks.push('劝退舆情集中');
  if (b >= 0.4) risks.push('保研挤压明显');
  if (trend.direction === 'rising' && growth > 0.5) risks.push('讨论量暴涨');
  if (heat.self_fulfilling_signal === 'cooling_off') risks.push('舆论自我降温中');
  const riskTxt = risks.length ? `核心风险：${risks.join('、')}` : '暂无突出风险信号';
  const bar = (v, color) => `<div class="dc-metric-bar"><div class="dc-metric-fill" style="width:${Math.max(2, Math.min(100, v))}%;background:${color}"></div></div>`;
  const cWarm = 'linear-gradient(90deg,rgba(220,120,100,0.80),rgba(212,168,83,0.80))';
  const cCool = 'linear-gradient(90deg,rgba(167,210,170,0.80),rgba(212,168,83,0.80))';
  return `
  <div class="decision-card">
    <div class="dc-header">
      <div>
        <div class="dc-title">${esc(heat.school || '')} · ${esc(heat.major || '')}</div>
        <div class="dc-sub">样本 ${fmtNum(heat.sample_post_count)} 条 · ${heat.confidence === '低置信' ? '低置信' : '参考'}${heat.computed_at ? ' · 更新 ' + fmtTime(heat.computed_at) : ''}</div>
      </div>
      <div style="text-align:right">
        <div class="dc-score ${scoreCls}">${mhi === null ? '—' : mhi}</div>
        <div class="dc-sub">MHI ${signed(growth)}</div>
      </div>
    </div>
    <div class="dc-metrics">
      <div class="dc-metric">
        <div class="dc-metric-label">热度 <span class="cred cred-t3">T3</span></div>
        ${bar(mhi ?? 0, cWarm)}
        <div class="dc-metric-value">${mhi ?? '—'}（${signed(growth)}）</div>
      </div>
      <div class="dc-metric">
        <div class="dc-metric-label">劝退指数 <span class="cred cred-t3">T3</span></div>
        ${bar(d * 100, cCool)}
        <div class="dc-metric-value">${d.toFixed(2)} — ${d >= 0.3 ? '偏高' : d >= 0.15 ? '中等' : '较低'}</div>
      </div>
      <div class="dc-metric">
        <div class="dc-metric-label">保研挤压 <span class="cred cred-t3">T3</span></div>
        ${bar(b * 100, cWarm)}
        <div class="dc-metric-value">${pct(b)} — 统考竞争参考</div>
      </div>
      <div class="dc-metric">
        <div class="dc-metric-label">信息差 <span class="cred cred-t3">T3</span></div>
        ${bar((gapV + 1) * 50, gapV >= 0 ? 'rgba(167,210,170,0.80)' : 'rgba(220,120,100,0.80)')}
        <div class="dc-metric-value">${gapV >= 0 ? '+' : ''}${gapV.toFixed(2)} — ${gapV > 0.1 ? '被低估' : gapV < -0.1 ? '被高估' : '匹配'}（${esc(gap.discipline_evaluation || '评估未知')}）</div>
      </div>
      <div class="dc-metric">
        <div class="dc-metric-label">热度趋势 <span class="cred cred-t3">T3</span></div>
        ${bar(trend.direction === 'rising' ? 85 : trend.direction === 'falling' ? 25 : 55, trend.direction === 'falling' ? cCool : cWarm)}
        <div class="dc-metric-value">${trendCn}（7日动量 ${signed(trend.momentum_7d_vs_prev7d)}）</div>
      </div>
      <div class="dc-metric">
        <div class="dc-metric-label">初试 / 复试讨论 <span class="cred cred-t3">T3</span></div>
        ${bar((c.initial_vs_reexam && c.initial_vs_reexam.reexam_heavier) ? 70 : 40, 'rgba(140,180,220,0.75)')}
        <div class="dc-metric-value">${fmtNum(c.initial_vs_reexam?.initial_discussion)} / ${fmtNum(c.initial_vs_reexam?.reexam_discussion)}</div>
      </div>
    </div>
    ${compact ? '' : `<div class="dc-finding">${finding}<span class="cred cred-t3">T3</span></div>`}
    <div class="dc-footer">
      <div class="dc-advice"><strong>建议：</strong>${advice}</div>
      <div class="dc-risk">${riskTxt}</div>
    </div>
  </div>`;
}

// 通用启动：主题 + （非公开页）强制鉴权 + 阶段徽章
window.addEventListener('DOMContentLoaded', async () => {
  const hadLocalTheme = !!localStorage.getItem('gy_theme');
  // 无手动偏好时按时间自动选择：白天米白纸张，夜间暗夜星空（不落盘，手动切换后以用户为准）
  const timeTheme = (() => { const h = new Date().getHours(); return h >= 6 && h < 18 ? 'light' : 'dark'; })();
  applyTheme(localStorage.getItem('gy_theme') || timeTheme, false);
  if (window.GY_PUBLIC_PAGE) return; // 登录页/公开页：只做主题，不做登录拦截
  try {
    await requireAuth();
    // 管理员：侧栏追加管理后台入口
    if (USER?.is_admin) {
      const navCol = document.querySelector('.nav-sidebar-nav');
      if (navCol && !document.getElementById('adminNavBtn')) {
        navCol.insertAdjacentHTML('beforeend', `
        <a class="nav-sidebar-item" id="adminNavBtn" href="admin.html" title="管理后台">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span class="nav-sidebar-tooltip">管理后台</span>
        </a>`);
      }
    }
    // 本地无主题偏好时，采用账号云端保存的主题
    if (!hadLocalTheme) {
      try {
        const t = await api('/settings/pref/theme');
        if (t.value && t.value.theme) applyTheme(t.value.theme);
      } catch (e) { /* ignore */ }
    }
    await maybeStartOnboarding();
    maybeModelOnboarding();
    maybePlatformOnboarding();
  } catch (e) { return; } // 已跳转登录页
  fillStageBadge();
  refreshNotifBadge();
});


/* ── 首次登录 · 画像引导对话（全局组件） ──
   触发：登录后进入「舆情方向」板块（dashboard/agent-chat/decision-cards/report/profile）
   且尚无画像时弹出；跳过则在本次浏览器会话内不再弹；
   自习室域（study-room.html 设 GY_NO_ONBOARDING）全程豁免。 */
function ensureOnboardingOverlay() {
  if (document.getElementById('obOverlay')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="ob-overlay" id="obOverlay">
  <div class="ob-panel">
    <div class="ob-head">
      <div class="ob-avatar">研</div>
      <div>
        <div class="ob-head-t">初次见面，先聊聊你</div>
        <div class="ob-head-s">几个小问题，帮我认识你 · 之后随时可以在 Agent 对话里修改</div>
      </div>
      <button class="ob-skip" onclick="closeOnboarding()">跳过，稍后再说</button>
    </div>
    <div class="ob-stream" id="obStream"></div>
    <div class="ob-input">
      <input id="obInput" placeholder="输入你的情况，回车发送…" onkeydown="if(event.key==='Enter')obSend()">
      <button class="ob-send" id="obSendBtn" onclick="obSend()">发送</button>
    </div>
  </div>
</div>`);
}
// ── 登录后首次进入：Agent 画像引导对话（/profile/onboarding，仅无画像时触发一次） ──
let obStage = 0, obCollected = {}, obBusy = false;
function obOpen() {
  ensureOnboardingOverlay();
  document.getElementById('obOverlay').classList.add('open');
  obStreamMsg('agent', '你好呀，我是研屿的引导员～ 只占你一分钟：聊聊你的情况，我就能把整个平台调成适合你的样子。');
  obAsk();
}
function closeOnboarding() {
  document.getElementById('obOverlay').classList.remove('open');
  sessionStorage.setItem('gy_ob_skipped', '1'); // 本轮使用内不再弹（完成引导则有画像，永久不弹）
  toast('稍后可以在 Agent 对话里随时完善画像');
}
function obStreamMsg(role, text) {
  const el = document.createElement('div');
  el.className = 'ob-msg ' + role;
  el.textContent = text;
  document.getElementById('obStream').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return el;
}
async function obAsk() {
  obBusy = true;
  document.getElementById('obSendBtn').disabled = true;
  try {
    const r = await api('/profile/onboarding/chat', {
      method: 'POST',
      body: { stage_index: obStage, collected: obCollected, answer: '' },
    });
    obStreamMsg('agent', r.reply);
    obStage = r.next_index || obStage;
    obCollected = r.collected || obCollected;
    if (r.complete) obFinish();
  } catch (e) {
    obStreamMsg('agent', '我这边网络有点卡，稍后再点「跳过」也行。');
  }
  obBusy = false;
  document.getElementById('obSendBtn').disabled = false;
}
async function obSend() {
  if (obBusy) return;
  const input = document.getElementById('obInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  obStreamMsg('user', text);
  obBusy = true;
  document.getElementById('obSendBtn').disabled = true;
  const thinking = obStreamMsg('agent', '…');
  try {
    const r = await api('/profile/onboarding/chat', {
      method: 'POST',
      body: { stage_index: obStage, collected: obCollected, answer: text },
    });
    thinking.textContent = r.reply;
    obStage = r.next_index || obStage;
    obCollected = r.collected || obCollected;
    if (r.complete) obFinish();
  } catch (e) {
    thinking.textContent = '咦，好像没听清，再说一遍？';
  }
  obBusy = false;
  document.getElementById('obSendBtn').disabled = false;
}
function obFinish() {
  obStreamMsg('done', '画像建好啦！首页、分析、报告都已按你的情况调整。');
  const btn = document.getElementById('obSendBtn');
  btn.textContent = '开始使用研屿';
  btn.onclick = closeOnboarding;
  document.getElementById('obInput').placeholder = '完成啦';
  document.getElementById('obInput').disabled = true;
}
/* ── 手机端手势与转屏（P2） ── */
// Bottom sheet：从面板顶部下拉超过 90px 关闭（浮层把手）
function bindSheetSwipe(panel, closeFn) {
  if (!panel || panel.dataset.sheetBound) return;
  panel.dataset.sheetBound = '1';
  let sy = null, dy = 0;
  panel.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 767) return;
    const t = e.touches[0];
    const inHandle = panel.getBoundingClientRect().top + 56 >= t.clientY;
    if (!inHandle) { sy = null; return; }
    sy = t.clientY; dy = 0;
    panel.style.transition = 'none';
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (sy === null) return;
    dy = Math.max(0, e.touches[0].clientY - sy);
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  panel.addEventListener('touchend', () => {
    if (sy === null) return;
    panel.style.transition = '';
    if (dy > 90) { panel.style.transform = ''; closeFn(); }
    else panel.style.transform = '';
    sy = null;
  });
}
// 各浮层打开时绑定一次（关闭函数可能定义在各页面内联脚本里，
// 必须延迟按名字解析，顶层直接引用会让 app.js 在此中断、后续全部失效）
const _sheetMap = [
  ['#settingsOverlay .settings-panel', 'closeSettings'],
  ['#genOverlay .gen-panel', 'closeGenOverlay'],
  ['#listOverlay .rl-panel', 'closeList'],
  ['#obOverlay .ob-panel', 'closeOnboarding'],
  ['#sceneSwitcherOverlay .scene-switcher-panel', 'closeSceneSwitcher'],
];
setInterval(() => {
  if (window.innerWidth > 767) return;
  for (const [sel, fnName] of _sheetMap) {
    const fn = typeof window[fnName] === 'function' ? window[fnName] : null;
    if (!fn) continue;
    const p = document.querySelector(sel);
    if (p && getComputedStyle(p.closest('.ob-overlay, #genOverlay, #listOverlay, #settingsOverlay, #sceneSwitcherOverlay') || p).display !== 'none') {
      bindSheetSwipe(p, fn);
    }
  }
}, 800);
// 转屏/视口变化：通知图表重排
window.addEventListener('orientationchange', () => {
  setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 250);
});

async function maybeStartOnboarding() {
  // 公开页（主页）例外：已登录的新用户停在这里也应引导；
  // 自习室域照旧全程豁免
  if (window.GY_NO_ONBOARDING) return;
  if (window.GY_PUBLIC_PAGE && !localStorage.getItem('gy_token')) return;
  if (sessionStorage.getItem('gy_ob_skipped')) return;
  try {
    const st = await api('/profile/onboarding/status', { silent: true });
    if (!st.has_profile) obOpen();
  } catch (e) { /* ignore */ }
}

// ── 通知未读角标 ──
async function refreshNotifBadge() {
  if (window.GY_PUBLIC_PAGE) return;
  try {
    const data = await api('/notifications?unread_only=true', { silent: true });
    const n = (data.items || []).length;
    document.querySelectorAll('#notifBadge').forEach(el => {
      el.hidden = n === 0;
      el.textContent = n > 99 ? '99+' : n;
    });
  } catch (e) { /* 静默 */ }
}

// ── 全局搜索面板（院校 / 专业） ──
let _searchTimer = null;
function openGlobalSearch() {
  document.getElementById('globalSearch')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
  <div id="globalSearch" style="position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.45);padding-left:56px" onclick="if(event.target===this)this.remove()">
    <div class="gs-panel">
      <input id="gsInput" autofocus placeholder="搜索院校 / 专业 / 代码…（回车选第一个）" class="gs-input">
      <div id="gsResults" style="margin-top:12px;max-height:52vh;overflow:auto"></div>
    </div>
  </div>`);
  const input = document.getElementById('gsInput');
  input.focus();
  input.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => runGlobalSearch(input.value.trim()), 280);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('globalSearch')?.remove();
    if (e.key === 'Enter') document.querySelector('#gsResults a')?.click();
  });
}
async function runGlobalSearch(q) {
  const box = document.getElementById('gsResults');
  if (!box) return;
  if (!q) { box.innerHTML = ''; return; }
  box.innerHTML = '<div style="padding:14px;color:rgba(var(--brand-rgb),0.4);font-size:13px">搜索中…</div>';
  try {
    const r = await api(`/search?q=${encodeURIComponent(q)}`, { silent: true });
    const rows = [
      ...(r.schools || []).map(x => ({ href: `school.html?code=${x.code}`, t: x.name, s: `${x.tier || ''} · ${x.province || ''}${x.city ? ' ' + x.city : ''}`, k: '院校' })),
      ...(r.majors || []).map(x => ({ href: `school.html?major=${x.code}`, t: x.name, s: `${x.category || ''} · ${x.discipline_evaluation || '学科评估未知'}`, k: '专业' })),
    ];
    box.innerHTML = rows.length ? rows.map(x => `
      <a href="${x.href}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-decoration:none;color:rgba(var(--brand-rgb),0.85)" onmouseover="this.style.background='rgba(var(--brand-rgb),0.08)'" onmouseout="this.style.background='transparent'">
        <span style="font-size:11px;padding:2px 8px;border-radius:6px;background:rgba(var(--brand-rgb),0.10);color:rgba(var(--brand-rgb),0.55)">${x.k}</span>
        <span style="font-size:14px">${esc(x.t)}</span>
        <span style="margin-left:auto;font-size:12px;color:rgba(var(--brand-rgb),0.40)">${esc(x.s)}</span>
      </a>`).join('')
      : '<div style="padding:14px;color:rgba(var(--brand-rgb),0.4);font-size:13px">没有匹配结果</div>';
  } catch (e) {
    box.innerHTML = `<div style="padding:14px;color:#e8927c;font-size:13px">${esc(e.message)}</div>`;
  }
}

// ── 统一顶栏：所有内容页共用同一规格（无图标，纯文字按钮） ──
function pageHeader(title, actions = '', opts = {}) {
  const stage = opts.stage ? '<span class="ph-stage" data-stage>加载中…</span>' : '';
  const sub = opts.subId ? '<span class="ph-sub" id="phSub"></span>' : '';
  return `<header class="page-header" data-page-header>
    <div class="ph-left">
      <h1 class="ph-title">${title}</h1>
      ${sub}
    </div>
    <div class="ph-actions">${stage}${actions}</div>
  </header>`;
}
function mountHeader(title, actions = '', opts = {}) {
  const slot = document.querySelector('[data-header]');
  if (slot) slot.outerHTML = pageHeader(title, actions, opts);
}

// ── 全局设置浮层（PRD 模块 11：账号/LLM/通知/Agent 偏好/关于） ──
// 用户 BYOK 预设：选中厂家自动带出请求地址与可用模型
const LLM_USER_PROVIDERS = {
  deepseek: { label: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'], model: 'deepseek-chat' },
  qwen: { label: '通义千问 Qwen（百炼）', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-flash'], model: 'qwen-plus' },
  zhipu: { label: '智谱 GLM', base_url: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4.7-flash', 'glm-4.7', 'glm-5', 'glm-5.3'], model: 'glm-4.7-flash' },
  custom: { label: '自定义（OpenAI 兼容）', base_url: '', models: [], model: '' },
};

function settingsOverlayHtml() {
  return `
  <div class="settings-overlay" id="settingsOverlay">
    <div class="settings-panel">
      <button class="close-btn" onclick="closeSettings()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <h2>设置</h2>

      <div class="settings-group">
        <div class="settings-group-title">账号</div>
        <div class="settings-row">
          <div><div class="settings-row-label">当前账号</div>
            <div class="settings-row-desc" id="setAccountInfo">…</div></div>
          <button class="gy-btn danger-btn" style="padding:7px 14px;font-size:12px" onclick="logout()">退出登录</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">昵称</div>
            <div class="settings-row-desc">个人主页与报告中的称呼</div></div>
          <input class="gy-input2" id="setNickname" placeholder="如：林同学" maxlength="32">
        </div>
      </div>

      <div class="settings-group" id="msGroup">
        <div class="settings-group-title">模型服务</div>
        <div class="settings-row">
          <div><div class="settings-row-label">当前状态</div>
            <div class="settings-row-desc" id="msStatus">加载中…</div></div>
        </div>
        <div class="settings-row" style="display:block">
          <div class="settings-row-label" style="margin-bottom:4px">LLM Key</div>
          <div class="settings-row-desc" style="margin-bottom:10px">对话与报告优先走启用的 Key，不限次数；可保存多个，勾选启用哪一个</div>
          <div id="llmKeyList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px"></div>
          <div id="llmByokForm">
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <select class="gy-select" id="msProvider" onchange="msOnProviderChange()" style="flex:0 0 140px"></select>
              <input class="gy-input2" type="password" id="msApiKey" placeholder="API Key（sk-...）" autocomplete="off" style="flex:1">
            </div>
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <input class="gy-input2" id="msModel" list="msModelList" placeholder="模型（选供应商自动带出）" autocomplete="off" style="flex:1">
              <datalist id="msModelList"></datalist>
              <input class="gy-input2" id="msBaseUrl" placeholder="Base URL（自动填写）" autocomplete="off" style="flex:1">
            </div>
            <button class="gy-btn" style="width:100%;padding:9px 0;font-size:12px;font-weight:600;justify-content:center;display:flex;background:rgba(var(--brand-rgb),0.18);border-color:rgba(var(--brand-rgb),0.34)" onclick="saveMsKey()">添加 Key</button>
          </div>
        </div>
        <div class="settings-row" style="display:block;border-top:1px solid rgba(var(--brand-rgb),0.08);padding-top:14px;margin-top:6px">
          <div class="settings-row-label" style="margin-bottom:4px">搜索采集</div>
          <div class="settings-row-desc" style="margin-bottom:10px">每日免费 <b>1 次</b>（用站点 Key）；配自己的博查/Tavily Key → 不限次数，结果贡献公共库</div>
          <div id="searchKeyList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px"></div>
          <div id="searchByokForm">
            <div style="display:flex;gap:8px;margin-bottom:8px">
              <select class="gy-select" id="searchProvider" style="flex:0 0 120px">
                <option value="bocha">博查 Bocha</option>
                <option value="tavily">Tavily</option>
              </select>
              <input class="gy-input2" type="password" id="searchApiKey" placeholder="搜索 API Key（sk-...）" autocomplete="off" style="flex:1">
            </div>
            <div style="display:flex;gap:8px">
              <button class="gy-btn" style="flex:1;padding:9px 0;font-size:12px;font-weight:600;justify-content:center;display:flex" onclick="saveSearchKey()">保存搜索 Key</button>
              <button class="gy-btn" id="triggerSearchBtn" style="flex:1;padding:9px 0;font-size:12px;display:flex;justify-content:center" onclick="triggerSearchCollect()">立即采集</button>
            </div>
          </div>
          <div class="settings-row-desc" id="searchByokStatus" style="margin-top:7px">加载中…</div>
        </div>
        <div class="settings-row" style="display:block">
          <div class="settings-row-label" style="margin-bottom:8px">兑换码 · 补充平台算力次数</div>
          <div style="display:flex;gap:8px">
            <input class="gy-input2" id="msRedeemCode" placeholder="输入 GY- 开头的兑换码" style="flex:1">
            <button class="gy-btn" style="padding:9px 20px;font-size:12.5px;font-weight:600" onclick="redeemMsCode()">兑换</button>
          </div>
          <div class="settings-row-desc" style="margin-top:7px">可补充：报告 / 择校对话 / 自习室 / 自定义场景 / 搜索采集 / 社媒刷新次数</div>
        </div>
        <div class="llm-hint" id="msHint"></div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">平台授权（数据采集）</div>
        <div class="settings-row" style="display:block">
          <div class="settings-row-desc" style="margin-bottom:10px">扫码绑定你的社交账号，我们用<b>你自己的账号额度</b>每日为你采集目标院校的舆情数据（数据进公共库，记你的贡献）。不绑定也能用，每日有 <b>2 次</b>免费社媒刷新配额。Cookie 加密存储，可随时删除。</div>
          <div id="paList"><div style="font-size:12px;color:rgba(var(--brand-rgb),0.4)">加载中…</div></div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Agent 偏好</div>
        <div class="settings-row">
          <div><div class="settings-row-label">辩论模式默认开启</div>
            <div class="settings-row-desc">重大决策自动触发三视角辩论（需 LLM）</div></div>
          <label class="toggle"><input type="checkbox" id="setDebate"><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">分析深度</div></div>
          <select class="gy-select" id="setDepth">
            <option value="quick">快速</option>
            <option value="standard" selected>标准</option>
            <option value="deep">深度</option>
          </select>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">报告详细程度</div>
            <div class="settings-row-desc">生成报告时的个性化建议篇幅</div></div>
          <select class="gy-select" id="setReportDetail">
            <option value="brief">简洁</option>
            <option value="standard" selected>标准</option>
            <option value="detailed">详细</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">隐私设置</div>
        <div class="settings-row">
          <div><div class="settings-row-label">画像标签参与分析</div>
            <div class="settings-row-desc">关闭后 Agent 分析不读取你的画像与偏好</div></div>
          <label class="toggle"><input type="checkbox" id="setTagsParticipate" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">学习数据对 Agent 可见</div>
            <div class="settings-row-desc">自习室专注数据用于个性化建议</div></div>
          <label class="toggle"><input type="checkbox" id="setStudyVisible" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">对话特质挖掘</div>
            <div class="settings-row-desc">从择校对话中持续提炼你的偏好与关注点（生成带「挖掘」来源的标签）</div></div>
          <label class="toggle"><input type="checkbox" id="setTraitMining" checked><span class="toggle-slider"></span></label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">通知偏好</div>
        <div class="settings-row">
          <div><div class="settings-row-label">站内通知</div>
            <div class="settings-row-desc">关注院校热度变化 / 政策提醒</div></div>
          <label class="toggle"><input type="checkbox" id="setNotify" checked><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">热度变化阈值</div>
            <div class="settings-row-desc">关注院校讨论量环比超过该值时提醒</div></div>
          <select class="gy-select" id="setThreshold">
            <option value="0.10">10%</option>
            <option value="0.20" selected>20%</option>
            <option value="0.30">30%</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">数据管理</div>
        <div class="settings-row">
          <div><div class="settings-row-label">清空对话历史</div>
            <div class="settings-row-desc">删除全部 Agent 会话与消息，不可恢复</div></div>
          <button class="gy-btn" style="padding:7px 14px;font-size:12px" onclick="clearHistory()">清空</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">导出个人数据</div>
            <div class="settings-row-desc">画像 / 学习统计 / 报告 / 对话 打包为 JSON</div></div>
          <button class="gy-btn" style="padding:7px 14px;font-size:12px" onclick="exportData()">导出</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">关于</div>
        <div class="settings-row">
          <div class="settings-row-label">研屿 · 考研舆情分析与智能择校 <span class="llm-badge">v0.2.0</span></div>
        </div>
        <div class="settings-row">
          <div class="settings-row-desc">本产品基于互联网舆情数据和历史趋势，不构成报考建议。</div>
        </div>
      </div>

      <button class="settings-save-btn" onclick="saveSettings()">保存设置</button>
    </div>
  </div>`;
}

async function clearHistory() {
  if (!confirm('确定清空全部对话历史？此操作不可恢复。')) return;
  try {
    const r = await api('/agent/conversations', { method: 'DELETE' });
    toast(`已清空 ${r.cleared} 个会话`);
  } catch (e) { toast(e.message, 'err'); }
}

async function exportData() {
  try {
    const data = await api('/settings/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `研屿个人数据_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('个人数据已导出');
  } catch (e) { toast(e.message, 'err'); }
}

async function openSettings() {
  let overlay = document.getElementById('settingsOverlay');
  if (!overlay) {
    document.body.insertAdjacentHTML('beforeend', settingsOverlayHtml());
    overlay = document.getElementById('settingsOverlay');
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSettings(); });
  }
  overlay.classList.add('open');
  renderModelService();
  loadPlatformAuths();
  try {
    const me = USER || await api('/auth/me');
    document.getElementById('setNickname').value = me.nickname || '';
    document.getElementById('setAccountInfo').textContent =
      `${me.username}${me.nickname ? '（' + me.nickname + '）' : ''}`;
  } catch (e) { /* ignore */ }
  try {
    const pref = await api('/settings/pref/agent_pref');
    const v = pref.value || {};
    document.getElementById('setDebate').checked = !!v.debate_default;
    if (v.depth) document.getElementById('setDepth').value = v.depth;
    if (v.report_detail) document.getElementById('setReportDetail').value = v.report_detail;
  } catch (e) { /* ignore */ }
  try {
    const privacy = await api('/settings/pref/privacy');
    const pv = privacy.value || {};
    document.getElementById('setTagsParticipate').checked = pv.persona_tags_participate !== false;
    document.getElementById('setStudyVisible').checked = pv.study_data_visible !== false;
    document.getElementById('setTraitMining').checked = pv.trait_mining !== false;
  } catch (e) { /* ignore */ }
  try {
    const notify = await api('/settings/pref/notify');
    const v = notify.value || {};
    if (v.inapp !== undefined) document.getElementById('setNotify').checked = !!v.inapp;
    if (v.heat_threshold) document.getElementById('setThreshold').value = String(v.heat_threshold);
  } catch (e) { /* ignore */ }
}

function closeSettings() {
  document.getElementById('settingsOverlay')?.classList.remove('open');
}

// ── 模型服务（BYOK + 兑换码） ──
// 供应商预设由后台「模型渠道-供应商预设」管理，status 返回；此处仅作请求失败兜底
let MS_PRESETS = null;

function msPresets() { return MS_PRESETS || LLM_USER_PROVIDERS; }

function msFillProviderOptions(presets, selected) {
  const sel = document.getElementById('msProvider');
  if (!sel) return;
  sel.innerHTML = Object.entries(presets)
    .map(([id, p]) => `<option value="${esc(id)}">${esc(p.label || id)}</option>`).join('');
  if (selected && presets[selected]) sel.value = selected;
}

function msFillModelOptions(preset) {
  const dl = document.getElementById('msModelList');
  if (dl) dl.innerHTML = ((preset && preset.models) || [])
    .map(m => `<option value="${esc(m)}"></option>`).join('');
}

// 选供应商 = 自动填好 Base URL、常用模型下拉与默认模型（均可手动改）
function msOnProviderChange() {
  const p = msPresets()[document.getElementById('msProvider').value] || {};
  msFillModelOptions(p);
  document.getElementById('msModel').value = p.model || (p.models || [])[0] || '';
  document.getElementById('msBaseUrl').value = p.base_url || '';
}

function _msQuotaText(quotas) {
  const fmt = (label, s) => `${label} ${Math.max(0, s.limit - s.used)}/${s.limit}`;
  return [fmt('报告', quotas.report), fmt('择校对话', quotas.chat),
          fmt('自习室对话', quotas.study), fmt('自定义场景', quotas.template),
          fmt('搜索采集', quotas.search), fmt('社媒刷新', quotas.crawl)].join(' · ');
}

async function renderModelService() {
  const el = document.getElementById('msStatus');
  if (!el) return;
  let presets = LLM_USER_PROVIDERS;
  try {
    const st = await api('/model-service/status');
    window._lastModelStatus = st;
    if (st.presets && Object.keys(st.presets).length) {
      MS_PRESETS = st.presets;
      presets = st.presets;
    }
    msFillProviderOptions(presets);
    msOnProviderChange();
    if (st.mode === 'byok') {
      el.textContent = `自有 Key 生效中 · ${_msQuotaText(st.quotas)}`;
    } else {
      el.textContent = `平台公钥体验中 · ${_msQuotaText(st.quotas)}`;
    }
    el.title = _msQuotaText(st.quotas);
    renderLlmByok(st);
    renderSearchByok(st);
  } catch (e) {
    el.textContent = '状态加载失败';
    msFillProviderOptions(presets);
    msOnProviderChange();
  }
}

function renderLlmByok(st) {
  const list = document.getElementById('llmKeyList');
  if (!list) return;
  const keys = st.llm_keys || [];
  const presets = st.presets || {};
  const max = st.max_keys || 5;
  const atMax = keys.length >= max;

  // counter above list
  let counter = document.getElementById('llmKeyCounter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'llmKeyCounter';
    counter.style.cssText = 'font-size:11px;color:rgba(var(--brand-rgb),0.5);margin-bottom:6px';
    list.parentNode.insertBefore(counter, list);
  }
  counter.textContent = `已保存 ${keys.length}/${max} 个 Key`;

  // disable/enable add form
  const form = document.getElementById('llmByokForm');
  if (form) {
    form.style.opacity = atMax ? '0.4' : '1';
    form.style.pointerEvents = atMax ? 'none' : 'auto';
    if (atMax) form.title = `最多 ${max} 个，请先删除不用的 Key`;
    else form.title = '';
  }

  list.innerHTML = '';
  keys.forEach(k => {
    const label = (presets[k.provider] || {}).label || k.provider;
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(var(--brand-rgb),0.04);border:1px solid rgba(var(--brand-rgb),0.1);border-radius:10px;padding:12px 14px;position:relative;opacity:' + (k.is_active ? '1' : '0.5');
    card.innerHTML = `
      <button data-keyid="${k.id}" class="lk-del-btn" style="position:absolute;top:8px;right:8px;background:rgba(var(--brand-rgb),0.08);border:1px solid rgba(var(--brand-rgb),0.12);border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(var(--brand-rgb),0.5);transition:all 0.2s" title="删除">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-right:28px">
        <span style="font-size:12.5px;font-weight:600">${label} · ${esc(k.model)}</span>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:rgba(var(--brand-rgb),0.6)">
          <input type="checkbox" data-keyid="${k.id}" class="lk-toggle" ${k.is_active ? 'checked' : ''} style="accent-color:rgb(var(--brand-rgb))">
          ${k.is_active ? '已启用' : '已禁用'}
        </label>
      </div>
      <div style="font-size:11.5px;color:rgba(var(--brand-rgb),0.6);display:flex;flex-direction:column;gap:3px">
        <span>Key：<code style="font-family:ui-monospace,monospace;font-size:11px">${k.key_masked || '—'}</code></span>
        <span>端点：<code style="font-family:ui-monospace,monospace;font-size:11px">${k.base_url || '—'}</code></span>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.lk-del-btn').forEach(btn => {
    btn.onmouseover = () => { btn.style.background='rgba(239,68,68,0.12)'; btn.style.borderColor='rgba(239,68,68,0.25)'; btn.style.color='rgba(239,68,68,0.8)'; };
    btn.onmouseout = () => { btn.style.background='rgba(var(--brand-rgb),0.08)'; btn.style.borderColor='rgba(var(--brand-rgb),0.12)'; btn.style.color='rgba(var(--brand-rgb),0.5)'; };
    btn.onclick = () => deleteMsKey(btn.dataset.keyid);
  });
  list.querySelectorAll('.lk-toggle').forEach(cb => {
    cb.onchange = () => toggleMsKey(cb.dataset.keyid, cb.checked);
  });
}

async function saveMsKey() {
  const hint = document.getElementById('msHint');
  const body = {
    provider: document.getElementById('msProvider').value,
    base_url: document.getElementById('msBaseUrl').value.trim(),
    model: document.getElementById('msModel').value.trim(),
    api_key: document.getElementById('msApiKey').value.trim(),
  };
  if (!body.model) { hint.textContent = '请填写模型名（可下拉选择，或直接输入）'; hint.className = 'llm-hint err'; return; }
  if (!body.api_key) { hint.textContent = '请先填入 API Key'; hint.className = 'llm-hint err'; return; }
  try {
    const r = await api('/model-service/key', { method: 'PUT', body });
    hint.textContent = '已添加 LLM Key';
    hint.className = 'llm-hint ok';
    document.getElementById('msApiKey').value = '';
    renderModelService();
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

async function deleteMsKey(keyId) {
  const hint = document.getElementById('msHint');
  try {
    const r = await api(`/model-service/key/${keyId}`, { method: 'DELETE' });
    hint.textContent = '已删除 LLM Key';
    hint.className = 'llm-hint ok';
    renderModelService();
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

async function toggleMsKey(keyId, isActive) {
  const hint = document.getElementById('msHint');
  try {
    await api(`/model-service/key/${keyId}`, { method: 'PATCH',
      body: { is_active: isActive } });
    renderModelService();
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

async function redeemMsCode() {
  const hint = document.getElementById('msHint');
  const code = document.getElementById('msRedeemCode').value.trim();
  if (!code) { hint.textContent = '请输入兑换码'; hint.className = 'llm-hint err'; return; }
  try {
    const r = await api('/model-service/redeem', { method: 'POST', body: { code } });
    const g = r.granted;
    const parts = [];
    if (g.report) parts.push(`报告 +${g.report}`);
    if (g.chat) parts.push(`择校对话 +${g.chat}`);
    if (g.study) parts.push(`自习室 +${g.study}`);
    if (g.template) parts.push(`自定义场景 +${g.template}`);
    if (g.search) parts.push(`搜索采集 +${g.search}`);
    if (g.crawl) parts.push(`社媒刷新 +${g.crawl}`);
    hint.textContent = `兑换成功：${parts.join(' · ') || '已到账'}`;
    hint.className = 'llm-hint ok';
    document.getElementById('msRedeemCode').value = '';
    renderModelService();
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

// ── 搜索 BYOK ────────────────────────────────────────────────────────────────

function renderSearchByok(st) {
  const list = document.getElementById('searchKeyList');
  const status = document.getElementById('searchByokStatus');
  const keys = st.search_keys || [];
  const presets = st.search_presets || {};
  const quotas = st.quotas || {};
  const searchQ = quotas.search || {};
  const configuredProviders = new Set(keys.map(k => k.provider));
  const allConfigured = Object.keys(presets).length > 0 && Object.keys(presets).every(p => configuredProviders.has(p));

  // counter: per-provider status
  let counter = document.getElementById('searchKeyCounter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'searchKeyCounter';
    counter.style.cssText = 'font-size:11px;color:rgba(var(--brand-rgb),0.5);margin-bottom:6px';
    list.parentNode.insertBefore(counter, list);
  }
  const providerStatus = Object.keys(presets).map(p => {
    const label = presets[p].label || p;
    return configuredProviders.has(p) ? `${label} ✓` : `${label} 未配置`;
  });
  counter.textContent = providerStatus.join(' · ');

  // disable add form when all providers configured, or disable individual options
  const form = document.getElementById('searchByokForm');
  if (form) {
    const providerSelect = form.querySelector('#searchProvider');
    const apiKeyInput = form.querySelector('#searchApiKey');
    const saveBtn = form.querySelector('button[onclick="saveSearchKey()"]');
    if (providerSelect) {
      Array.from(providerSelect.options).forEach(opt => {
        opt.disabled = configuredProviders.has(opt.value);
      });
    }
    if (allConfigured) {
      if (apiKeyInput) apiKeyInput.disabled = true;
      if (saveBtn) { saveBtn.disabled = true; saveBtn.title = '所有供应商已配置'; }
    } else {
      if (apiKeyInput) apiKeyInput.disabled = false;
      if (saveBtn) { saveBtn.disabled = false; saveBtn.title = ''; }
    }
  }

  list.innerHTML = '';
  keys.forEach(k => {
    const label = (presets[k.provider] || {}).label || k.provider;
    const card = document.createElement('div');
    card.style.cssText = 'background:rgba(var(--brand-rgb),0.04);border:1px solid rgba(var(--brand-rgb),0.1);border-radius:10px;padding:12px 14px;position:relative;opacity:' + (k.is_active ? '1' : '0.5');
    card.innerHTML = `
      <button data-keyid="${k.id}" class="sk-del-btn" style="position:absolute;top:8px;right:8px;background:rgba(var(--brand-rgb),0.08);border:1px solid rgba(var(--brand-rgb),0.12);border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(var(--brand-rgb),0.5);transition:all 0.2s" title="删除">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;padding-right:28px">
        <span style="font-size:12.5px;font-weight:600">${label}</span>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:rgba(var(--brand-rgb),0.6)">
          <input type="checkbox" data-keyid="${k.id}" class="sk-toggle" ${k.is_active ? 'checked' : ''} style="accent-color:rgb(var(--brand-rgb))">
          ${k.is_active ? '已启用' : '已禁用'}
        </label>
      </div>
      <div style="font-size:11.5px;color:rgba(var(--brand-rgb),0.6);display:flex;flex-direction:column;gap:3px">
        <span>Key：<code style="font-family:ui-monospace,monospace;font-size:11px">${k.key_masked || '—'}</code></span>
        <span>端点：<code style="font-family:ui-monospace,monospace;font-size:11px">${k.base_url || '—'}</code></span>
      </div>
    `;
    list.appendChild(card);
  });

  // hover effect for delete buttons
  list.querySelectorAll('.sk-del-btn').forEach(btn => {
    btn.onmouseover = () => { btn.style.background='rgba(239,68,68,0.12)'; btn.style.borderColor='rgba(239,68,68,0.25)'; btn.style.color='rgba(239,68,68,0.8)'; };
    btn.onmouseout = () => { btn.style.background='rgba(var(--brand-rgb),0.08)'; btn.style.borderColor='rgba(var(--brand-rgb),0.12)'; btn.style.color='rgba(var(--brand-rgb),0.5)'; };
    btn.onclick = () => deleteSearchKey(btn.dataset.keyid);
  });
  // toggle handlers
  list.querySelectorAll('.sk-toggle').forEach(cb => {
    cb.onchange = () => toggleSearchKey(cb.dataset.keyid, cb.checked);
  });

  if (keys.length > 0) {
    const activeCount = keys.filter(k => k.is_active).length;
    status.textContent = `已配置 ${keys.length} 个搜索 Key，${activeCount} 个启用中（一起跑）`;
    status.className = 'llm-hint ok';
  } else {
    const used = searchQ.used || 0, limit = searchQ.limit || 1;
    if (used >= limit) {
      status.textContent = `今日免费次数已用完（${used}/${limit}），明天重置`;
      status.className = 'llm-hint err';
    } else {
      status.textContent = `今日剩余 ${limit - used}/${limit} 次免费`;
      status.className = '';
    }
  }
}

async function saveSearchKey() {
  const hint = document.getElementById('searchByokHint') || document.getElementById('searchByokStatus');
  if (!hint) return;
  const provider = document.getElementById('searchProvider')?.value;
  const apiKey = document.getElementById('searchApiKey')?.value?.trim();
  if (!provider || !apiKey) { hint.textContent = '请选择供应商并填入 API Key'; hint.className = 'llm-hint err'; return; }
  try {
    const r = await api('/model-service/search-key', { method: 'PUT',
      body: { provider, api_key: apiKey } });
    hint.textContent = '已添加搜索 Key';
    hint.className = 'llm-hint ok';
    document.getElementById('searchApiKey').value = '';
    renderSearchByok(r.status);
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

async function deleteSearchKey(keyId) {
  const hint = document.getElementById('searchByokHint') || document.getElementById('searchByokStatus');
  if (!hint) return;
  try {
    const r = await api(`/model-service/search-key/${keyId}`, { method: 'DELETE' });
    hint.textContent = '已删除搜索 Key';
    hint.className = 'llm-hint ok';
    renderSearchByok(r.status);
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

async function toggleSearchKey(keyId, isActive) {
  const hint = document.getElementById('searchByokHint') || document.getElementById('searchByokStatus');
  if (!hint) return;
  try {
    const r = await api(`/model-service/search-key/${keyId}`, { method: 'PATCH',
      body: { is_active: isActive } });
    renderSearchByok(r.status);
  } catch (e) { hint.textContent = e.message; hint.className = 'llm-hint err'; }
}

async function triggerSearchCollect() {
  const btn = document.getElementById('triggerSearchBtn');
  if (btn) { btn.disabled = true; btn.textContent = '采集中…'; }
  try {
    const r = await api('/model-service/search', { method: 'POST' });
    toast(`搜索采集完成：新增 ${r.new_rows || 0} 条，导入 ${r.import?.imported || 0} 条`);
  } catch (e) { toast(e.message, 'err'); }
  if (btn) { btn.disabled = false; btn.textContent = '立即采集'; }
}

async function saveSettings() {
  try {
    const nickname = document.getElementById('setNickname').value.trim();
    if (nickname) await api('/auth/me', { method: 'PUT', body: { nickname } });
    await api('/settings/pref/agent_pref', { method: 'PUT', body: { value: {
      debate_default: document.getElementById('setDebate').checked,
      depth: document.getElementById('setDepth').value,
      report_detail: document.getElementById('setReportDetail').value,
    }}});
    await api('/settings/pref/notify', { method: 'PUT', body: { value: {
      inapp: document.getElementById('setNotify').checked,
      heat_threshold: parseFloat(document.getElementById('setThreshold').value),
    }}});
    await api('/settings/pref/privacy', { method: 'PUT', body: { value: {
      persona_tags_participate: document.getElementById('setTagsParticipate').checked,
      study_data_visible: document.getElementById('setStudyVisible').checked,
      trait_mining: document.getElementById('setTraitMining').checked,
    }}});
    // 主题偏好跨设备存储
    await api('/settings/pref/theme', { method: 'PUT', body: { value: {
      theme: localStorage.getItem('gy_theme') || 'dark',
    }}});
    toast('设置已保存，Agent 下一次分析即使用新配置');
    closeSettings();
  } catch (e) { toast(e.message, 'err'); }
}

// ── 平台授权（扫码采集） ──
const PA_LABELS = { zhihu: '知乎', xhs: '小红书', tieba: '贴吧', douyin: '抖音', wb: '微博', bili: 'B站' };
let _paPollTimer = null;

async function loadPlatformAuths() {
  const box = document.getElementById('paList');
  if (!box) return;
  try {
    const r = await api('/platform-auth');
    box.innerHTML = r.items.map(i => `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(var(--brand-rgb),0.05)">
        <span style="width:44px;font-size:13px">${PA_LABELS[i.platform]}</span>
        <span style="flex:1;font-size:11.5px;color:${i.configured ? 'var(--accent)' : 'rgba(var(--brand-rgb),0.35)'}">
          ${i.configured ? `已授权（${i.status === 'active' ? '有效' : '疑似过期'}）` : '未授权'}
        </span>
        <button class="gy-btn" style="padding:4px 12px;font-size:11px" onclick="paScan('${i.platform}')">${i.configured ? '重新扫码' : '扫码授权'}</button>
        ${i.configured ? `<button class="gy-btn danger-btn" style="padding:4px 10px;font-size:11px" onclick="paDelete('${i.platform}')">删除</button>` : ''}
      </div>`).join('');
  } catch (e) { box.innerHTML = `<span style="font-size:12px;color:#e8927c">${e.message}</span>`; }
}

async function paScan(platform) {
  // 复用设置浮层容器弹扫码框
  let box = document.getElementById('paQrModal');
  if (!box) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="paQrModal" style="position:fixed;inset:0;z-index:700;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center">
        <div style="width:300px;background:rgba(var(--panel-rgb),0.98);border:1px solid rgba(var(--brand-rgb),0.15);border-radius:16px;padding:22px;text-align:center">
          <h3 style="font-size:15px;margin-bottom:8px" id="paQrTitle">扫码授权</h3>
          <div style="font-size:11.5px;color:rgba(var(--brand-rgb),0.45);margin-bottom:12px">打开手机 App 扫一扫，授权后 Cookie 加密存储</div>
          <div style="width:200px;height:200px;margin:0 auto;background:rgba(var(--brand-rgb),0.05);border-radius:10px;display:flex;align-items:center;justify-content:center" id="paQrImgBox">
            <span style="font-size:12px;color:rgba(var(--brand-rgb),0.4)">正在生成二维码…</span>
          </div>
          <div style="font-size:11px;color:rgba(var(--brand-rgb),0.4);margin-top:10px" id="paQrTip">二维码 3 分钟内有效</div>
          <button class="gy-btn" style="margin-top:12px;padding:6px 18px;font-size:12px" onclick="paCancelScan()">取消</button>
        </div>
      </div>`);
  }
  document.getElementById('paQrModal').style.display = 'flex';
  document.getElementById('paQrImgBox').innerHTML = '<span style="font-size:12px;color:rgba(var(--brand-rgb),0.4)">正在生成二维码…</span>';
  document.getElementById('paQrTitle').textContent = `扫码授权${PA_LABELS[platform]}`;
  try {
    const r = await api(`/platform-auth/${platform}/qr`, { method: 'POST' });
    const sid = r.sid;
    const deadline = Date.now() + 200 * 1000;
    clearInterval(_paPollTimer);
    const poll = async () => {
      if (!document.getElementById('paQrModal') || document.getElementById('paQrModal').style.display === 'none') { clearInterval(_paPollTimer); return; }
      if (Date.now() > deadline) { paCancelScan(); toast('二维码超时，请重新扫码', 'err'); return; }
      try {
        const st = await api(`/platform-auth/qr/${sid}`);
        if (st.qr_image) {
          document.getElementById('paQrImgBox').innerHTML = `<img src="${st.qr_image}" style="width:190px;height:190px">`;
        }
        if (st.status === 'confirmed') {
          clearInterval(_paPollTimer);
          document.getElementById('paQrImgBox').innerHTML = '<span style="font-size:26px">✅</span>';
          document.getElementById('paQrTip').textContent = '授权成功！每日将自动为你更新数据';
          setTimeout(() => { paCancelScan(); loadPlatformAuths(); }, 1200);
          return;
        }
        if (st.status === 'failed' || st.status === 'timeout') {
          clearInterval(_paPollTimer);
          document.getElementById('paQrTip').textContent = (st.status === 'timeout' ? '二维码超时' : '出码失败') + '，点击刷新重试';
        }
      } catch (e) { /* 网络抖动忽略 */ }
    };
    await poll();
    _paPollTimer = setInterval(poll, 2500);
  } catch (e) {
    document.getElementById('paQrImgBox').innerHTML = `<span style="font-size:12px;color:#e8927c;padding:8px">${e.message}</span>`;
  }
}

function paCancelScan() {
  const m = document.getElementById('paQrModal');
  if (m) m.style.display = 'none';
  clearInterval(_paPollTimer);
  loadPlatformAuths();
}

async function paDelete(platform) {
  if (!confirm(`确定删除${PA_LABELS[platform]}授权？删除后该平台数据不再为你更新`)) return;
  try { await api(`/platform-auth/${platform}`, { method: 'DELETE' }); toast('已删除'); loadPlatformAuths(); }
  catch (e) { toast(e.message, 'err'); }
}

// ── 首次登录：引导配置自有 API Key（BYOK）──
const _PROVIDER_LINKS = {
  deepseek: { label: 'DeepSeek', url: 'https://platform.deepseek.com/' },
  qwen:     { label: '通义千问（百炼）', url: 'https://bailian.console.aliyun.com/' },
  zhipu:    { label: '智谱 GLM', url: 'https://open.bigmodel.cn/' },
  bocha:    { label: '博查 Bocha', url: 'https://bochaai.com/' },
  tavily:   { label: 'Tavily', url: 'https://tavily.com/' },
};

async function maybeModelOnboarding() {
  if (localStorage.getItem('gy_model_onboard')) return;
  let st;
  try { st = await api('/model-service/status'); window._lastModelStatus = st; } catch (e) { return; }
  if ((st.llm_keys || []).length || (st.search_keys || []).length) return;
  const presets = st.presets || {};
  const searchPresets = st.search_presets || {};
  const llmItems = Object.entries(presets)
    .filter(([k]) => k !== 'custom')
    .map(([k, v]) => {
      const link = _PROVIDER_LINKS[k];
      const href = link ? link.url : '#';
      return `<a href="${href}" target="_blank" rel="noopener" style="color:rgba(var(--brand-rgb),0.7);text-decoration:underline;font-size:12px">${link ? link.label : v.label || k}</a>`;
    });
  const searchItems = Object.entries(searchPresets)
    .map(([k, v]) => {
      const link = _PROVIDER_LINKS[k];
      const href = link ? link.url : '#';
      return `<a href="${href}" target="_blank" rel="noopener" style="color:rgba(var(--brand-rgb),0.7);text-decoration:underline;font-size:12px">${link ? link.label : v.label || k}</a>`;
    });
  document.body.insertAdjacentHTML('beforeend', `
    <div id="modelOnboard" style="position:fixed;inset:0;z-index:660;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
      <div style="width:min(440px,calc(100vw - 32px));background:rgba(var(--panel-rgb),0.98);border:1px solid rgba(var(--brand-rgb),0.15);border-radius:18px;padding:28px 30px">
        <h3 style="font-family:ui-serif,Georgia,'Noto Serif SC',serif;font-size:17px;margin-bottom:6px">配置自有 API Key，解锁无限额度</h3>
        <p style="font-size:12.5px;color:rgba(var(--brand-rgb),0.55);line-height:1.8;margin-bottom:14px">
          研屿内置额度适合轻度体验。配置你自己的 API Key 后，<b>调用次数不受限</b>，
          数据全程走你的账户，更安全也更灵活。</p>
        <div style="margin-bottom:12px">
          <div style="font-size:11px;color:rgba(var(--brand-rgb),0.4);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">LLM 模型</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${llmItems.join('')}</div>
        </div>
        <div style="margin-bottom:18px">
          <div style="font-size:11px;color:rgba(var(--brand-rgb),0.4);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">搜索 API</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${searchItems.join('')}</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="gy-btn" style="padding:8px 16px;font-size:12px" onclick="modelOnboardSkip()">稍后再说</button>
          <button class="gy-btn" style="padding:8px 18px;font-size:12px;font-weight:600;background:rgba(var(--brand-rgb),0.88);color:rgb(var(--bg-rgb));border:none;border-radius:8px;cursor:pointer" onclick="modelOnboardGo()">去配置</button>
        </div>
      </div>
    </div>`);
}

function modelOnboardSkip() {
  localStorage.setItem('gy_model_onboard', 'done');
  document.getElementById('modelOnboard')?.remove();
}

function modelOnboardGo() {
  localStorage.setItem('gy_model_onboard', 'done');
  document.getElementById('modelOnboard')?.remove();
  try { openSettings(); } catch (e) { /* ignore */ }
}

// ── 402 额度用尽：弹窗引导配置 Key ──
function showQuotaExhaustedModal(detail) {
  if (document.getElementById('quotaExhaustedModal')) return;
  const presets = (window._lastModelStatus && window._lastModelStatus.presets) || {};
  const searchPresets = (window._lastModelStatus && window._lastModelStatus.search_presets) || {};
  const llmLinks = Object.entries(presets)
    .filter(([k]) => k !== 'custom')
    .map(([k, v]) => {
      const link = _PROVIDER_LINKS[k];
      return `<a href="${link ? link.url : '#'}" target="_blank" rel="noopener" style="color:rgba(var(--brand-rgb),0.7);text-decoration:underline;font-size:12px">${link ? link.label : v.label || k}</a>`;
    });
  const searchLinks = Object.entries(searchPresets)
    .map(([k, v]) => {
      const link = _PROVIDER_LINKS[k];
      return `<a href="${link ? link.url : '#'}" target="_blank" rel="noopener" style="color:rgba(var(--brand-rgb),0.7);text-decoration:underline;font-size:12px">${link ? link.label : v.label || k}</a>`;
    });
  document.body.insertAdjacentHTML('beforeend', `
    <div id="quotaExhaustedModal" style="position:fixed;inset:0;z-index:670;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
      <div style="width:min(420px,calc(100vw - 32px));background:rgba(var(--panel-rgb),0.98);border:1px solid rgba(var(--brand-rgb),0.15);border-radius:18px;padding:26px 28px">
        <h3 style="font-family:ui-serif,Georgia,'Noto Serif SC',serif;font-size:16px;margin-bottom:6px">体验额度已用完</h3>
        <p style="font-size:12.5px;color:rgba(var(--brand-rgb),0.55);line-height:1.8;margin-bottom:14px">
          ${detail || '当前内置额度已耗尽，配置自有 Key 或输入兑换码即可继续使用。'}
        </p>
        <div style="margin-bottom:10px">
          <div style="font-size:11px;color:rgba(var(--brand-rgb),0.4);margin-bottom:5px">LLM Key 获取</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${llmLinks.join('') || '<span style="font-size:12px;color:rgba(var(--brand-rgb),0.4)">暂无</span>'}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-size:11px;color:rgba(var(--brand-rgb),0.4);margin-bottom:5px">搜索 Key 获取</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${searchLinks.join('') || '<span style="font-size:12px;color:rgba(var(--brand-rgb),0.4)">暂无</span>'}</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="gy-btn" style="padding:8px 14px;font-size:12px" onclick="document.getElementById('quotaExhaustedModal')?.remove()">关闭</button>
          <button class="gy-btn" style="padding:8px 18px;font-size:12px;font-weight:600;background:rgba(var(--brand-rgb),0.88);color:rgb(var(--bg-rgb));border:none;border-radius:8px;cursor:pointer" onclick="document.getElementById('quotaExhaustedModal')?.remove();openSettings()">去配置 Key</button>
        </div>
      </div>
    </div>`);
}

// ── 首次登录：选择数据平台 + 逐个扫码 ──
let _paQueue = [];
async function maybePlatformOnboarding() {
  if (localStorage.getItem('gy_pa_onboard')) return;
  let items;
  try { items = (await api('/platform-auth')).items; } catch (e) { return; }
  if (items.some(i => i.configured)) return; // 已有授权不再打扰
  document.body.insertAdjacentHTML('beforeend', `
    <div id="paOnboard" style="position:fixed;inset:0;z-index:650;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
      <div style="width:min(430px,calc(100vw - 32px));background:rgba(var(--panel-rgb),0.98);border:1px solid rgba(var(--brand-rgb),0.15);border-radius:18px;padding:26px 28px">
        <h3 style="font-family:ui-serif,Georgia,'Noto Serif SC',serif;font-size:17px;margin-bottom:8px">选择你想从哪些平台拿数据</h3>
        <p style="font-size:12px;color:rgba(var(--brand-rgb),0.5);line-height:1.8;margin-bottom:14px">
          扫码绑定后，我们每天用<b>你自己的账号额度</b>自动采集你目标院校的舆情（不占站点额度），
          数据也会反哺公共库让所有人受益。全部可跳过，稍后在 设置-平台授权 里补配。</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px" id="paPick">
          ${Object.entries(PA_LABELS).map(([k, v]) => `
            <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid rgba(var(--brand-rgb),0.12);border-radius:10px;cursor:pointer;font-size:13px" class="pa-pick">
              <input type="checkbox" value="${k}" style="accent-color:#6db3a3">${v}
            </label>`).join('')}
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="gy-btn" style="padding:8px 16px;font-size:12px" onclick="paOnboardSkip()">暂不配置</button>
          <button class="gy-btn" style="padding:8px 18px;font-size:12px;font-weight:600;background:rgba(var(--brand-rgb),0.88);color:rgb(var(--bg-rgb));border:none;border-radius:8px;cursor:pointer" onclick="paOnboardGo()">去扫码授权</button>
        </div>
      </div>
    </div>`);
}

function paOnboardSkip() {
  localStorage.setItem('gy_pa_onboard', 'done');
  document.getElementById('paOnboard')?.remove();
}

function paOnboardGo() {
  const picked = [...document.querySelectorAll('#paPick input:checked')].map(i => i.value);
  if (!picked.length) { toast('至少选择一个平台，或点「暂不配置」', 'err'); return; }
  localStorage.setItem('gy_pa_onboard', 'done');
  document.getElementById('paOnboard')?.remove();
  _paQueue = picked.slice();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="paOnboard" style="position:fixed;inset:0;z-index:650;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center">
      <div style="width:min(380px,calc(100vw - 32px));background:rgba(var(--panel-rgb),0.98);border:1px solid rgba(var(--brand-rgb),0.15);border-radius:18px;padding:26px 28px;text-align:center">
        <h3 style="font-size:16px;margin-bottom:8px">逐个完成扫码</h3>
        <div id="paQueueTip" style="font-size:12.5px;color:rgba(var(--brand-rgb),0.6);margin-bottom:12px">准备开始…</div>
        <div style="font-size:11px;color:rgba(var(--brand-rgb),0.4)">每平台约 30 秒 · Cookie 加密存储 · 可随时删除</div>
        <div style="margin-top:14px"><button class="gy-btn" style="padding:6px 16px;font-size:12px" onclick="paOnboardSkip()">跳过剩余</button></div>
      </div>
    </div>`);
  _paNextScan();
}

function _paNextScan() {
  const next = _paQueue.shift();
  if (!next) { paOnboardSkip(); toast('授权完成！每日将自动为你更新目标院校数据'); return; }
  const tip = document.getElementById('paQueueTip');
  if (tip) tip.textContent = `还剩 ${_paQueue.length + 1} 个平台 · 当前：${PA_LABELS[next]}`;
  const origin = paCancelScan;
  paCancelScan = function () { origin.call(); paCancelScan = origin; _paNextScan(); };
  paScan(next);
}
