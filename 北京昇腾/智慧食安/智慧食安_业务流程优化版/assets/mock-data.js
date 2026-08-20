/* 智慧食安业务闭环原型 · 共享模拟数据 */
(function () {
  const STORAGE_KEY = 'smartFoodSafetyDBV2';
  const VERSION = '2.0.0';

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  const seed = () => ({
    version: VERSION,
    updatedAt: now(),
    currentMerchantId: 'M-SX-001',
    merchants: [
      {
        id: 'M-SX-001', name: '晨禾早点铺', town: '东桥镇', address: '东桥镇农贸路 18 号', owner: '林海', phone: '138****0421',
        licenseNo: 'JY13301050001234', licenseExpire: '2026-09-18', riskLevel: '中风险', bindStatus: '已绑定',
        devices: ['D-CAM-101'], tags: ['小餐饮', '早餐', '学校周边'], lastInspection: '2026-08-03', score: 82,
        changeRequestId: 'AP-CHANGE-001', bindRequestId: 'AP-BIND-001', unbindRequestId: 'AP-UNBIND-001'
      },
      {
        id: 'M-SX-002', name: '清溪中央厨房', town: '清溪镇', address: '清溪镇产业园 4 幢', owner: '周敏', phone: '139****8066',
        licenseNo: 'JY13301050004567', licenseExpire: '2027-01-09', riskLevel: '高风险', bindStatus: '已绑定',
        devices: ['D-CAM-102'], tags: ['集体配餐', '重点单位'], lastInspection: '2026-08-02', score: 71
      },
      {
        id: 'M-SX-003', name: '山前卤味店', town: '东桥镇', address: '山前街 27 号', owner: '马燕', phone: '137****3308',
        licenseNo: 'JY13301050007890', licenseExpire: '2026-08-25', riskLevel: '低风险', bindStatus: '未关联设备',
        devices: [], tags: ['熟食', '证照临期'], lastInspection: '2026-07-29', score: 88
      }
    ],
    devices: [
      { id: 'D-CAM-101', name: '后厨明厨亮灶摄像头', merchantId: 'M-SX-001', town: '东桥镇', status: '在线', health: 96, lastHeartbeat: '2026-08-10 09:31', issue: '' },
      { id: 'D-CAM-102', name: '留样柜温控摄像头', merchantId: 'M-SX-002', town: '清溪镇', status: '离线', health: 42, lastHeartbeat: '2026-08-09 22:10', issue: '连续离线 11 小时' },
      { id: 'D-CAM-201', name: '新装 AI 抓拍设备', merchantId: null, town: '东桥镇', status: '待关联', health: 70, lastHeartbeat: '2026-08-10 08:20', issue: '未关联主体' }
    ],
    alerts: [
      {
        id: 'AI-20260810-001', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', type: '后厨未戴口罩', level: '高', status: '待复核',
        confidence: 0.91, createdAt: '2026-08-10 08:42', source: 'AI 视频巡检', evidence: ['08:42 操作间抓拍：从业人员未佩戴口罩', '连续 3 帧命中，置信度 91%'], suggestion: '建议采纳并派发限时整改工单。'
      },
      {
        id: 'AI-20260810-002', merchantId: 'M-SX-002', merchantName: '清溪中央厨房', town: '清溪镇', type: '留样柜温度异常', level: '中', status: '已忽略',
        confidence: 0.67, createdAt: '2026-08-10 07:35', source: '物联温控', evidence: ['07:35 温度短时达到 9.1℃', '5 分钟后恢复 4.2℃'], suggestion: '已判定为开柜取样短时波动。', ignoredReason: '短时波动，记录留痕。'
      }
    ],
    workOrders: [
      {
        id: 'WO-20260810-001', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', title: '后厨从业人员未佩戴口罩', source: 'AI-20260810-001', category: 'AI 告警整改', priority: '高', status: '待整改', dueAt: '2026-08-11 18:00', createdAt: '2026-08-10 08:50',
        evidence: ['AI 告警 AI-20260810-001', '08:42 后厨操作间画面显示未佩戴口罩'], requirement: '完成员工个人防护培训，上传整改照片与培训记录。',
        correction: null,
        timeline: [
          { time: '2026-08-10 08:42', actor: 'AI 巡检', action: '识别风险', note: '后厨未戴口罩，置信度 91%' },
          { time: '2026-08-10 08:50', actor: '东桥镇监管员', action: '采纳告警', note: '生成整改工单 WO-20260810-001' }
        ]
      },
      {
        id: 'WO-20260809-004', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', title: '消毒柜台账缺失', source: '人工巡查', category: '日常巡查整改', priority: '中', status: '整改待审核', dueAt: '2026-08-10 18:00', createdAt: '2026-08-09 11:20',
        evidence: ['8 月 9 日巡查记录：消毒柜使用台账未填写'], requirement: '补齐 8 月 1 日至 9 日消毒记录并上传照片。',
        correction: { submittedAt: '2026-08-10 09:02', text: '已补齐消毒柜台账并安排专人每日闭店检查。', images: ['消毒台账照片', '责任人签字页'] },
        timeline: [
          { time: '2026-08-09 11:20', actor: '东桥镇监管员', action: '创建工单', note: '要求 24 小时内整改' },
          { time: '2026-08-10 09:02', actor: '晨禾早点铺', action: '提交整改', note: '上传台账照片 2 张' }
        ]
      },
      {
        id: 'WO-20260808-002', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', title: '晨检记录照片不清晰', source: '镇级审核', category: '整改补正', priority: '低', status: '驳回待补正', dueAt: '2026-08-11 12:00', createdAt: '2026-08-08 10:10',
        evidence: ['晨检记录缺少体温列', '上传照片反光严重'], requirement: '重新上传清晰完整的晨检记录。',
        correction: { submittedAt: '2026-08-08 16:21', text: '已上传晨检表照片。', images: ['晨检表照片'] }, rejectReason: '照片反光，无法核验体温列，请补拍。',
        timeline: [
          { time: '2026-08-08 10:10', actor: '系统', action: '生成工单', note: '晨检记录缺项' },
          { time: '2026-08-08 16:21', actor: '晨禾早点铺', action: '提交整改', note: '上传 1 张照片' },
          { time: '2026-08-09 09:08', actor: '东桥镇监管员', action: '驳回补正', note: '照片反光，无法核验体温列' }
        ]
      },
      {
        id: 'WO-20260807-006', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', title: '油烟净化器清洗记录争议', source: '人工巡查', category: '申诉', priority: '中', status: '申诉审核中', dueAt: '2026-08-12 18:00', createdAt: '2026-08-07 15:40',
        evidence: ['巡查照片显示清洗记录未在墙面公示'], requirement: '公示近 30 日油烟净化器清洗记录。',
        appeal: { submittedAt: '2026-08-08 10:30', reason: '记录存放于设备侧文件夹，巡查时未打开查看。', files: ['清洗记录扫描件', '设备侧文件夹照片'] },
        timeline: [
          { time: '2026-08-07 15:40', actor: '东桥镇监管员', action: '创建工单', note: '要求公示记录' },
          { time: '2026-08-08 10:30', actor: '晨禾早点铺', action: '发起申诉', note: '提交证明材料 2 份' }
        ]
      },
      {
        id: 'WO-20260805-003', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', title: '食品添加剂专区标识缺失', source: '日常巡查', category: '整改', priority: '低', status: '已办结', dueAt: '2026-08-06 18:00', createdAt: '2026-08-05 10:15',
        evidence: ['调料柜未张贴专区标识'], requirement: '张贴食品添加剂专区标识。', result: '整改通过',
        timeline: [
          { time: '2026-08-05 10:15', actor: '东桥镇监管员', action: '创建工单', note: '发现标识缺失' },
          { time: '2026-08-05 17:30', actor: '晨禾早点铺', action: '提交整改', note: '上传标识照片' },
          { time: '2026-08-06 09:10', actor: '东桥镇监管员', action: '审核通过', note: '整改闭环' }
        ]
      }
    ],
    approvals: [
      { id: 'AP-WO-001', type: '整改审核', objectId: 'WO-20260809-004', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', status: '待镇级审核', submittedAt: '2026-08-10 09:02', summary: '消毒柜台账缺失整改待审核' },
      { id: 'AP-APPEAL-001', type: '申诉审核', objectId: 'WO-20260807-006', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', status: '待镇级审核', submittedAt: '2026-08-08 10:30', summary: '油烟净化器清洗记录争议申诉' },
      { id: 'AP-CHANGE-001', type: '主体变更', objectId: 'M-SX-001', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', status: '待镇级审核', submittedAt: '2026-08-09 14:20', summary: '经营负责人手机号变更为 138****0421', payload: { phone: '138****0421', owner: '林海' } },
      { id: 'AP-BIND-001', type: '绑定审核', objectId: 'M-SX-003', merchantId: 'M-SX-003', merchantName: '山前卤味店', town: '东桥镇', status: '待镇级审核', submittedAt: '2026-08-10 08:15', summary: '申请绑定新装 AI 抓拍设备 D-CAM-201', payload: { deviceId: 'D-CAM-201' } },
      { id: 'AP-UNBIND-001', type: '解绑审核', objectId: 'D-CAM-101', merchantId: 'M-SX-001', merchantName: '晨禾早点铺', town: '东桥镇', status: '待镇级审核', submittedAt: '2026-08-09 16:00', summary: '设备迁移，申请解绑 D-CAM-101', payload: { deviceId: 'D-CAM-101' } }
    ],
    trend: [
      { day: '8/04', risks: 9, closed: 6 }, { day: '8/05', risks: 7, closed: 7 }, { day: '8/06', risks: 11, closed: 8 },
      { day: '8/07', risks: 8, closed: 5 }, { day: '8/08', risks: 12, closed: 9 }, { day: '8/09', risks: 10, closed: 8 }, { day: '8/10', risks: 6, closed: 4 }
    ],
    notifications: []
  });

  function initialize(force) {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing || force) {
      const db = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      window.dispatchEvent(new CustomEvent('sfs-db-change', { detail: db }));
      return clone(db);
    }
    try { return JSON.parse(existing); } catch (e) { return initialize(true); }
  }

  function getDB() { return initialize(false); }
  function saveDB(db) {
    db.updatedAt = now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent('sfs-db-change', { detail: clone(db) }));
    return clone(db);
  }
  function resetDB() { return initialize(true); }
  function subscribe(callback) {
    const localHandler = (event) => callback(clone(event.detail || getDB()));
    const storageHandler = (event) => { if (event.key === STORAGE_KEY) callback(getDB()); };
    window.addEventListener('sfs-db-change', localHandler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sfs-db-change', localHandler);
      window.removeEventListener('storage', storageHandler);
    };
  }
  function findMerchant(id) { return getDB().merchants.find((m) => m.id === id); }

  window.SFSData = { STORAGE_KEY, initialize, getDB, saveDB, resetDB, subscribe, findMerchant, clone };
  initialize(false);
})();
