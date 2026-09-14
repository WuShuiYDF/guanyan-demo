/**
 * 研屿 Demo - Mock API Layer
 * Overrides window.fetch to intercept /api/* calls and return hardcoded data.
 * Drop-in replacement for the real backend - no server needed.
 */
(function () {
  'use strict';

  // ── Realistic mock data ──────────────────────────────────────────────

  const DEMO_USER = {
    id: 1, username: 'demo', nickname: '林同学', email: 'demo@yanguan.isle',
    is_admin: true, created_at: '2025-09-01T08:00:00Z',
    theme: 'dark', avatar_url: null,
  };

  const MOCK_USERS = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    nickname: ['张同学','李同学','王同学','赵同学','刘同学','陈同学','杨同学','黄同学','周同学','吴同学',
               '孙同学','郑同学','马同学','朱同学','胡同学','林同学','何同学','高同学','梁同学','宋同学',
               '谢同学','唐同学','韩同学','冯同学','邓同学','曹同学','彭同学','曾同学','萧同学','田同学'][i],
    email: `user${i + 1}@example.com`,
    is_admin: i === 0,
    created_at: new Date(2025, 8, 1 + i).toISOString(),
    has_byok: i % 3 === 0,
    status: 'active',
  }));

  const SCHOOLS = [
    { code: '10001', name: '北京大学', tier: '985', province: '北京', city: '北京' },
    { code: '10002', name: '中国人民大学', tier: '985', province: '北京', city: '北京' },
    { code: '10003', name: '清华大学', tier: '985', province: '北京', city: '北京' },
    { code: '10006', name: '北京航空航天大学', tier: '985', province: '北京', city: '北京' },
    { code: '10007', name: '北京理工大学', tier: '985', province: '北京', city: '北京' },
    { code: '10010', name: '北京师范大学', tier: '985', province: '北京', city: '北京' },
    { code: '10027', name: '北京师范大学', tier: '985', province: '北京', city: '北京' },
    { code: '10055', name: '南开大学', tier: '985', province: '天津', city: '天津' },
    { code: '10056', name: '天津大学', tier: '985', province: '天津', city: '天津' },
    { code: '10145', name: '东北大学', tier: '985', province: '辽宁', city: '沈阳' },
    { code: '10183', name: '吉林大学', tier: '985', province: '吉林', city: '长春' },
    { code: '10246', name: '复旦大学', tier: '985', province: '上海', city: '上海' },
    { code: '10248', name: '上海交通大学', tier: '985', province: '上海', city: '上海' },
    { code: '10269', name: '华东师范大学', tier: '985', province: '上海', city: '上海' },
    { code: '10284', name: '南京大学', tier: '985', province: '江苏', city: '南京' },
    { code: '10286', name: '东南大学', tier: '985', province: '江苏', city: '南京' },
    { code: '10335', name: '浙江大学', tier: '985', province: '浙江', city: '杭州' },
    { code: '10358', name: '中国科学技术大学', tier: '985', province: '安徽', city: '合肥' },
    { code: '10384', name: '厦门大学', tier: '985', province: '福建', city: '厦门' },
    { code: '10422', name: '山东大学', tier: '985', province: '山东', city: '济南' },
    { code: '10486', name: '武汉大学', tier: '985', province: '湖北', city: '武汉' },
    { code: '10487', name: '华中科技大学', tier: '985', province: '湖北', city: '武汉' },
    { code: '10533', name: '中南大学', tier: '985', province: '湖南', city: '长沙' },
    { code: '10558', name: '中山大学', tier: '985', province: '广东', city: '广州' },
    { code: '10561', name: '华南理工大学', tier: '985', province: '广东', city: '广州' },
    { code: '10610', name: '四川大学', tier: '985', province: '四川', city: '成都' },
    { code: '10614', name: '电子科技大学', tier: '985', province: '四川', city: '成都' },
    { code: '10698', name: '西安交通大学', tier: '985', province: '陕西', city: '西安' },
    { code: '10730', name: '兰州大学', tier: '985', province: '甘肃', city: '兰州' },
    { code: '10004', name: '北京交通大学', tier: '211', province: '北京', city: '北京' },
    { code: '10005', name: '北京工业大学', tier: '211', province: '北京', city: '北京' },
    { code: '10008', name: '北京科技大学', tier: '211', province: '北京', city: '北京' },
    { code: '10022', name: '北京化工大学', tier: '211', province: '北京', city: '北京' },
    { code: '10034', name: '中央财经大学', tier: '211', province: '北京', city: '北京' },
    { code: '10043', name: '对外经济贸易大学', tier: '211', province: '北京', city: '北京' },
    { code: '10053', name: '中国政法大学', tier: '211', province: '北京', city: '北京' },
    { code: '10079', name: '华北电力大学', tier: '211', province: '北京', city: '北京' },
    { code: '10213', name: '哈尔滨工业大学', tier: '985', province: '黑龙江', city: '哈尔滨' },
    { code: '10255', name: '东华大学', tier: '211', province: '上海', city: '上海' },
    { code: '10294', name: '河海大学', tier: '211', province: '江苏', city: '南京' },
    { code: '10300', name: '南京信息工程大学', tier: 'double-first-class', province: '江苏', city: '南京' },
    { code: '10359', name: '合肥工业大学', tier: '211', province: '安徽', city: '合肥' },
    { code: '10386', name: '福州大学', tier: '211', province: '福建', city: '福州' },
    { code: '10459', name: '郑州大学', tier: '211', province: '河南', city: '郑州' },
    { code: '10497', name: '武汉理工大学', tier: '211', province: '湖北', city: '武汉' },
    { code: '10532', name: '湖南大学', tier: '985', province: '湖南', city: '长沙' },
    { code: '10564', name: '华南农业大学', tier: 'double-first-class', province: '广东', city: '广州' },
    { code: '10613', name: '西南交通大学', tier: '211', province: '四川', city: '成都' },
    { code: '10651', name: '西南财经大学', tier: '211', province: '四川', city: '成都' },
    { code: '10699', name: '西北工业大学', tier: '985', province: '陕西', city: '西安' },
    { code: '10755', name: '新疆大学', tier: '211', province: '新疆', city: '乌鲁木齐' },
  ];

  const MAJORS = [
    { code: '0812', name: '计算机科学与技术', category: '工学', discipline_evaluation: 'A+' },
    { code: '0835', name: '软件工程', category: '工学', discipline_evaluation: 'A' },
    { code: '0810', name: '信息与通信工程', category: '工学', discipline_evaluation: 'A+' },
    { code: '0808', name: '电气工程', category: '工学', discipline_evaluation: 'A+' },
    { code: '0814', name: '土木工程', category: '工学', discipline_evaluation: 'A-' },
    { code: '0202', name: '应用经济学', category: '经济学', discipline_evaluation: 'A' },
    { code: '0301', name: '法学', category: '法学', discipline_evaluation: 'A+' },
    { code: '0501', name: '中国语言文学', category: '文学', discipline_evaluation: 'A+' },
    { code: '0701', name: '数学', category: '理学', discipline_evaluation: 'A+' },
    { code: '0702', name: '物理学', category: '理学', discipline_evaluation: 'A' },
    { code: '0809', name: '电子科学与技术', category: '工学', discipline_evaluation: 'A' },
    { code: '0811', name: '控制科学与工程', category: '工学', discipline_evaluation: 'A+' },
    { code: '0813', name: '建筑学', category: '工学', discipline_evaluation: 'A-' },
    { code: '1002', name: '临床医学', category: '医学', discipline_evaluation: 'A+' },
    { code: '1202', name: '工商管理', category: '管理学', discipline_evaluation: 'A+' },
    { code: '0401', name: '教育学', category: '教育学', discipline_evaluation: 'A+' },
    { code: '0502', name: '外国语言文学', category: '文学', discipline_evaluation: 'A' },
    { code: '0801', name: '力学', category: '工学', discipline_evaluation: 'A' },
    { code: '0802', name: '机械工程', category: '工学', discipline_evaluation: 'A+' },
    { code: '0807', name: '动力工程及工程热物理', category: '工学', discipline_evaluation: 'A' },
    { code: '0831', name: '生物医学工程', category: '工学', discipline_evaluation: 'A-' },
    { code: '0901', name: '作物学', category: '农学', discipline_evaluation: 'A+' },
    { code: '1204', name: '公共管理', category: '管理学', discipline_evaluation: 'A' },
    { code: '1305', name: '设计学', category: '艺术学', discipline_evaluation: 'A' },
    { code: '0854', name: '电子信息（专硕）', category: '工学', discipline_evaluation: '' },
    { code: '0855', name: '机械（专硕）', category: '工学', discipline_evaluation: '' },
    { code: '0856', name: '材料与化工（专硕）', category: '工学', discipline_evaluation: '' },
    { code: '0857', name: '资源与环境（专硕）', category: '工学', discipline_evaluation: '' },
    { code: '0858', name: '能源动力（专硕）', category: '工学', discipline_evaluation: '' },
    { code: '0859', name: '土木水利（专硕）', category: '工学', discipline_evaluation: '' },
  ];

  // Generate heat-overview time series
  function genHeatOverview(days) {
    const data = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toISOString().slice(0, 10),
        discussion: Math.floor(800 + Math.random() * 400),
        total_posts: Math.floor(800 + Math.random() * 400),
        unique_users: Math.floor(200 + Math.random() * 150),
        sentiment_pos: +(0.35 + Math.random() * 0.15).toFixed(3),
        sentiment_neg: +(0.15 + Math.random() * 0.12).toFixed(3),
        sentiment_neu: +(0.40 + Math.random() * 0.10).toFixed(3),
      });
    }
    return data;
  }

  // Heat map by province
  function genHeatMap() {
    const provinces = ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江',
      '上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南',
      '广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃',
      '青海','宁夏','新疆'];
    return provinces.map(p => ({
      province: p,
      post_count: Math.floor(50 + Math.random() * 500),
      avg_sentiment: +(Math.random() * 0.6 - 0.1).toFixed(3),
    }));
  }

  // Cross-discipline flow
  function genCrossDisciplineFlow(limit) {
    const flows = [];
    for (let i = 0; i < limit; i++) {
      const src = MAJORS[Math.floor(Math.random() * MAJORS.length)];
      let tgt = MAJORS[Math.floor(Math.random() * MAJORS.length)];
      while (tgt.code === src.code) tgt = MAJORS[Math.floor(Math.random() * MAJORS.length)];
      flows.push({
        source_major: src.name, source_code: src.code,
        target_major: tgt.name, target_code: tgt.code,
        flow_count: Math.floor(10 + Math.random() * 200),
        direction: Math.random() > 0.5 ? 'in' : 'out',
      });
    }
    return flows.sort((a, b) => b.flow_count - a.flow_count);
  }

  // Employment sentiment
  function genEmploymentSentiment(months) {
    const data = [];
    const now = new Date();
    for (let i = months; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      data.push({
        month: d.toISOString().slice(0, 7),
        positive_ratio: +(0.3 + Math.random() * 0.25).toFixed(3),
        negative_ratio: +(0.15 + Math.random() * 0.2).toFixed(3),
        sample_size: Math.floor(200 + Math.random() * 800),
      });
    }
    return data;
  }

  // Decision card data for watchlist
  function genWatchlist() {
    return {
      items: [
        {
          school_name: '浙江大学', major_code: '0812', major_name: '计算机科学与技术',
          heat_index: 72, mom_growth: 0.18,
          discouragement: 0.22,
          self_fulfilling_signal: 'heating_up',
        },
        {
          school_name: '南京大学', major_code: '0835', major_name: '软件工程',
          heat_index: 58, mom_growth: -0.05,
          discouragement: 0.12,
          self_fulfilling_signal: 'cooling_off',
        },
        {
          school_name: '华中科技大学', major_code: '0809', major_name: '电子信息',
          heat_index: 85, mom_growth: 0.42,
          discouragement: 0.35,
          self_fulfilling_signal: 'heating_up',
        },
      ],
    };
  }

  // Profile data
  const MOCK_PROFILE = {
    user: DEMO_USER,
    exam_prep: {
      target_school: '浙江大学', target_major: '计算机科学与技术',
      target_school_code: '10335', target_major_code: '0812',
      exam_year: 2026, prep_start: '2025-03-01',
      current_stage: '强化复习',
      daily_study_hours: 6.5, total_study_days: 128,
    },
    tags: {
      persona_tags: [
        { tag: '985本科', source: 'profile', confidence: 0.95 },
        { tag: '计算机专业', source: 'profile', confidence: 0.98 },
        { tag: '目标浙大', source: 'dialog', confidence: 0.92 },
        { tag: '关注就业', source: 'trait_mining', confidence: 0.78 },
        { tag: '偏好南方城市', source: 'trait_mining', confidence: 0.65 },
        { tag: '初试优先', source: 'dialog', confidence: 0.88 },
      ],
    },
    achievements: {
      badges: [
        { id: 'early_bird', name: '早起鸟', desc: '连续7天在6点前开始学习', earned: true, earned_at: '2025-07-15T06:00:00Z' },
        { id: 'streak_30', name: '三十日坚持', desc: '累计学习30天', earned: true, earned_at: '2025-08-20T00:00:00Z' },
        { id: 'deep_focus', name: '深度专注', desc: '单次专注超过3小时', earned: true, earned_at: '2025-09-01T00:00:00Z' },
        { id: 'report_first', name: '首份报告', desc: '生成第一份舆情分析报告', earned: true, earned_at: '2025-09-05T00:00:00Z' },
        { id: 'streak_100', name: '百日冲刺', desc: '累计学习100天', earned: true, earned_at: '2025-09-10T00:00:00Z' },
        { id: 'analyst', name: '舆情分析师', desc: '查看10所院校的舆情数据', earned: false, earned_at: null },
      ],
    },
    study_summary: {
      today_minutes: 385,
      week_minutes: 2640,
      month_minutes: 10800,
      total_minutes: 49920,
      streak_days: 42,
      sessions_today: 4,
      avg_daily_minutes: 390,
    },
    today_tasks: {
      items: [
        { id: 1, title: '数学真题2024年', done: true, subject: '数学' },
        { id: 2, title: '英语阅读精读2篇', done: true, subject: '英语' },
        { id: 3, title: '专业课数据结构复习', done: false, subject: '专业课' },
        { id: 4, title: '政治选择题练习', done: false, subject: '政治' },
      ],
    },
  };

  // Agent conversations
  const MOCK_CONVERSATIONS = {
    agent: [
      {
        id: 'conv-001', chat_type: 'agent', title: '浙大CS择校分析',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        messages: [
          { role: 'user', content: '我想考浙大计算机，帮我分析一下竞争情况', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          { role: 'agent', content: '## 浙江大学 · 计算机科学与技术 择校分析\n\n### 竞争格局\n浙大CS是国内Top 3级别的计算机学科，学科评估A+。近年来考研热度持续走高：\n\n- **报录比**：约 18:1（2025年数据）\n- **复试线趋势**：近3年从360→375→385，稳步上涨\n- **推免占比**：约55%，统考名额约60-70人\n\n### 舆情信号\n当前MHI热度指数 **72/100**，环比上升18%。主要讨论集中在：\n- 推免比例变化\n- 复试难度与机试要求\n- 导师选择与实验室评价\n\n### 建议\n你的本科背景和备考节奏来看，浙大CS是有竞争力的目标。建议：\n1. 重点关注9月招生简章的推免比例变化\n2. 数学和专业课是拉分关键，保持当前节奏\n3. 可以同步关注南大软院作为保底选择', created_at: new Date(Date.now() - 86400000 * 2 + 30000).toISOString() },
          { role: 'user', content: '南大软院和浙大CS相比怎么样？', created_at: new Date(Date.now() - 86400000).toISOString() },
          { role: 'agent', content: '## 南大软院 vs 浙大CS 对比\n\n| 维度 | 浙大CS | 南大软院 |\n|------|--------|----------|\n| 学科评估 | A+ | A |\n| MHI热度 | 72 | 58 |\n| 报录比 | ~18:1 | ~12:1 |\n| 推免占比 | ~55% | ~45% |\n| 复试线 | ~385 | ~355 |\n\n**核心差异：**\n- 浙大CS天花板更高，但风险也更大\n- 南大软院信息差为正（+0.15），存在被低估空间\n- 南大软院的就业去向与浙大CS差距不大\n\n**我的判断：** 如果求稳，南大软院性价比极高；如果冲顶，浙大CS值得拼。建议以浙大为主目标，10月根据模考成绩做最终决策。', created_at: new Date(Date.now() - 86400000 + 25000).toISOString() },
        ],
      },
      {
        id: 'conv-002', chat_type: 'agent', title: '关于华科电信的分析',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        messages: [
          { role: 'user', content: '华科电信今年为什么这么火？', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
          { role: 'agent', content: '## 华中科技大学 · 电子信息 热度飙升分析\n\n华科电信近期讨论量暴涨，MHI达到85，环比增长42%。主要原因：\n\n1. **就业利好传导**：华为/中兴等大厂校招薪资上调，电信对口岗位需求旺盛\n2. **跨考涌入**：大量机械/自动化考生转向电信方向\n3. **自媒体效应**：多位考研博主推荐华科电信为"性价比之选"\n\n**风险提示：**\n- 劝退指数0.35（偏高），已有大量"别来"帖子\n- 保研挤压0.45，统考实际名额可能被压缩\n- 信息差为负（-0.12），讨论热度已超过学科实力匹配度\n\n**建议：** 警惕泡沫风险，如果尚未开始备考该方向，不建议临时换目标。', created_at: new Date(Date.now() - 86400000 * 5 + 20000).toISOString() },
        ],
      },
    ],
    study: [
      {
        id: 'conv-study-001', chat_type: 'study', title: '自习室陪伴对话',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        messages: [
          { role: 'user', content: '今天状态不太好，学了两个小时就走神了', created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
          { role: 'agent', content: '没关系，状态波动是正常的。你已经连续学习了42天，这本身就很了不起。\n\n试试番茄钟：25分钟专注 + 5分钟休息，先完成一个小目标。今天哪怕只再做两个番茄钟，也是胜利。\n\n你现在在复习什么科目？我可以帮你拆解一下任务。', created_at: new Date(Date.now() - 3600000 * 3 + 15000).toISOString() },
        ],
      },
    ],
  };

  // Reports
  const MOCK_REPORTS = [
    {
      id: 'rpt-001', title: '浙江大学·计算机科学与技术 舆情分析报告',
      school: '浙江大学', major: '计算机科学与技术',
      generated_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
      summary: '浙大CS热度持续走高，MHI 72分，推免占比约55%，统考竞争激烈。建议关注9月招简变化，做好数学和专业课冲刺准备。',
      sections: {
        competition: '报录比约18:1，复试线近三年从360升至385。推免占比55%，统考名额60-70人。',
        sentiment: '正面情绪占38%，中性45%，负面17%。主要焦虑点为推免比例和复试难度。',
        trend: '热度上升趋势明显，7日动量+25%。预计10月报名期间将达到峰值。',
        advice: '以浙大CS为主目标，同步准备南大软院作为保底。数学和专业课是核心拉分项。',
      },
    },
    {
      id: 'rpt-002', title: '南京大学·软件工程 舆情分析报告',
      school: '南京大学', major: '软件工程',
      generated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: 'completed',
      summary: '南大软院信息差为正，讨论热度低于学科实力，性价比较高。报录比约12:1，适合求稳策略。',
      sections: {
        competition: '报录比约12:1，复试线稳定在355左右。推免占比45%，统考名额相对充裕。',
        sentiment: '正面情绪占42%，中性48%，负面10%。整体舆论环境积极。',
        trend: '热度平稳，略有下降趋势。信息差+0.15表明被低估。',
        advice: '作为保底或主攻目标均可。关注专业课考试大纲变化。',
      },
    },
  ];

  // Notifications
  const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'heat_alert', title: '关注院校热度变化', body: '华中科技大学·电子信息 MHI 上升42%，超过你设定的20%阈值', read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, type: 'report_ready', title: '报告生成完成', body: '浙江大学·计算机科学与技术 舆情分析报告已生成', read: false, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, type: 'policy', title: '政策提醒', body: '2026年考研预报名即将开始（9月24日-27日），请提前确认报考信息', read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 4, type: 'achievement', title: '获得新成就', body: '恭喜获得「百日冲刺」徽章！累计学习100天', read: true, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 5, type: 'system', title: '系统通知', body: '研屿 v0.2.0 已更新：新增搜索BYOK、多Key管理等功能', read: true, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  ];

  // Study scenes
  const MOCK_SCENES = [
    { id: 'forest-cabin', name: '森林小屋', category: 'nature', audio_url: '', image_url: 'assets/scenes/forest-cabin.jpg', description: '静谧的林间木屋，窗外是沙沙树叶声' },
    { id: 'rainy-cafe', name: '雨天咖啡馆', category: 'urban', audio_url: '', image_url: 'assets/scenes/rainy-cafe.jpg', description: '窗边雨滴轻敲，咖啡香气弥漫' },
    { id: 'night-library', name: '深夜图书馆', category: 'study', audio_url: '', image_url: 'assets/scenes/night-library.jpg', description: '安静的书架之间，只有翻书的声响' },
    { id: 'ocean-cove', name: '海湾日落', category: 'nature', audio_url: '', image_url: 'assets/scenes/ocean-cove.jpg', description: '海浪轻拍礁石，夕阳染红天际' },
    { id: 'misty-hills', name: '雾隐山丘', category: 'nature', audio_url: '', image_url: 'assets/scenes/misty-hills.jpg', description: '晨雾缭绕的山间，空气清新宁静' },
    { id: 'snow-mountain', name: '雪山营地', category: 'nature', audio_url: '', image_url: 'assets/scenes/snow-mountain.jpg', description: '皑皑雪峰下的温暖营地' },
  ];

  // Rankings
  function genRankings(type, limit) {
    const src = type === 'schools' ? SCHOOLS : MAJORS;
    return src.slice(0, limit).map((item, i) => ({
      ...item,
      rank: i + 1,
      school_name: item.name,
      major_name: item.name,
      heat_l2: Math.floor(50 + Math.random() * 50),
      heat_l3: Math.floor(40 + Math.random() * 60),
      post_count_7d: Math.floor(200 + Math.random() * 2000),
      sentiment_score: +(0.3 + Math.random() * 0.4).toFixed(3),
      growth_rate: +((Math.random() - 0.3) * 0.5).toFixed(3),
    }));
  }

  // Admin data
  const ADMIN_OVERVIEW = {
    users: { total: 12847, dau_today: 3421, new_today: 42 },
    llm: {
      runs_today: 4521, runs_yesterday: 4230,
      tokens_today: 8920000, tokens_yesterday: 8450000, tokens_total: 234560000,
      byok_users: 1283, pool_models: 6,
    },
    quotas: {
      exhausted: 89,
      usage: { report: 0.72, chat: 0.65, study: 0.58, template: 0.31 },
    },
    codes: { uses_left: 4520, redeemed_uses: 1893 },
    custom_scenes: 234,
  };

  const ADMIN_STATS_DAILY = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      new_users: Math.floor(20 + Math.random() * 40),
      active_users: Math.floor(800 + Math.random() * 600),
      reports_generated: Math.floor(50 + Math.random() * 100),
      conversations: Math.floor(200 + Math.random() * 300),
      api_calls: Math.floor(2000 + Math.random() * 3000),
    };
  });

  // ── Route matching & response generation ─────────────────────────────

  const originalFetch = window.fetch;

  async function delay(ms) {
    const t = ms || (100 + Math.random() * 200);
    return new Promise(r => setTimeout(r, t));
  }

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function matchUrl(url, pattern) {
    // Simple prefix/base matching
    const u = url.split('?')[0];
    return u === pattern || u.startsWith(pattern + '/') || u.startsWith(pattern + '?');
  }

  function getParam(url, key) {
    try { return new URLSearchParams(url.split('?')[1] || '').get(key); } catch (e) { return null; }
  }

  async function handleMockRequest(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const path = url.replace(/^.*?(\/api\/.*)$/, '$1').split('?')[0];
    const fullUrl = url;

    await delay();

    // ── Auth endpoints ──
    if (path === '/api/auth/login') {
      return jsonResponse({ access_token: 'demo-token-yanguan-2025', token_type: 'bearer' });
    }
    if (path === '/api/auth/register') {
      return jsonResponse({ access_token: 'demo-token-yanguan-2025', token_type: 'bearer' });
    }
    if (path === '/api/auth/me') {
      if (method === 'PUT') return jsonResponse(DEMO_USER);
      return jsonResponse(DEMO_USER);
    }

    // ── Public macro endpoints ──
    if (path === '/api/macro/calendar') {
      return jsonResponse({
        current: { stage_name: '强化冲刺期', stage_key: 'intensive', start: '2025-09-01', end: '2025-11-30' },
        stages: [
          { stage_name: '基础夯实期', stage_key: 'foundation', start: '2025-03-01', end: '2025-06-30' },
          { stage_name: '暑期强化期', stage_key: 'summer', start: '2025-07-01', end: '2025-08-31' },
          { stage_name: '强化冲刺期', stage_key: 'intensive', start: '2025-09-01', end: '2025-11-30' },
          { stage_name: '考前调整期', stage_key: 'final', start: '2025-12-01', end: '2025-12-25' },
        ],
        timeline: [
          { month: 3, stage_name: '基础夯实期', description: '系统梳理各科基础知识，建立知识框架', focus: ['数学基础', '英语词汇', '专业课教材'] },
          { month: 6, stage_name: '基础夯实期', description: '完成第一轮复习，开始真题训练', focus: ['真题演练', '错题整理'] },
          { month: 7, stage_name: '暑期强化期', description: '集中强化训练，突破重难点', focus: ['强化课程', '专题训练'] },
          { month: 9, stage_name: '强化冲刺期', description: '预报名开始，查漏补缺，模拟测试', focus: ['预报名', '模拟考试', '政治启动'] },
          { month: 10, stage_name: '强化冲刺期', description: '正式报名，冲刺复习，调整心态', focus: ['正式报名', '冲刺复习'] },
          { month: 12, stage_name: '考前调整期', description: '最后冲刺，调整作息，准备考试', focus: ['考前冲刺', '心态调整'] },
        ],
      });
    }
    if (path === '/api/macro/heat-overview') {
      const days = parseInt(getParam(fullUrl, 'days')) || 14;
      return jsonResponse({ series: genHeatOverview(days) });
    }
    if (path === '/api/macro/heat-map') {
      return jsonResponse(genHeatMap());
    }
    if (path === '/api/macro/cross-discipline-flow') {
      const limit = parseInt(getParam(fullUrl, 'limit')) || 30;
      const flows = genCrossDisciplineFlow(limit);
      return jsonResponse({
        links: flows.map(f => ({
          source: f.source_major,
          target: f.target_major,
          value: f.flow_count,
        })),
      });
    }
    if (path === '/api/macro/employment-sentiment') {
      const months = parseInt(getParam(fullUrl, 'months')) || 12;
      const data = genEmploymentSentiment(months);
      const majors = ['计算机科学与技术', '软件工程', '电子信息', '人工智能', '数据科学'];
      const series = {};
      majors.forEach(m => {
        series[m] = data.map(d => ({
          month: d.month,
          value: +(d.positive_ratio - d.negative_ratio + 0.5 + Math.random() * 0.2).toFixed(3),
        }));
      });
      return jsonResponse({ series });
    }
    if (path === '/api/macro/rankings/schools') {
      const limit = parseInt(getParam(fullUrl, 'limit')) || 10;
      return jsonResponse({ items: genRankings('schools', limit) });
    }
    if (path === '/api/macro/rankings/majors') {
      const limit = parseInt(getParam(fullUrl, 'limit')) || 10;
      return jsonResponse({ items: genRankings('majors', limit) });
    }

    // ── Schools & Majors (public) ──
    if (path === '/api/schools') {
      const tier = getParam(fullUrl, 'tier');
      let filtered = SCHOOLS;
      if (tier) filtered = SCHOOLS.filter(s => s.tier === tier);
      const page = parseInt(getParam(fullUrl, 'page')) || 1;
      const pageSize = parseInt(getParam(fullUrl, 'page_size')) || 20;
      const start = (page - 1) * pageSize;
      return jsonResponse({
        items: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page, page_size: pageSize,
      });
    }
    if (path === '/api/majors') {
      const page = parseInt(getParam(fullUrl, 'page')) || 1;
      const pageSize = parseInt(getParam(fullUrl, 'page_size')) || 20;
      const start = (page - 1) * pageSize;
      return jsonResponse({
        items: MAJORS.slice(start, start + pageSize),
        total: MAJORS.length,
        page, page_size: pageSize,
      });
    }
    if (path === '/api/system/data-freshness') {
      return jsonResponse({
        last_crawl: new Date(Date.now() - 3600000).toISOString(),
        freshness_hours: 1,
        sources_updated: ['zhihu', 'tieba', 'xhs'],
        platforms: [
          { platform: 'zhihu', state: 'fresh', hours_since: 0.5 },
          { platform: 'tieba', state: 'fresh', hours_since: 1.2 },
          { platform: 'xiaohongshu', state: 'fresh', hours_since: 2.1 },
          { platform: 'bilibili', state: 'stale', hours_since: 26 },
          { platform: 'weibo', state: 'fresh', hours_since: 3.5 },
        ],
      });
    }

    // ── Search ──
    if (path === '/api/search') {
      const q = (getParam(fullUrl, 'q') || '').toLowerCase();
      const matchedSchools = SCHOOLS.filter(s => s.name.includes(q) || s.code.includes(q)).slice(0, 5);
      const matchedMajors = MAJORS.filter(m => m.name.includes(q) || m.code.includes(q)).slice(0, 5);
      return jsonResponse({ schools: matchedSchools, majors: matchedMajors });
    }

    // ── Profile ──
    if (path === '/api/profile/me' || path === '/api/profile/exam-prep') {
      return jsonResponse(MOCK_PROFILE.exam_prep);
    }
    if (path === '/api/profile/tags') {
      if (method === 'POST' || method === 'PUT') return jsonResponse(MOCK_PROFILE.tags);
      return jsonResponse(MOCK_PROFILE.tags);
    }
    if (path === '/api/profile/tags/from-dialog' || path === '/api/profile/tags/from-profile') {
      return jsonResponse(MOCK_PROFILE.tags.persona_tags.filter(t => t.source === path.split('/').pop()));
    }
    if (path === '/api/profile/tags/reset') {
      return jsonResponse({ ok: true });
    }
    if (path === '/api/profile/achievements') {
      return jsonResponse(MOCK_PROFILE.achievements);
    }
    if (path === '/api/profile/study-summary') {
      return jsonResponse(MOCK_PROFILE.study_summary);
    }
    if (path === '/api/profile/today-tasks') {
      if (method === 'PUT' || method === 'POST') return jsonResponse({ ok: true });
      return jsonResponse(MOCK_PROFILE.today_tasks);
    }
    if (path === '/api/profile/plan/confirm') {
      return jsonResponse({ ok: true });
    }
    if (path === '/api/profile/onboarding/status') {
      return jsonResponse({ has_profile: true });
    }
    if (path === '/api/profile/onboarding/chat') {
      return jsonResponse({ reply: '画像已完善，无需再次引导。', complete: true, next_index: 0, collected: {} });
    }

    // ── Watchlist ──
    if (path === '/api/watchlist') {
      if (method === 'POST' || method === 'DELETE') return jsonResponse({ ok: true });
      return jsonResponse(genWatchlist());
    }

    // ── Metrics ──
    if (path.startsWith('/api/metrics/overview')) {
      const school = getParam(fullUrl, 'school') || '清华大学';
      return jsonResponse({
        school_name: school,
        major_name: '计算机科学与技术',
        heat: { mhi: 72, mom_growth: 0.35, discussion: 1280, l2: 85, l3: 68 },
        discouragement: { discouragement_index: 0.18, sample_size: 340 },
        baoyan_pressure: { baoyan_pressure: 0.32, baoyan_ratio: 0.28 },
        info_gap: { info_gap: 0.15, discipline_evaluation: 'A+' },
        trend_prediction: { direction: 'rising', confidence: 0.78 },
        recent_posts: { posts: [
          { snippet: '今年清华计算机考研分数线可能会继续上涨，建议提前准备', platform: 'zhihu', created_at: '2026-09-13' },
          { snippet: '清华计算机推免比例越来越高，统考名额堪忧', platform: 'xiaohongshu', created_at: '2026-09-12' },
        ]},
        self_fulfilling_signal: null,
      });
    }
    if (path.startsWith('/api/metrics/info-gap')) {
      return jsonResponse({ info_gap: 0.15, discipline_evaluation: 'A+' });
    }

    // ── Agent ──
    if (path === '/api/agent/conversations') {
      if (method === 'DELETE') return jsonResponse({ cleared: MOCK_CONVERSATIONS.agent.length + MOCK_CONVERSATIONS.study.length });
      const chatType = getParam(fullUrl, 'chat_type') || 'agent';
      return jsonResponse({ items: MOCK_CONVERSATIONS[chatType] || [] });
    }
    if (path === '/api/agent/chat/blocking') {
      return jsonResponse({
        reply: '这是一个演示回复。在实际产品中，Agent 会根据你的画像、舆情数据和对话历史给出个性化分析。\n\n当前处于 Demo 模式，所有数据均为模拟数据。',
        conversation_id: 'conv-demo',
        citations: [],
      });
    }

    // ── Reports ──
    if (path === '/api/reports') {
      if (method === 'POST') return jsonResponse({ ok: true });
      return jsonResponse({ items: MOCK_REPORTS });
    }
    if (path === '/api/reports/generate') {
      return jsonResponse({
        id: 'rpt-new-' + Date.now(),
        status: 'completed',
        report: MOCK_REPORTS[0],
      });
    }
    if (path.startsWith('/api/reports/')) {
      const id = path.split('/api/reports/')[1];
      if (id.endsWith('/share')) return jsonResponse({ share_url: 'https://yanguan.isle/r/' + id });
      if (method === 'DELETE') return jsonResponse({ ok: true });
      return jsonResponse(MOCK_REPORTS[0] || { id, title: '考研择校深度分析报告', status: 'completed' });
    }

    // ── Sentiment ──
    if (path.startsWith('/api/sentiment/cross-platform')) {
      return jsonResponse({
        platforms: [
          { name: '知乎', post_count: 1243, sentiment_score: 0.62, top_keywords: ['推免', '分数线', '复试'] },
          { name: '贴吧', post_count: 876, sentiment_score: 0.55, top_keywords: ['卷', '保研', '统考'] },
          { name: '小红书', post_count: 654, sentiment_score: 0.71, top_keywords: ['性价比', '就业', '城市'] },
          { name: 'B站', post_count: 321, sentiment_score: 0.68, top_keywords: ['经验贴', '复习', '规划'] },
        ],
      });
    }
    if (path.startsWith('/api/sentiment/trending-topics')) {
      return jsonResponse({
        topics: [
          { topic: '推免比例上涨', heat: 0.85, trend: 'rising' },
          { topic: '复试线预测', heat: 0.72, trend: 'stable' },
          { topic: '就业去向', heat: 0.65, trend: 'rising' },
          { topic: '导师评价', heat: 0.58, trend: 'falling' },
        ],
      });
    }
    if (path.startsWith('/api/employment-sentiment')) {
      return jsonResponse({
        major: '计算机科学与技术',
        avg_salary: 18500,
        employment_rate: 0.94,
        top_industries: ['互联网', '金融', '制造业', '教育'],
        sentiment_score: 0.72,
      });
    }

    // ── Notifications ──
    if (path === '/api/notifications') {
      if (method === 'POST') return jsonResponse({ ok: true });
      const unreadOnly = getParam(fullUrl, 'unread_only') === 'true';
      const items = unreadOnly ? MOCK_NOTIFICATIONS.filter(n => !n.read) : MOCK_NOTIFICATIONS;
      return jsonResponse({ items });
    }
    if (path === '/api/notifications/read') {
      return jsonResponse({ ok: true });
    }

    // ── Settings / Preferences ──
    if (path.startsWith('/api/settings/pref/')) {
      if (method === 'PUT') return jsonResponse({ ok: true });
      const prefKey = path.split('/').pop();
      const defaults = {
        theme: { value: { theme: 'dark' } },
        agent_pref: { value: { debate_default: true, depth: 'standard', report_detail: 'standard' } },
        notify: { value: { inapp: true, heat_threshold: 0.20 } },
        privacy: { value: { persona_tags_participate: true, study_data_visible: true, trait_mining: true } },
      };
      return jsonResponse(defaults[prefKey] || { value: {} });
    }
    if (path === '/api/settings/export') {
      return jsonResponse({ profile: MOCK_PROFILE, conversations: MOCK_CONVERSATIONS, reports: MOCK_REPORTS });
    }

    // ── Model Service ──
    if (path === '/api/model-service/status') {
      return jsonResponse({
        mode: 'byok',
        quotas: {
          report: { used: 3, limit: 999 },
          chat: { used: 12, limit: 999 },
          study: { used: 28, limit: 999 },
          template: { used: 1, limit: 999 },
          search: { used: 0, limit: 999 },
          crawl: { used: 0, limit: 999 },
        },
        llm_keys: [
          { id: 'key-1', provider: 'deepseek', model: 'deepseek-chat', base_url: 'https://api.deepseek.com/v1', key_masked: 'sk-****abcd', is_active: true },
        ],
        search_keys: [
          { id: 'skey-1', provider: 'bocha', base_url: 'https://api.bochaai.com/v1', key_masked: 'sk-****efgh', is_active: true },
        ],
        max_keys: 5,
        presets: {
          deepseek: { label: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'], model: 'deepseek-chat' },
          qwen: { label: '通义千问 Qwen（百炼）', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-flash'], model: 'qwen-plus' },
          zhipu: { label: '智谱 GLM', base_url: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4.7-flash', 'glm-4.7', 'glm-5', 'glm-5.3'], model: 'glm-4.7-flash' },
          custom: { label: '自定义（OpenAI 兼容）', base_url: '', models: [], model: '' },
        },
        search_presets: {
          bocha: { label: '博查 Bocha', base_url: 'https://api.bochaai.com/v1' },
          tavily: { label: 'Tavily', base_url: 'https://api.tavily.com' },
        },
      });
    }
    if (path === '/api/model-service/key' || path.startsWith('/api/model-service/key/')) {
      return jsonResponse({ ok: true, status: {} });
    }
    if (path === '/api/model-service/search-key' || path.startsWith('/api/model-service/search-key/')) {
      return jsonResponse({ ok: true, status: {} });
    }
    if (path === '/api/model-service/redeem') {
      return jsonResponse({ granted: { report: 3, chat: 10, study: 5, template: 2, search: 3, crawl: 5 } });
    }
    if (path === '/api/model-service/search') {
      return jsonResponse({ new_rows: 42, import: { imported: 38 } });
    }

    // ── Platform Auth ──
    if (path === '/api/platform-auth') {
      return jsonResponse({
        items: [
          { platform: 'zhihu', configured: true, status: 'active' },
          { platform: 'xhs', configured: true, status: 'active' },
          { platform: 'tieba', configured: true, status: 'active' },
          { platform: 'douyin', configured: false, status: null },
          { platform: 'wb', configured: false, status: null },
          { platform: 'bili', configured: true, status: 'active' },
        ],
      });
    }
    if (path.startsWith('/api/platform-auth/') && path.includes('/qr')) {
      return jsonResponse({ sid: 'demo-sid', qr_image: null, status: 'confirmed' });
    }
    if (path === '/api/platform-auth/crawl/status') {
      return jsonResponse({ last_crawl: new Date(Date.now() - 7200000).toISOString(), status: 'ok', sources: ['zhihu', 'xhs', 'tieba'] });
    }
    if (path === '/api/platform-auth/force-update') {
      return jsonResponse({ ok: true, updated: 3 });
    }

    // ── Study Room ──
    if (path === '/api/study/scenes') {
      return jsonResponse({ items: MOCK_SCENES });
    }
    if (path === '/api/study/scenes/community') {
      return jsonResponse({ items: [] });
    }
    if (path === '/api/study/chat') {
      return jsonResponse({
        reply: '加油！保持专注，你已经做得很好了。',
      });
    }
    if (path === '/api/study/favorites') {
      return jsonResponse({ items: ['forest-cabin', 'night-library'] });
    }

    // ── Admin ──
    if (path === '/api/admin/overview') {
      return jsonResponse(ADMIN_OVERVIEW);
    }
    if (path === '/api/admin/stats/daily') {
      return jsonResponse({ days: ADMIN_STATS_DAILY });
    }
    if (path === '/api/admin/usage') {
      return jsonResponse({
        items: MOCK_USERS.slice(0, 20).map(u => ({
          ...u,
          total_chats: Math.floor(10 + Math.random() * 200),
          total_reports: Math.floor(Math.random() * 15),
          last_active: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        })),
        total: 12847,
        by_scene: { report: 8934, chat: 23456, study: 15678, template: 3421 },
      });
    }
    if (path === '/api/admin/channels') {
      return jsonResponse({
        items: [
          { id: 'ch-1', name: '知乎考研话题', platform: 'zhihu', status: 'active', last_crawl: new Date().toISOString(), posts_total: 45230 },
          { id: 'ch-2', name: '贴吧考研吧', platform: 'tieba', status: 'active', last_crawl: new Date().toISOString(), posts_total: 89120 },
          { id: 'ch-3', name: '小红书考研tag', platform: 'xhs', status: 'active', last_crawl: new Date().toISOString(), posts_total: 34560 },
          { id: 'ch-4', name: 'B站考研UP主', platform: 'bili', status: 'active', last_crawl: new Date().toISOString(), posts_total: 12890 },
        ],
      });
    }
    if (path === '/api/admin/codes') {
      return jsonResponse({
        items: [
          { code: 'GY-DEMO-001', type: 'general', uses_remaining: 99, granted: { report: 3, chat: 10, study: 5 }, created_at: new Date().toISOString() },
          { code: 'GY-VIP-2025', type: 'vip', uses_remaining: 50, granted: { report: 99, chat: 99, study: 99, template: 10, search: 99, crawl: 99 }, created_at: new Date().toISOString() },
        ],
      });
    }
    if (path === '/api/admin/llm-presets') {
      return jsonResponse({ presets: { deepseek: { label: 'DeepSeek' }, qwen: { label: 'Qwen' }, zhipu: { label: 'GLM' } } });
    }
    if (path === '/api/admin/search-config') {
      return jsonResponse({ config: { daily_free_search: 1, daily_free_crawl: 2 } });
    }
    if (path === '/api/admin/data-inventory') {
      return jsonResponse({
        total_posts: 1567890,
        by_platform: { zhihu: 456000, tieba: 891000, xhs: 134000, bili: 86890 },
        oldest_post: '2024-01-15', newest_post: new Date().toISOString().slice(0, 10),
      });
    }
    if (path === '/api/admin/platform-auths') {
      return jsonResponse({
        items: [
          { user_id: 1, username: 'user1', platform: 'zhihu', status: 'active', last_used: new Date().toISOString() },
          { user_id: 3, username: 'user3', platform: 'xhs', status: 'active', last_used: new Date().toISOString() },
          { user_id: 5, username: 'user5', platform: 'tieba', status: 'expired', last_used: new Date(Date.now() - 86400000 * 3).toISOString() },
        ],
      });
    }
    if (path === '/api/admin/role-audit') {
      return jsonResponse({ items: [] });
    }

    // ── Fallback: unknown endpoint ──
    console.warn('[Mock API] Unhandled endpoint:', method, path);
    return jsonResponse({ detail: 'Demo mode: endpoint not mocked' }, 404);
  }

  // ── Override window.fetch ────────────────────────────────────────────

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input.url || '');

    // Only intercept /api/* requests
    if (url.includes('/api/')) {
      try {
        return await handleMockRequest(url, init || {});
      } catch (err) {
        console.error('[Mock API] Error handling request:', err);
        return jsonResponse({ detail: 'Mock API internal error' }, 500);
      }
    }

    // Pass through non-API requests (assets, geo JSON, etc.)
    return originalFetch.apply(this, arguments);
  };

  // ── Auto-set demo token on load ──────────────────────────────────────
  localStorage.setItem('gy_token', 'demo-token-yanguan-2025');

  // Suppress onboarding modals in demo mode
  localStorage.setItem('gy_model_onboard', 'done');
  localStorage.setItem('gy_pa_onboard', 'done');
  sessionStorage.setItem('gy_ob_skipped', '1');

  console.log('%c[研屿 Demo] Mock API layer loaded. All /api/* calls intercepted.', 'color: #6db3a3; font-weight: bold;');
})();
