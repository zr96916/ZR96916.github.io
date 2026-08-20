/* 智慧食安业务闭环原型 · 集中业务动作 */
(function () {
  const data = () => window.SFSData.getDB();
  const save = (db) => window.SFSData.saveDB(db);
  const stamp = () => new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');

  const CLOSED = ['已办结'];
  const MERCHANT_TODO = ['待整改', '驳回待补正'];
  const IN_REVIEW = ['整改待审核', '申诉审核中'];

  function notify(db, text, type = 'success') {
    db.notifications.unshift({ id: 'N-' + Date.now(), text, type, time: stamp() });
    db.notifications = db.notifications.slice(0, 8);
  }

  function getWorkOrder(db, id) {
    const item = db.workOrders.find((w) => w.id === id);
    if (!item) throw new Error('未找到工单 ' + id);
    return item;
  }

  function getApproval(db, id) {
    const item = db.approvals.find((a) => a.id === id);
    if (!item) throw new Error('未找到审批 ' + id);
    return item;
  }

  function uniqueId(prefix) {
    return `${prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 900 + 100)}`;
  }

  function acceptRisk(alertId) {
    const db = data();
    const alert = db.alerts.find((a) => a.id === alertId);
    if (!alert) return { ok: false, message: '未找到告警' };
    if (alert.status !== '待复核') return { ok: false, message: '该告警已处理' };
    const id = uniqueId('WO');
    const workOrder = {
      id, merchantId: alert.merchantId, merchantName: alert.merchantName, town: alert.town,
      title: alert.type, source: alert.id, category: 'AI 告警整改', priority: alert.level, status: '待整改',
      dueAt: '次日 18:00 前', createdAt: stamp(), evidence: alert.evidence, requirement: '请按证据描述完成整改，上传现场照片、记录或培训证明。', correction: null,
      timeline: [
        { time: alert.createdAt, actor: 'AI 巡检', action: '识别风险', note: `${alert.type}，置信度 ${Math.round(alert.confidence * 100)}%` },
        { time: stamp(), actor: '监管员', action: '采纳告警', note: `生成整改工单 ${id}` }
      ]
    };
    alert.status = '已采纳';
    alert.workOrderId = id;
    db.workOrders.unshift(workOrder);
    notify(db, `已采纳 ${alert.id}，生成工单 ${id}`);
    save(db);
    return { ok: true, message: '已采纳并生成工单', id };
  }

  function ignoreRisk(alertId, reason) {
    if (!reason || !reason.trim()) return { ok: false, message: '请填写忽略原因' };
    const db = data();
    const alert = db.alerts.find((a) => a.id === alertId);
    if (!alert) return { ok: false, message: '未找到告警' };
    if (alert.status !== '待复核') return { ok: false, message: '该告警已处理' };
    alert.status = '已忽略';
    alert.ignoredReason = reason.trim();
    alert.reviewedAt = stamp();
    notify(db, `已忽略 ${alert.id}：${reason.trim()}`);
    save(db);
    return { ok: true, message: '已忽略告警' };
  }

  function submitCorrection(workOrderId, text, images) {
    if (!text || !text.trim()) return { ok: false, message: '请填写整改说明' };
    const db = data();
    const wo = getWorkOrder(db, workOrderId);
    if (!['待整改', '驳回待补正'].includes(wo.status)) return { ok: false, message: '当前状态不可提交整改' };
    wo.status = '整改待审核';
    wo.correction = { submittedAt: stamp(), text: text.trim(), images: images && images.length ? images : ['现场整改照片'] };
    delete wo.rejectReason;
    wo.timeline.push({ time: stamp(), actor: wo.merchantName, action: '提交整改', note: text.trim() });
    db.approvals.unshift({ id: uniqueId('AP-WO'), type: '整改审核', objectId: wo.id, merchantId: wo.merchantId, merchantName: wo.merchantName, town: wo.town, status: '待镇级审核', submittedAt: stamp(), summary: wo.title + '整改待审核' });
    notify(db, `${wo.id} 已提交整改，等待镇级审核`);
    save(db);
    return { ok: true, message: '整改已提交' };
  }

  function resubmitCorrection(workOrderId, text, images) { return submitCorrection(workOrderId, text, images); }

  function submitAppeal(workOrderId, reason, files) {
    if (!reason || !reason.trim()) return { ok: false, message: '请填写申诉理由' };
    const db = data();
    const wo = getWorkOrder(db, workOrderId);
    if (!['待整改', '驳回待补正'].includes(wo.status)) return { ok: false, message: '当前状态不可发起申诉' };
    wo.status = '申诉审核中';
    wo.appeal = { submittedAt: stamp(), reason: reason.trim(), files: files && files.length ? files : ['申诉证明材料'] };
    wo.timeline.push({ time: stamp(), actor: wo.merchantName, action: '发起申诉', note: reason.trim() });
    db.approvals.unshift({ id: uniqueId('AP-APPEAL'), type: '申诉审核', objectId: wo.id, merchantId: wo.merchantId, merchantName: wo.merchantName, town: wo.town, status: '待镇级审核', submittedAt: stamp(), summary: wo.title + '申诉待审核' });
    notify(db, `${wo.id} 已发起申诉`);
    save(db);
    return { ok: true, message: '申诉已提交' };
  }

  function requestMerchantChange(merchantId, payload) {
    const db = data();
    const m = db.merchants.find((x) => x.id === merchantId);
    if (!m) return { ok: false, message: '未找到主体' };
    const id = uniqueId('AP-CHANGE');
    db.approvals.unshift({ id, type: '主体变更', objectId: m.id, merchantId: m.id, merchantName: m.name, town: m.town, status: '待镇级审核', submittedAt: stamp(), summary: `主体档案变更：${payload.summary || '联系方式/经营信息'}`, payload });
    notify(db, `${m.name} 主体变更已提交`);
    save(db);
    return { ok: true, message: '变更申请已提交', id };
  }

  function requestUnbind(merchantId, deviceId, reason) {
    const db = data();
    const m = db.merchants.find((x) => x.id === merchantId);
    if (!m) return { ok: false, message: '未找到主体' };
    const id = uniqueId('AP-UNBIND');
    db.approvals.unshift({ id, type: '解绑审核', objectId: deviceId, merchantId: m.id, merchantName: m.name, town: m.town, status: '待镇级审核', submittedAt: stamp(), summary: `申请解绑设备 ${deviceId}`, payload: { deviceId, reason: reason || '设备迁移' } });
    notify(db, `${m.name} 解绑申请已提交`);
    save(db);
    return { ok: true, message: '解绑申请已提交', id };
  }

  function approve(approvalId, comment) {
    const db = data();
    const ap = getApproval(db, approvalId);
    if (!ap.status.startsWith('待')) return { ok: false, message: '该审批已处理' };
    ap.status = '已通过';
    ap.reviewedAt = stamp();
    ap.comment = comment || '审核通过';
    applyApprovalResult(db, ap, true, ap.comment);
    notify(db, `${ap.type} ${ap.id} 已通过`);
    save(db);
    return { ok: true, message: '审批已通过' };
  }

  function reject(approvalId, reason) {
    if (!reason || !reason.trim()) return { ok: false, message: '驳回原因必填' };
    const db = data();
    const ap = getApproval(db, approvalId);
    if (!ap.status.startsWith('待')) return { ok: false, message: '该审批已处理' };
    ap.status = '已驳回';
    ap.reviewedAt = stamp();
    ap.rejectReason = reason.trim();
    applyApprovalResult(db, ap, false, reason.trim());
    notify(db, `${ap.type} ${ap.id} 已驳回：${reason.trim()}`, 'warn');
    save(db);
    return { ok: true, message: '审批已驳回' };
  }

  function applyApprovalResult(db, ap, passed, reason) {
    if (ap.type === '整改审核') {
      const wo = getWorkOrder(db, ap.objectId);
      wo.status = passed ? '已办结' : '驳回待补正';
      wo.result = passed ? '整改通过' : '整改驳回';
      if (!passed) wo.rejectReason = reason;
      wo.timeline.push({ time: stamp(), actor: '镇级监管员', action: passed ? '审核通过' : '驳回补正', note: reason });
    }
    if (ap.type === '申诉审核') {
      const wo = getWorkOrder(db, ap.objectId);
      wo.status = passed ? '已办结' : '待整改';
      wo.result = passed ? '申诉通过，工单关闭' : '申诉不通过，继续整改';
      if (!passed) wo.rejectReason = reason;
      wo.timeline.push({ time: stamp(), actor: '镇级监管员', action: passed ? '申诉通过' : '申诉驳回', note: reason });
    }
    if (ap.type === '主体变更' && passed) {
      const m = db.merchants.find((x) => x.id === ap.merchantId);
      Object.assign(m, ap.payload || {});
    }
    if (ap.type === '绑定审核' && passed) {
      const deviceId = ap.payload && ap.payload.deviceId;
      const m = db.merchants.find((x) => x.id === ap.merchantId);
      const d = db.devices.find((x) => x.id === deviceId);
      if (m && d) { d.merchantId = m.id; d.status = '在线'; d.issue = ''; if (!m.devices.includes(deviceId)) m.devices.push(deviceId); m.bindStatus = '已绑定'; }
    }
    if (ap.type === '解绑审核' && passed) {
      const deviceId = ap.payload && ap.payload.deviceId;
      const m = db.merchants.find((x) => x.id === ap.merchantId);
      const d = db.devices.find((x) => x.id === deviceId);
      if (m) m.devices = m.devices.filter((id) => id !== deviceId);
      if (d) { d.merchantId = null; d.status = '待关联'; d.issue = '已解绑，待重新关联'; }
      if (m && m.devices.length === 0) m.bindStatus = '未关联设备';
    }
  }

  function stats(role, town) {
    const db = data();
    const townFilter = (x) => role === 'town' ? x.town === town : true;
    const workOrders = db.workOrders.filter(townFilter);
    const approvals = db.approvals.filter(townFilter);
    const alerts = db.alerts.filter(townFilter);
    const merchants = db.merchants.filter(townFilter);
    return {
      merchantTodo: workOrders.filter((w) => MERCHANT_TODO.includes(w.status)).length,
      inReview: workOrders.filter((w) => IN_REVIEW.includes(w.status)).length,
      closed: workOrders.filter((w) => CLOSED.includes(w.status)).length,
      pendingApprovals: approvals.filter((a) => a.status.startsWith('待')).length,
      pendingAlerts: alerts.filter((a) => a.status === '待复核').length,
      licenseExpiring: merchants.filter((m) => new Date(m.licenseExpire) <= new Date('2026-09-30')).length,
      unboundDevices: db.devices.filter((d) => townFilter(d) && (!d.merchantId || d.status === '待关联')).length,
      totalMerchants: merchants.length,
      trend: db.trend
    };
  }

  function merchantBuckets(merchantId) {
    const db = data();
    const list = db.workOrders.filter((w) => w.merchantId === merchantId);
    return {
      todo: list.filter((w) => MERCHANT_TODO.includes(w.status)),
      review: list.filter((w) => IN_REVIEW.includes(w.status)),
      done: list.filter((w) => CLOSED.includes(w.status))
    };
  }

  window.SFSFlow = { acceptRisk, ignoreRisk, submitCorrection, resubmitCorrection, submitAppeal, requestMerchantChange, requestUnbind, approve, reject, stats, merchantBuckets };
})();
