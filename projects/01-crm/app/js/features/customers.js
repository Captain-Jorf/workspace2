(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  const selected = new Set();
  let sort = { key: "next", dir: 1 };

  function reset() {
    selected.clear();
    sort = { key: "next", dir: 1 };
  }

  function activeCols() {
    const chosen = S().state.ui.cols || cfg.DEFAULT_COLS;
    return cfg.COLUMNS.filter((c) => chosen.indexOf(c.k) >= 0);
  }

  const valueOf = {
    name: (l) => l.name,
    phone: (l) => l.phone,
    source: (l) => l.source,
    stage: (l) => bizOf().stages[l.stage],
    amount: (l) => (l.amount ? UI.groupFa(l.amount) : "—"),
    next: (l) => UI.jalali(l.next),
    created: (l) => UI.jalali(l.createdAt)
  };

  const sortValue = {
    name: (l) => l.name,
    phone: (l) => l.phone,
    source: (l) => l.source,
    stage: (l) => l.stage,
    amount: (l) => l.amount,
    next: (l) => l.next,
    created: (l) => l.createdAt
  };

  function renderHead() {
    const head = $("custHead");
    head.textContent = "";
    const all = UI.el("input", "pick");
    all.type = "checkbox";
    all.setAttribute("aria-label", "انتخاب همه");
    const visible = visibleLeads();
    all.checked = visible.length > 0 && visible.every((l) => selected.has(l.id));
    all.addEventListener("change", () => {
      visible.forEach((l) => (all.checked ? selected.add(l.id) : selected.delete(l.id)));
      render();
    });
    const th0 = UI.el("th");
    th0.appendChild(all);
    head.appendChild(th0);
    activeCols().forEach((c) => {
      const th = UI.el("th", "sortable", c.l + (sort.key === c.k ? (sort.dir > 0 ? " ▲" : " ▼") : ""));
      th.addEventListener("click", () => {
        sort = { key: c.k, dir: sort.key === c.k ? -sort.dir : 1 };
        render();
      });
      head.appendChild(th);
    });
  }

  function visibleLeads() {
    const get = sortValue[sort.key] || sortValue.next;
    return S().bizLeads().filter((l) => CRM.app.matches(l)).sort((a, b) => {
      const x = get(a), y = get(b);
      if (x < y) return -sort.dir;
      if (x > y) return sort.dir;
      return 0;
    });
  }

  function renderBulk() {
    const bar = $("custBulk");
    bar.hidden = selected.size === 0;
    $("custCount").textContent = UI.toFa(selected.size) + " مورد انتخاب شده";
  }

  function render() {
    renderBulk();
    renderHead();
    const body = $("custBody");
    body.textContent = "";
    const cols = activeCols();
    const items = visibleLeads();
    items.forEach((l) => {
      const tr = UI.el("tr");
      if (selected.has(l.id)) tr.classList.add("picked");
      tr.addEventListener("click", (e) => {
        if (e.target.closest("input")) return;
        CRM.detail.open(l.id);
      });
      const pickCell = UI.el("td");
      const pick = UI.el("input", "pick");
      pick.type = "checkbox";
      pick.checked = selected.has(l.id);
      pick.setAttribute("aria-label", "انتخاب " + l.name);
      pick.addEventListener("change", () => {
        if (pick.checked) selected.add(l.id); else selected.delete(l.id);
        render();
      });
      pickCell.appendChild(pick);
      tr.appendChild(pickCell);
      cols.forEach((c) => tr.appendChild(UI.el("td", "", valueOf[c.k](l))));
      body.appendChild(tr);
    });
    if (!items.length) {
      const tr = UI.el("tr");
      const td = UI.el("td", "empty", "موردی پیدا نشد.");
      td.colSpan = cols.length + 1;
      tr.appendChild(td);
      body.appendChild(tr);
    }
  }

  function exportCsv() {
    const store = S();
    const rows = [["نام", "موبایل", "منبع", "مرحله", "مبلغ", "پیگیری بعدی", "تاریخ ثبت", "توضیحات"]];
    S().bizLeads().forEach((l) => {
      rows.push([l.name, l.phone, l.source, bizOf().stages[l.stage], l.amount, UI.jalali(l.next), UI.jalali(l.createdAt), l.notes]);
    });
    UI.download("customers-" + store.state.business + ".csv", CRM.tools.toCsv(rows), "text/csv;charset=utf-8");
    UI.toast("فایل CSV ساخته شد.");
  }

  const HEADER_MAP = {
    name: ["نام", "name"],
    phone: ["موبایل", "شماره", "phone", "mobile"],
    source: ["منبع", "source"],
    stage: ["مرحله", "stage"],
    amount: ["مبلغ", "amount"]
  };

  function columnIndex(header, key) {
    const names = header.map((h) => UI.toEn(h).trim().toLowerCase());
    return names.findIndex((h) => HEADER_MAP[key].map((x) => x.toLowerCase()).indexOf(h) >= 0);
  }

  function openImport() {
    $("importResult").textContent = "";
    $("importResult").appendChild(UI.el("div", "empty", "هنوز فایلی انتخاب نشده است."));
    UI.openPanel("importModal");
  }

  function importText(text) {
    const store = S();
    const rows = CRM.tools.parseCsv(text);
    const result = $("importResult");
    result.textContent = "";
    if (rows.length < 2) {
      result.appendChild(UI.el("div", "over", "فایل خالی است یا فقط سرستون دارد."));
      return;
    }
    const header = rows[0];
    const idx = {};
    Object.keys(HEADER_MAP).forEach((k) => { idx[k] = columnIndex(header, k); });
    if (idx.name < 0 || idx.phone < 0) {
      result.appendChild(UI.el("div", "over", "ستون‌های «نام» و «موبایل» در فایل پیدا نشد."));
      return;
    }
    const stages = bizOf().stages;
    const known = new Set(store.bizLeads({}).concat(store.bizLeads({ archived: true })).map((l) => l.phone));
    let added = 0, duplicate = 0;
    const invalid = [];
    rows.slice(1).forEach((r, n) => {
      const name = (r[idx.name] || "").trim();
      const phone = UI.cleanPhone(r[idx.phone] || "");
      if (name.length < 2 || !UI.validPhone(phone)) { invalid.push(n + 2); return; }
      if (known.has(phone)) { duplicate++; return; }
      known.add(phone);
      const stageText = idx.stage >= 0 ? (r[idx.stage] || "").trim() : "";
      let stage = stages.indexOf(stageText);
      if (stage < 0) stage = 0;
      const amount = idx.amount >= 0 ? Number(UI.toEn(r[idx.amount] || "").replace(/[,٬\s]/g, "")) || 0 : 0;
      const source = idx.source >= 0 && r[idx.source] ? r[idx.source].trim() : "وارد شده از CSV";
      const lead = store.addLead({ name, phone, source, stage: stage >= 2 && !amount ? 1 : stage, stageSince: Date.now(), amount, next: Date.now() + 2 * UI.DAY });
      store.note(lead, "از فایل CSV وارد شد");
      added++;
    });
    store.save();
    CRM.app.render();
    result.appendChild(UI.el("div", "glass row-item", "اضافه شد: " + UI.toFa(added) + " مشتری"));
    result.appendChild(UI.el("div", "glass row-item", "تکراری و رد شد: " + UI.toFa(duplicate)));
    if (invalid.length) {
      result.appendChild(UI.el("div", "glass row-item", "ردیف‌های نامعتبر: " + invalid.slice(0, 10).map(UI.toFa).join("، ") + (invalid.length > 10 ? " و …" : "")));
    }
  }

  function duplicateGroups() {
    const map = new Map();
    S().bizLeads().forEach((l) => {
      if (!map.has(l.phone)) map.set(l.phone, []);
      map.get(l.phone).push(l);
    });
    return [...map.values()].filter((g) => g.length > 1).map((g) => g.sort((a, b) => a.createdAt - b.createdAt));
  }

  function openMerge() {
    const groups = duplicateGroups();
    const list = $("mergeList");
    list.textContent = "";
    if (!groups.length) {
      list.appendChild(UI.el("div", "empty", "مشتری تکراری پیدا نشد."));
      $("mRun").disabled = true;
    } else {
      $("mRun").disabled = false;
      groups.forEach((g) => {
        const item = UI.el("div", "glass row-item");
        const info = UI.el("div", "info");
        info.append(UI.el("div", "nm", g[0].phone + " · " + g.map((l) => l.name).join("، ")), UI.el("div", "meta", UI.toFa(g.length) + " رکورد؛ قدیمی‌ترین نگه داشته می‌شود"));
        item.appendChild(info);
        list.appendChild(item);
      });
    }
    UI.openPanel("mergeModal");
  }

  function mergeInto(primary, others) {
    const store = S();
    others.forEach((o) => {
      store.state.invoices.forEach((inv) => {
        if (inv.leadId === o.id) { inv.leadId = primary.id; inv.custName = primary.name; }
      });
      primary.log = primary.log.concat(o.log || []).sort((a, b) => b.t - a.t);
      primary.amount = Math.max(primary.amount || 0, o.amount || 0);
      primary.stage = Math.max(primary.stage, o.stage);
      primary.remindAt = Math.max(primary.remindAt || 0, o.remindAt || 0) || null;
      primary.notes = [primary.notes, o.notes].filter(Boolean).join("\n");
      primary.managerNote = [primary.managerNote, o.managerNote].filter(Boolean).join("\n");
      primary.source = primary.source || o.source;
      Object.keys(o.extra || {}).forEach((k) => { if (!primary.extra[k]) primary.extra[k] = o.extra[k]; });
      store.state.leads = store.state.leads.filter((l) => l.id !== o.id);
    });
    store.note(primary, "اطلاعات " + UI.toFa(others.length) + " رکورد تکراری ادغام شد");
  }

  function runMerge() {
    const groups = duplicateGroups();
    let merged = 0;
    groups.forEach((g) => {
      mergeInto(g[0], g.slice(1));
      merged += g.length - 1;
    });
    S().save();
    selected.clear();
    UI.closePanel("mergeModal");
    CRM.app.render();
    UI.toast(UI.toFa(merged) + " رکورد تکراری ادغام شد.");
  }

  function openCols() {
    const chosen = S().state.ui.cols || cfg.DEFAULT_COLS;
    const list = $("colsList");
    list.textContent = "";
    cfg.COLUMNS.forEach((c) => {
      const label = UI.el("label", "setting-row");
      const box = UI.el("input", "pick");
      box.type = "checkbox";
      box.checked = chosen.indexOf(c.k) >= 0;
      box.dataset.col = c.k;
      if (c.k === "name") box.disabled = true;
      label.append(UI.el("span", "", c.l), box);
      list.appendChild(label);
    });
    UI.openPanel("colsModal");
  }

  function saveCols() {
    const keys = [...document.querySelectorAll("#colsList input[data-col]")].filter((b) => b.checked).map((b) => b.dataset.col);
    S().state.ui.cols = keys.length ? keys : ["name"];
    S().save();
    UI.closePanel("colsModal");
    render();
  }

  function archiveSelected() {
    const ids = [...selected];
    selected.clear();
    CRM.ops.setArchived(ids, true);
    UI.toast(UI.toFa(ids.length) + " مورد بایگانی شد.");
  }

  $("custCsv").addEventListener("click", exportCsv);
  $("importBtn").addEventListener("click", openImport);
  $("iPick").addEventListener("click", () => $("csvFile").click());
  $("iClose").addEventListener("click", () => UI.closePanel("importModal"));
  $("iDone").addEventListener("click", () => UI.closePanel("importModal"));
  $("csvFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importText(String(reader.result));
    reader.readAsText(file, "utf-8");
  });
  $("mergeBtn").addEventListener("click", openMerge);
  $("mRun").addEventListener("click", runMerge);
  $("mCancel").addEventListener("click", () => UI.closePanel("mergeModal"));
  $("mClose").addEventListener("click", () => UI.closePanel("mergeModal"));
  $("colsBtn").addEventListener("click", openCols);
  $("colsDone").addEventListener("click", saveCols);
  $("colsClose").addEventListener("click", () => UI.closePanel("colsModal"));
  $("custArchive").addEventListener("click", archiveSelected);
  $("custClear").addEventListener("click", () => { selected.clear(); render(); });

  CRM.customers = { render, reset, mergeInto, selectedIds: () => [...selected] };
})(window.CRM);
