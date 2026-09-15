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
    const provinces = ['北京市','天津市','河北省','山西省','内蒙古自治区','辽宁省','吉林省','黑龙江省',
      '上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省',
      '广东省','广西壮族自治区','海南省','重庆市','四川省','贵州省','云南省','西藏自治区','陕西省','甘肃省',
      '青海省','宁夏回族自治区','新疆维吾尔自治区','台湾省','香港特别行政区','澳门特别行政区'];
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
    { id: 1, type: 'heat_change', title: '关注院校热度变化', body: '华中科技大学·电子信息 MHI 上升42%，超过你设定的20%阈值', content: '华中科技大学·电子信息 MHI 上升42%，超过你设定的20%阈值', read: false, is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, type: 'heat_change', title: '报告生成完成', body: '浙江大学·计算机科学与技术 舆情分析报告已生成', content: '浙江大学·计算机科学与技术 舆情分析报告已生成', read: false, is_read: false, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, type: 'policy', title: '政策提醒', body: '2026年考研预报名即将开始（9月24日-27日），请提前确认报考信息', content: '2026年考研预报名即将开始（9月24日-27日），请提前确认报考信息', read: true, is_read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 4, type: 'deadline', title: '获得新成就', body: '恭喜获得「百日冲刺」徽章！累计学习100天', content: '恭喜获得「百日冲刺」徽章！累计学习100天', read: true, is_read: true, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 5, type: 'reminder', title: '系统通知', body: '研屿 v0.2.0 已更新：新增搜索BYOK、多Key管理等功能', content: '研屿 v0.2.0 已更新：新增搜索BYOK、多Key管理等功能', read: true, is_read: true, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
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
      usage: {
        report: { used: 7200, limit: 10000 },
        chat: { used: 18500, limit: 30000 },
        study: { used: 12800, limit: 20000 },
        template: { used: 3100, limit: 10000 },
      },
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
      runs: Math.floor(100 + Math.random() * 200),
      tokens: Math.floor(200000 + Math.random() * 300000),
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
      const body = JSON.parse(options.body || '{}');
      if (body.username === 'demo' && body.password === 'demo1234') {
        return jsonResponse({ access_token: 'demo-token-yanguan-2025', token_type: 'bearer' });
      }
      return jsonResponse({ detail: '用户名或密码错误' }, 401);
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
      return jsonResponse({
        provinces: genHeatMap().map(p => ({
          province: p.province,
          discussion_count: p.post_count,
          avg_sentiment: p.avg_sentiment,
        })),
      });
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
          sentiment_score: +(d.positive_ratio - d.negative_ratio + 0.5 + Math.random() * 0.2).toFixed(3),
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
    if (path.startsWith('/api/schools/') && !path.includes('?')) {
      const code = path.split('/api/schools/')[1];
      const school = SCHOOLS.find(s => s.code === code) || SCHOOLS[0];
      return jsonResponse({
        ...school,
        intro: school.name + '是位于' + school.province + '市' + school.city + '的' + school.tier + '高校，拥有多个A+学科。',
        majors: MAJORS.slice(0, 8).map(m => ({ ...m })),
      });
    }
    if (path.startsWith('/api/majors/') && !path.includes('?')) {
      const code = path.split('/api/majors/')[1];
      const major = MAJORS.find(m => m.code === code) || MAJORS[0];
      return jsonResponse({
        ...major,
        schools: SCHOOLS.filter(s => s.tier === '985').slice(0, 10).map(s => ({ code: s.code, name: s.name, tier: s.tier, province: s.province })),
      });
    }
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
    if (path === '/api/profile/me') {
      return jsonResponse({
        ...DEMO_USER,
        background: {
          school_tier: '985',
          major: '计算机科学与技术',
          gpa_rank: 'top20%',
          is_cross_discipline: false,
        },
        risk_preference: 'balanced',
        priorities: ['学科实力', '就业去向', '城市区位'],
        hard_constraints: ['不考虑西北地区'],
        anxiety_points: '担心推免比例继续扩大',
        target_school: '浙江大学',
        target_major: '计算机科学与技术',
        exam_year: 2026,
      });
    }
    if (path === '/api/profile/exam-prep') {
      if (method === 'PUT') return jsonResponse({ ok: true });
      return jsonResponse({
        target_school: '浙江大学',
        target_major: '计算机科学与技术',
        target_school_code: '10335',
        target_major_code: '0812',
        exam_year: 2026,
        exam_date: '2025-12-21',
        countdown_days: 97,
        prep_start: '2025-03-01',
        current_stage: '强化复习',
        daily_study_hours: 6.5,
        daily_plan_minutes: 480,
        plan_confirmed_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        total_study_days: 128,
        subjects: [
          { code: 'math', name: '数学', plan_minutes: 180 },
          { code: 'english', name: '英语', plan_minutes: 120 },
          { code: 'cs', name: '专业课', plan_minutes: 150 },
          { code: 'politics', name: '政治', plan_minutes: 90 },
        ],
      });
    }
    if (path === '/api/profile/tags') {
      if (method === 'POST') return jsonResponse({ added: 1 });
      if (method === 'PUT') return jsonResponse({ ok: true });
      return jsonResponse({
        persona_tags: MOCK_PROFILE.tags.persona_tags,
        groups: {
          '背景': [
            { id: 'tag-1', label: '985本科' },
            { id: 'tag-2', label: '计算机专业' },
          ],
          '偏好': [
            { id: 'tag-3', label: '目标浙大' },
            { id: 'tag-4', label: '偏好南方城市' },
          ],
          '关注': [
            { id: 'tag-5', label: '关注就业' },
            { id: 'tag-6', label: '初试优先' },
          ],
        },
      });
    }
    if (path === '/api/profile/tags/from-dialog' || path === '/api/profile/tags/from-profile') {
      if (method === 'POST') return jsonResponse({ added: 2 });
      return jsonResponse(MOCK_PROFILE.tags.persona_tags.filter(t => t.source === path.split('/').pop()));
    }
    if (path === '/api/profile/tags/reset') {
      return jsonResponse({ removed: 3 });
    }
    if (path === '/api/profile/achievements') {
      return jsonResponse({
        badges: MOCK_PROFILE.achievements.badges,
        items: [
          { type: 'streak', label: '连续学习', value: '42天' },
          { type: 'total', label: '累计学习', value: '832小时' },
          { type: 'reports', label: '生成报告', value: '5份' },
          { type: 'schools', label: '分析院校', value: '12所' },
        ],
      });
    }
    if (path === '/api/profile/study-summary') {
      return jsonResponse({
        ...MOCK_PROFILE.study_summary,
        subjects: [
          { subject: '数学', minutes: 15600, color: '#6366f1' },
          { subject: '英语', minutes: 10200, color: '#22c55e' },
          { subject: '专业课', minutes: 14400, color: '#f59e0b' },
          { subject: '政治', minutes: 9720, color: '#ef4444' },
        ],
        calendar: Array.from({ length: 30 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (29 - i));
          return { date: d.toISOString().slice(0, 10), minutes: Math.floor(120 + Math.random() * 360) };
        }),
      });
    }
    if (path === '/api/profile/today-tasks') {
      if (method === 'PUT' || method === 'POST') return jsonResponse({ ok: true });
      return jsonResponse({
        items: MOCK_PROFILE.today_tasks.items,
        confirmed: true,
        tasks: [
          { subject: '数学', remaining_minutes: 90 },
          { subject: '英语', remaining_minutes: 60 },
          { subject: '专业课', remaining_minutes: 120 },
        ],
      });
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
      const major = getParam(fullUrl, 'major') || '计算机科学与技术';
      return jsonResponse({
        school_name: school,
        major_name: major,
        heat: { mhi: 72, mom_growth: 0.35, discussion: 1280, l2: 85, l3: 68, school: school, major: major, sample_post_count: 3420, self_fulfilling_signal: 'heating_up', error: null, detail: '热度数据基于多平台讨论量加权计算', computed_at: new Date().toISOString() },
        discouragement: { discouragement_index: 0.18, sample_size: 340 },
        baoyan_pressure: { baoyan_pressure: 0.32, baoyan_ratio: 0.28 },
        info_gap: { info_gap: 0.15, discipline_evaluation: 'A+' },
        trend_prediction: { direction: 'rising', confidence: 0.78, momentum_7d_vs_prev7d: 0.25, momentum_30d_vs_prev30d: 0.18, rationale: '近7日讨论量较前7日上升25%，报名季临近推动热度持续走高' },
        initial_vs_reexam: { initial_discussion: 8500, reexam_discussion: 4200, reexam_heavier: false },
        enrollment: { series: [
          { year: 2023, planned: 85, exemption: 45 },
          { year: 2024, planned: 80, exemption: 48 },
          { year: 2025, planned: 75, exemption: 50 },
        ]},
        score_lines: { series: [
          { year: 2023, total: 365 },
          { year: 2024, total: 375 },
          { year: 2025, total: 385 },
        ]},
        recent_posts: { posts: [
          { snippet: '今年清华计算机考研分数线可能会继续上涨，建议提前准备', platform: 'zhihu', created_at: '2026-09-13' },
          { snippet: '清华计算机推免比例越来越高，统考名额堪忧', platform: 'xiaohongshu', created_at: '2026-09-12' },
          { snippet: '分享备考经验：数学一复习全流程', platform: 'tieba', created_at: '2026-09-11' },
        ]},
        self_fulfilling_signal: 'heating_up',
      });
    }
    if (path.startsWith('/api/metrics/info-gap')) {
      return jsonResponse({ info_gap: 0.15, discipline_evaluation: 'A+' });
    }

    // ── Agent ──
    if (path === '/api/agent/conversations') {
      if (method === 'DELETE') return jsonResponse({ cleared: MOCK_CONVERSATIONS.agent.length + MOCK_CONVERSATIONS.study.length });
      const chatType = getParam(fullUrl, 'chat_type') || 'agent';
      const items = (MOCK_CONVERSATIONS[chatType] || []).map(c => ({ ...c, debate_enabled: true }));
      return jsonResponse({ items });
    }
    if (path.startsWith('/api/agent/conversations/')) {
      const convId = path.split('/api/agent/conversations/')[1];
      const allConvs = [...MOCK_CONVERSATIONS.agent, ...MOCK_CONVERSATIONS.study];
      const conv = allConvs.find(c => c.id === convId) || MOCK_CONVERSATIONS.agent[0];
      return jsonResponse({
        ...conv,
        debate_enabled: true,
        messages: conv.messages.map(m => ({
          ...m,
          trace: m.role === 'agent' ? [
            { phase: 'plan', title: '分析框架', detail: '1. 竞争格局分析 → 2. 舆情信号解读 → 3. 个性化建议' },
            { phase: 'tool', title: '查询热度数据', detail: { tool: 'metrics_lookup', reasoning: '获取目标院校最新MHI数据' } },
            { phase: 'tool_result', title: '热度数据返回', detail: 'MHI=72, 环比+35%, 样本量3420' },
            { phase: 'debate', title: '多Agent讨论', detail: 'Agent-A: 热度上升信号明确; Agent-B: 需警惕推免挤压风险; 共识: 建议关注但不盲目' },
          ] : [],
          cards: m.role === 'agent' ? [
            { school: conv.messages[0]?.content?.includes('浙大') ? '浙江大学' : '华中科技大学', major: '计算机科学与技术', heat: 72, mom_growth: 0.35, discouragement: 0.18, trend: 'rising', confidence: '高' },
          ] : [],
        })),
      });
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
      return jsonResponse({ items: MOCK_REPORTS.map(r => ({ ...r, candidates: [r.school + '·' + r.major] })) });
    }
    if (path === '/api/reports/generate') {
      const newId = 'rpt-new-' + Date.now();
      return jsonResponse({ id: newId, status: 'completed', report: { ...MOCK_REPORTS[0], id: newId } });
    }
    if (path.startsWith('/api/reports/')) {
      const id = path.split('/api/reports/')[1];
      if (id.endsWith('/share')) return jsonResponse({ share_url: '/api/reports/' + id.replace('/share', '') + '/shared' });
      if (method === 'DELETE') return jsonResponse({ ok: true });
      if (method === 'POST') return jsonResponse({ share_url: '/shared/' + id });
      const base = MOCK_REPORTS.find(r => r.id === id) || MOCK_REPORTS[0];
      return jsonResponse({
        id: base?.id || id,
        title: base?.title || '考研择校深度分析报告',
        school: base?.school || '浙江大学',
        major: base?.major || '计算机科学与技术',
        created_at: base?.generated_at || new Date().toISOString(),
        generated_at: base?.generated_at || new Date().toISOString(),
        status: 'completed',
        content: {
          candidates: [{
            input: { school: base?.school || '浙江大学', major: base?.major || '计算机科学与技术' },
            heat: { school: base?.school || '浙江大学', major: base?.major || '计算机科学与技术', mhi: 72, mom_growth: 0.35, self_fulfilling_signal: 'heating_up' },
            discouragement: { discouragement_index: 0.18 },
            baoyan: { baoyan_pressure: 0.32 },
            info_gap: { info_gap: 0.15, discipline_evaluation: 'A+' },
            initial_vs_reexam: { initial_discussion: 8500, reexam_discussion: 4200 },
            enrollment: { series: [
              { year: 2023, planned: 85, exemption: 45 },
              { year: 2024, planned: 80, exemption: 48 },
              { year: 2025, planned: 75, exemption: 50 },
            ]},
            score_lines: { series: [
              { year: 2023, total: 365 },
              { year: 2024, total: 375 },
              { year: 2025, total: 385 },
            ]},
            sentiment: { distribution: { anxious: { ratio: 0.17 }, optimistic: { ratio: 0.38 }, neutral: { ratio: 0.45 }, discouraging: { ratio: 0.08 } } },
            posts: { posts: [
              { snippet: '今年分数线可能会继续上涨', platform: 'zhihu' },
              { snippet: '推免比例越来越高', platform: 'xiaohongshu' },
            ]},
            advisor: { by_direction: [
              { direction: '学术型', mentions: 245, negative_ratio: 0.15 },
              { direction: '专业型', mentions: 380, negative_ratio: 0.22 },
            ]},
            predict_score: { predicted_interval: [375, 395], adjustment: { value: 5 }, trend_slope_per_year: 8.5 },
            predict_heat: { direction: 'rising', momentum_7d_vs_prev7d: 0.25, momentum_30d_vs_prev30d: 0.18, rationale: '报名季临近，热度持续走高' },
          }],
          profile: {
            background: { school_tier: '985', major: '计算机科学与技术', gpa_rank: 'top20%' },
            motivation: '提升学历，进入头部高校研究平台',
            risk_preference: 'balanced',
            priorities: ['学科实力', '就业去向', '城市区位'],
            hard_constraints: ['不考虑西北地区'],
            anxiety_points: '担心推免比例继续扩大',
            inferred_profile: {
              decision_style: '数据驱动型',
              key_dimensions: ['热度趋势', '信息差', '报录比'],
              sensitive_signals: ['推免比例变化', '复试线波动'],
            },
          },
          stage: { stage_name: '强化冲刺期' },
          disclaimer: '以上数据基于公开平台讨论内容分析，仅供参考，不代表官方统计数据。建议结合招生简章等官方信息综合判断。',
        },
        content_markdown: '## Agent 综合分析\n\n### 整体评估\n浙江大学计算机科学与技术学科评估A+，是国内Top 3级别的计算机学科。当前MHI热度指数72分，环比上升35%。\n\n### 核心发现\n1. **推免挤压**：推免占比约55%，统考名额60-70人\n2. **热度趋势**：近7日动量+25%，预计10月报名期间达峰值\n3. **信息差**：+0.15，讨论热度与学科实力基本匹配\n4. **情绪分布**：正面38%，中性45%，负面17%\n\n### 建议\n- 以浙大CS为主目标，同步准备南大软院作为保底\n- 数学和专业课是核心拉分项\n- 关注9月招生简章推免比例变化',
      });
    }

    // ── Sentiment ──
    if (path.startsWith('/api/sentiment/cross-platform')) {
      return jsonResponse({
        platforms: [
          { name: '知乎', platform: 'zhihu', posts: 1243, post_count: 1243, sentiment_score: 0.62, top_keywords: ['推免', '分数线', '复试'] },
          { name: '贴吧', platform: 'tieba', posts: 876, post_count: 876, sentiment_score: 0.55, top_keywords: ['卷', '保研', '统考'] },
          { name: '小红书', platform: 'xiaohongshu', posts: 654, post_count: 654, sentiment_score: 0.71, top_keywords: ['性价比', '就业', '城市'] },
          { name: 'B站', platform: 'bilibili', posts: 321, post_count: 321, sentiment_score: 0.68, top_keywords: ['经验贴', '复习', '规划'] },
        ],
      });
    }
    if (path.startsWith('/api/sentiment/trending-topics')) {
      return jsonResponse({
        topics: [
          { topic: '推免比例上涨', keyword: '推免比例上涨', heat: 0.85, trend: 'rising' },
          { topic: '复试线预测', keyword: '复试线预测', heat: 0.72, trend: 'stable' },
          { topic: '就业去向', keyword: '就业去向', heat: 0.65, trend: 'rising' },
          { topic: '导师评价', keyword: '导师评价', heat: 0.58, trend: 'falling' },
          { topic: '跨考经验', keyword: '跨考经验', heat: 0.52, trend: 'rising' },
          { topic: '保研名额', keyword: '保研名额', heat: 0.48, trend: 'stable' },
          { topic: '调剂信息', keyword: '调剂信息', heat: 0.42, trend: 'falling' },
          { topic: '真题分享', keyword: '真题分享', heat: 0.38, trend: 'rising' },
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
        series: {
          '计算机科学与技术': [
            { sentiment_score: 0.72, month: '2025-04' },
            { sentiment_score: 0.68, month: '2025-06' },
            { sentiment_score: 0.71, month: '2025-08' },
            { sentiment_score: 0.75, month: '2025-10' },
            { sentiment_score: 0.73, month: '2025-12' },
          ],
        },
      });
    }
    if (path.startsWith('/api/sentiment/posts')) {
      return jsonResponse({
        posts: [
          { platform: 'zhihu', published_at: new Date(Date.now() - 3600000).toISOString(), sentiment: 'neutral', snippet: '今年考研竞争依然激烈，建议大家做好充分准备' },
          { platform: 'xiaohongshu', published_at: new Date(Date.now() - 7200000).toISOString(), sentiment: 'positive', snippet: '分享我的备考经验，坚持就是胜利！' },
          { platform: 'tieba', published_at: new Date(Date.now() - 10800000).toISOString(), sentiment: 'negative', snippet: '报录比太高了，有点劝退...' },
          { platform: 'zhihu', published_at: new Date(Date.now() - 86400000).toISOString(), sentiment: 'neutral', snippet: '关于择校的一些思考和建议' },
          { platform: 'bilibili', published_at: new Date(Date.now() - 86400000 * 2).toISOString(), sentiment: 'positive', snippet: '考研复习vlog｜今天效率不错' },
          { platform: 'xiaohongshu', published_at: new Date(Date.now() - 86400000 * 3).toISOString(), sentiment: 'neutral', snippet: '整理了各科复习时间线，供参考' },
        ],
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
      if (method === 'POST') return jsonResponse({ marked: MOCK_NOTIFICATIONS.filter(n => !n.read).length });
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
      if (method === 'POST') return jsonResponse({ id: 'custom-' + Date.now(), name: '自定义场景', status: 'pending' });
      return jsonResponse({
        items: MOCK_SCENES.map(s => ({
          ...s,
          tagline: s.description,
          channels: ['nature', 'ambient'],
          status: 'approved',
          visibility: 'public',
        })),
        template_quota: { limit: 5, used: 2 },
      });
    }
    if (path === '/api/study/scenes/community') {
      return jsonResponse({
        items: [
          { id: 'comm-1', name: '海边日落', tagline: '海浪轻拍沙滩，夕阳染红天际', channels: ['ocean', 'waves'], image_url: 'assets/scenes/ocean-cove.jpg', author: 'user3', status: 'approved', visibility: 'public' },
          { id: 'comm-2', name: '山间溪流', tagline: '清澈溪水潺潺，鸟鸣声声', channels: ['stream', 'birds'], image_url: 'assets/scenes/misty-hills.jpg', author: 'user5', status: 'approved', visibility: 'public' },
        ],
      });
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
        by_scene: [
          { scene: 'report', source: 'llm', calls: 8934, tokens: 4500000 },
          { scene: 'chat', source: 'llm', calls: 23456, tokens: 12000000 },
          { scene: 'study', source: 'llm', calls: 15678, tokens: 8000000 },
          { scene: 'template', source: 'llm', calls: 3421, tokens: 1500000 },
        ],
      });
    }
    if (path === '/api/admin/channels') {
      if (method === 'POST') return jsonResponse({ id: 'ch-new', model: 'deepseek-chat' });
      return jsonResponse({
        items: [
          { id: 'ch-1', label: 'DeepSeek 主通道', model: 'deepseek-chat', base_url: 'https://api.deepseek.com/v1', api_key: 'sk-****abcd', name: '知乎考研话题', platform: 'zhihu', status: 'active', last_crawl: new Date().toISOString(), posts_total: 45230 },
          { id: 'ch-2', label: 'Qwen 备用通道', model: 'qwen-plus', base_url: 'https://dashscope.aliyuncs.com/v1', api_key: 'sk-****efgh', name: '贴吧考研吧', platform: 'tieba', status: 'active', last_crawl: new Date().toISOString(), posts_total: 89120 },
        ],
        active_id: 'ch-1',
      });
    }
    if (path.startsWith('/api/admin/channels/') && path.endsWith('/activate')) {
      return jsonResponse({ model: 'deepseek-chat' });
    }
    if (path.startsWith('/api/admin/channels/') && path.endsWith('/test')) {
      return jsonResponse({ ok: true });
    }
    if (path.startsWith('/api/admin/channels/')) {
      if (method === 'DELETE') return jsonResponse({ ok: true });
      return jsonResponse({ ok: true });
    }
    if (path === '/api/admin/codes') {
      if (method === 'POST') return jsonResponse({ codes: ['GY-' + Date.now().toString(36).toUpperCase()] });
      return jsonResponse({
        items: [
          { code: 'GY-DEMO-001', report_add: 3, chat_add: 10, study_add: 5, template_add: 0, used_count: 12, max_uses: 100, note: '演示邀请码', created_at: new Date().toISOString() },
          { code: 'GY-VIP-2025', report_add: 99, chat_add: 99, study_add: 99, template_add: 10, used_count: 45, max_uses: 200, note: 'VIP 全量额度', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { code: 'GY-TRIAL-01', report_add: 1, chat_add: 3, study_add: 2, template_add: 0, used_count: 1, max_uses: 5, note: '试用码', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
        ],
      });
    }
    if (path === '/api/admin/llm-presets') {
      if (method === 'PUT') return jsonResponse({ ok: true });
      return jsonResponse({
        items: [
          { id: 'deepseek', label: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'], model: 'deepseek-chat' },
          { id: 'qwen', label: '通义千问 Qwen（百炼）', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-flash'], model: 'qwen-plus' },
          { id: 'zhipu', label: '智谱 GLM', base_url: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4.7-flash', 'glm-4.7', 'glm-5', 'glm-5.3'], model: 'glm-4.7-flash' },
          { id: 'custom', label: '自定义（OpenAI 兼容）', base_url: '', models: [], model: '' },
        ],
      });
    }
    if (path === '/api/admin/search-config') {
      if (method === 'PUT') return jsonResponse({ ok: true });
      return jsonResponse({
        bocha: { configured: true, key_masked: 'sk-****efgh', enabled: true },
        tavily: { configured: false, key_masked: '', enabled: false },
        queries_per_run: 5,
        freshness: 24,
        results_per_query: 10,
      });
    }
    if (path === '/api/admin/data-inventory') {
      return jsonResponse({
        posts: {
          real: 1567890,
          labeled: 892000,
          span: ['2024-01-15', new Date().toISOString().slice(0, 10)],
          demo: 1567890,
          by_platform: [
            { platform: 'zhihu', count: 456000 },
            { platform: 'tieba', count: 891000 },
            { platform: 'xhs', count: 134000 },
            { platform: 'bili', count: 86890 },
          ],
        },
        reference: { schools: SCHOOLS.length, majors: MAJORS.length, pairs: SCHOOLS.length * 5 },
        official: { score_lines: 450, enrollments: 380 },
        metrics: { daily_stats: 365, snapshots: 1200 },
        storage_mb: 2456,
        contributors: [
          { username: 'user1', count: 45230 },
          { username: 'user3', count: 38120 },
          { username: 'user5', count: 21450 },
        ],
      });
    }
    if (path === '/api/admin/platform-auths') {
      return jsonResponse({
        items: [
          { user_id: 1, username: 'user1', platform: 'zhihu', status: 'active', cookie_masked: 'z_c0=****abcd', last_used_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() },
          { user_id: 3, username: 'user3', platform: 'xhs', status: 'active', cookie_masked: 'web_session=****efgh', last_used_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date().toISOString() },
          { user_id: 5, username: 'user5', platform: 'tieba', status: 'expired', cookie_masked: 'BDUSS=****ijkl', last_used_at: new Date(Date.now() - 86400000 * 3).toISOString(), updated_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { user_id: 8, username: 'user8', platform: 'bili', status: 'active', cookie_masked: 'SESSDATA=****mnop', last_used_at: new Date(Date.now() - 1800000).toISOString(), updated_at: new Date().toISOString() },
        ],
      });
    }
    if (path === '/api/admin/role-audit') {
      return jsonResponse({ items: [] });
    }
    if (path === '/api/admin/users') {
      const page = parseInt(getParam(fullUrl, 'page')) || 1;
      const pageSize = 20;
      const start = (page - 1) * pageSize;
      return jsonResponse({
        total: MOCK_USERS.length,
        items: MOCK_USERS.slice(start, start + pageSize).map(u => ({
          ...u,
          byok: u.has_byok,
          quota: {
            report: { limit: 999, used: Math.floor(Math.random() * 10) },
            chat: { limit: 999, used: Math.floor(Math.random() * 50) },
            study: { limit: 999, used: Math.floor(Math.random() * 30) },
            template: { limit: 999, used: Math.floor(Math.random() * 5) },
          },
        })),
      });
    }
    if (path.startsWith('/api/admin/users/') && path.endsWith('/key')) {
      const userId = path.split('/api/admin/users/')[1].split('/')[0];
      const user = MOCK_USERS.find(u => u.id === parseInt(userId)) || MOCK_USERS[0];
      return jsonResponse({ username: user.username, model: 'deepseek-chat', api_key: 'sk-****' + user.username.slice(-4) });
    }
    if (path.startsWith('/api/admin/users/') && path.endsWith('/quota')) {
      if (method === 'POST' || method === 'PUT') return jsonResponse({ ok: true });
      return jsonResponse({ report: { limit: 999, used: 3 }, chat: { limit: 999, used: 12 }, study: { limit: 999, used: 28 }, template: { limit: 999, used: 1 } });
    }
    if (path.startsWith('/api/admin/users/') && path.endsWith('/role')) {
      if (method === 'POST') return jsonResponse({ ok: true });
      return jsonResponse({ ok: true });
    }
    if (path.startsWith('/api/admin/users/')) {
      return jsonResponse({ ok: true });
    }
    if (path === '/api/admin/scene-reviews') {
      return jsonResponse({
        items: [
          { id: 'scene-r-1', name: '春日樱花林', image_url: 'assets/scenes/forest-cabin.jpg', status: 'pending', visibility: 'public', tagline: '樱花纷飞的林间小道', uploader: 'user3', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), review_note: '', channels: ['nature', 'birds', 'stream'] },
          { id: 'scene-r-2', name: '雨夜书房', image_url: 'assets/scenes/rainy-cafe.jpg', status: 'approved', visibility: 'public', tagline: '窗外雨声，桌上暖灯', uploader: 'user5', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), review_note: '质量很好', channels: ['rain', 'indoor', 'ambient'] },
          { id: 'scene-r-3', name: '星空帐篷', image_url: 'assets/scenes/snow-mountain.jpg', status: 'rejected', visibility: 'private', tagline: '高原星空下的露营', uploader: 'user8', created_at: new Date(Date.now() - 86400000 * 8).toISOString(), review_note: '图片分辨率不足', channels: ['nature', 'wind'] },
        ],
      });
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

  // Suppress onboarding modals in demo mode
  localStorage.setItem('gy_model_onboard', 'done');
  localStorage.setItem('gy_pa_onboard', 'done');
  sessionStorage.setItem('gy_ob_skipped', '1');

  console.log('%c[研屿 Demo] Mock API layer loaded. All /api/* calls intercepted.', 'color: #6db3a3; font-weight: bold;');
})();
