(function (CRM) {
  "use strict";

  const cfg = CRM.config;
  const DAY = cfg.DAY;

  const defaultProfile = () => ({ name: "کاربر دمو", role: "مدیر فروش", company: "" });
  const defaultUi = () => ({ collapsed: false, theme: "light", fontStep: 2, cols: cfg.DEFAULT_COLS.slice() });

  let state = null;

  function freshState() {
    return { business: null, leads: [], invoices: [], nextId: 1, nextInv: 1, profile: defaultProfile(), ui: defaultUi(), users: [], session: null };
  }

  function normalize(raw) {
    const base = freshState();
    const s = Object.assign(base, raw && typeof raw === "object" ? raw : {});
    s.leads = Array.isArray(s.leads) ? s.leads : [];
    s.invoices = Array.isArray(s.invoices) ? s.invoices : [];
    s.users = Array.isArray(s.users) ? s.users : [];
    s.profile = Object.assign(defaultProfile(), s.profile || {});
    s.ui = Object.assign(defaultUi(), s.ui || {});
    s.leads.forEach((l) => {
      l.createdAt = l.createdAt || l.stageSince || Date.now();
      l.archived = !!l.archived;
      l.notes = l.notes || "";
      l.managerNote = l.managerNote || "";
      l.log = Array.isArray(l.log) ? l.log : [];
      l.extra = l.extra || {};
    });
    s.invoices.forEach((i) => {
      if (!Array.isArray(i.payments)) {
        i.payments = i.paid ? [{ at: i.paid, amount: i.amount }] : [];
        delete i.paid;
      }
      i.notes = i.notes || "";
      i.draft = !!i.draft;
    });
    const maxId = s.leads.reduce((m, l) => Math.max(m, l.id || 0), 0);
    s.nextId = Math.max(s.nextId || 1, maxId + 1);
    const maxNo = s.invoices.reduce((m, i) => Math.max(m, i.no || 0), 0);
    s.nextInv = Math.max(s.nextInv || 1, maxNo + 1);
    return s;
  }

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(cfg.KEY)); } catch (e) { raw = null; }
    state = normalize(raw);
    return state;
  }

  function save() {
    localStorage.setItem(cfg.KEY, JSON.stringify(state));
    CRM.ui.$("sync").textContent = "ذخیره شد · روی دستگاه";
  }

  function seedLeads(b, now) {
    const c = cfg.BIZ[b];
    return c.names.map((name, i) => {
      const extra = {};
      c.fields.forEach((f, j) => {
        if (f.t === "num") extra[f.k] = (i + 1) * 1000000 * (j + 1);
        else if (f.t === "sel") extra[f.k] = f.o[(i + j) % f.o.length];
        else extra[f.k] = f.k === "address" ? "نمونه، تهران" : "نمونه";
      });
      return {
        id: state.nextId++, business: b, name,
        phone: "0912" + String(1111111 + i * 48611).padStart(7, "0").slice(0, 7),
        source: cfg.SOURCES[i % cfg.SOURCES.length], stage: cfg.STAGE_IDX[i],
        stageSince: now - DAY * (i + 1), createdAt: now - DAY * (i + 3), amount: cfg.AMOUNTS[i],
        next: now + cfg.OFFSETS[i] * DAY, extra, notes: "", managerNote: "", archived: false,
        log: [{ t: now - DAY * 5, text: "اطلاعیه ثبت شد" }]
      };
    });
  }

  function seedInvoices(b, now) {
    const list = state.leads.filter((l) => l.business === b);
    const plan = [{ i: 1, age: 4 }, { i: 2, age: 30 }, { i: 3, age: 20, paidAfter: 5 }, { i: 4, age: 6 }, { i: 5, age: 2 }];
    plan.forEach((p) => {
      const lead = list[p.i];
      if (!lead || !lead.amount) return;
      const issued = now - DAY * p.age;
      state.invoices.push({
        no: state.nextInv++, business: b, leadId: lead.id, custName: lead.name, amount: lead.amount,
        issued, due: issued + 14 * DAY,
        payments: p.paidAfter ? [{ at: issued + p.paidAfter * DAY, amount: lead.amount }] : [],
        draft: false, notes: ""
      });
    });
  }

  function ensureSeed(b) {
    const now = Date.now();
    if (!state.leads.some((l) => l.business === b)) state.leads.push(...seedLeads(b, now));
    if (!state.invoices.some((i) => i.business === b)) seedInvoices(b, now);
  }

  function note(lead, text) {
    lead.log = lead.log || [];
    lead.log.unshift({ t: Date.now(), text });
  }

  function bizLeads(options) {
    const opts = options || {};
    return state.leads.filter((l) => l.business === state.business && (opts.archived ? l.archived : !l.archived));
  }

  function leadById(id) {
    return state.leads.find((l) => l.id === id) || null;
  }

  function bizInvoices() {
    return state.invoices.filter((i) => i.business === state.business).sort((a, b) => b.no - a.no);
  }

  function invoicesFor(leadId) {
    return state.invoices.filter((i) => i.leadId === leadId).sort((a, b) => b.no - a.no);
  }

  function invPaid(inv) {
    return (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
  }

  function invRemaining(inv) {
    return Math.max(0, inv.amount - invPaid(inv));
  }

  function invStatus(inv) {
    if (inv.draft) return "draft";
    const paid = invPaid(inv);
    if (paid >= inv.amount) return "paid";
    if (inv.due < Date.now()) return "overdue";
    if (paid > 0) return "partial";
    return "issued";
  }

  const INV_LABEL = { draft: "پیش‌نویس", issued: "صادر شده", overdue: "معوق", partial: "پرداخت جزئی", paid: "پرداخت شده" };

  function addInvoice(data) {
    const inv = Object.assign({ no: state.nextInv++, payments: [], draft: false, notes: "" }, data);
    state.invoices.push(inv);
    return inv;
  }

  function removeInvoice(no) {
    state.invoices = state.invoices.filter((i) => !(i.no === no && i.business === state.business));
  }

  function addLead(data) {
    const lead = Object.assign({ id: state.nextId++, business: state.business, archived: false, notes: "", managerNote: "", log: [], extra: {}, createdAt: Date.now() }, data);
    state.leads.push(lead);
    return lead;
  }

  function removeLead(id) {
    const idx = state.leads.findIndex((l) => l.id === id);
    if (idx < 0) return null;
    const [removed] = state.leads.splice(idx, 1);
    return { lead: removed, index: idx };
  }

  function resetAll() {
    state = freshState();
    save();
    return state;
  }

  async function hashPw(password, salt) {
    const text = salt + ":" + password;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      const buf = await window.crypto.subtle.digest("SHA-256", new window.TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return "d" + (h >>> 0).toString(16);
  }

  const newSalt = () => Math.random().toString(36).slice(2, 10);
  const findUser = (phone) => state.users.find((u) => u.phone === phone) || null;
  const currentUser = () => (state.session ? findUser(state.session) : null);

  async function signUp(name, phone, password) {
    const salt = newSalt();
    const user = { phone, name, role: "کاربر", company: "", salt, hash: await hashPw(password, salt) };
    state.users.push(user);
    state.session = phone;
    state.profile = { name, role: user.role, company: user.company };
    save();
    return user;
  }

  async function signIn(phone, password) {
    const user = findUser(phone);
    if (!user) return { error: "no-user" };
    if ((await hashPw(password, user.salt)) !== user.hash) return { error: "bad-password" };
    state.session = user.phone;
    state.profile = { name: user.name, role: user.role, company: user.company };
    save();
    return { user };
  }

  function signOut() {
    state.session = null;
    save();
  }

  async function changePassword(oldPw, newPw) {
    const user = currentUser();
    if (!user) return { error: "no-session" };
    if ((await hashPw(oldPw, user.salt)) !== user.hash) return { error: "bad-password" };
    user.salt = newSalt();
    user.hash = await hashPw(newPw, user.salt);
    save();
    return { ok: true };
  }

  function updateProfile(profile) {
    state.profile = Object.assign(state.profile, profile);
    const user = currentUser();
    if (user) Object.assign(user, { name: state.profile.name, role: state.profile.role, company: state.profile.company });
    save();
  }

  function deleteAccount() {
    state.users = state.users.filter((u) => u.phone !== state.session);
    state = freshState();
    save();
  }

  CRM.store = {
    get state() { return state; },
    load, save, normalize, ensureSeed, note,
    bizLeads, leadById, bizInvoices, invoicesFor,
    invPaid, invRemaining, invStatus, INV_LABEL,
    addInvoice, removeInvoice, addLead, removeLead, resetAll,
    hashPw, findUser, currentUser, signUp, signIn, signOut, changePassword, updateProfile, deleteAccount
  };
})(window.CRM);
