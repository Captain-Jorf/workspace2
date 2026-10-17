(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  const selected = new Set();

  function reset() {
    selected.clear();
  }

  function toggle(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
  }

  function renderBulk() {
    const bar = $("noticeBulk");
    bar.hidden = selected.size === 0;
    $("noticeCount").textContent = UI.toFa(selected.size) + " مورد انتخاب شده";
    const sel = $("bulkStage");
    sel.textContent = "";
    const first = UI.el("option", "", "انتقال به مرحله…");
    first.value = "";
    sel.appendChild(first);
    bizOf().stages.forEach((s, i) => { const o = UI.el("option", "", s); o.value = String(i); sel.appendChild(o); });
  }

  function card(lead) {
    const c = UI.el("article", "glass card-lead" + (selected.has(lead.id) ? " picked" : ""));
    c.tabIndex = 0;
    c.draggable = true;
    c.dataset.id = lead.id;
    const d = UI.daysFromNow(lead.next);

    const head = UI.el("div", "head");
    const pick = UI.el("input", "pick");
    pick.type = "checkbox";
    pick.checked = selected.has(lead.id);
    pick.setAttribute("aria-label", "انتخاب " + lead.name);
    pick.addEventListener("change", () => { toggle(lead.id); CRM.app.render(); });
    head.append(pick, UI.el("div", "nm", lead.name));
    c.appendChild(head);

    c.appendChild(UI.el("div", "meta", lead.phone + " · " + lead.source));
    c.appendChild(UI.el("div", "amt", UI.money(lead.amount)));
    c.appendChild(UI.el("div", d < 0 ? "over" : d === 0 ? "today" : "meta", (d < 0 ? "عقب‌افتاده" : d === 0 ? "امروز" : "پیگیری") + " · " + UI.jalali(lead.next)));
    if (lead.remindAt) c.appendChild(UI.el("div", "rem", "یادآوری: " + UI.jalaliTime(lead.remindAt)));

    const row = UI.el("div", "row");
    const sel = UI.el("select");
    sel.setAttribute("aria-label", "تغییر مرحله " + lead.name);
    bizOf().stages.forEach((s, i) => {
      const o = UI.el("option", "", s);
      o.value = String(i);
      if (i === lead.stage) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => CRM.ops.moveLead(lead.id, Number(sel.value)));
    const call = UI.el("button", "btn sm call", "تماس");
    call.type = "button";
    call.addEventListener("click", () => CRM.detail.openCall(lead.id));
    const del = UI.el("button", "btn sm danger", "حذف");
    del.type = "button";
    del.setAttribute("aria-label", "حذف " + lead.name);
    del.addEventListener("click", () => {
      if (del.dataset.armed !== "1") {
        del.dataset.armed = "1";
        del.textContent = "تأیید حذف";
        del.classList.add("confirm");
        return;
      }
      CRM.ops.removeLeads([lead.id]);
    });
    row.append(sel, call, del);
    c.appendChild(row);

    c.addEventListener("click", (e) => {
      if (!e.target.closest("button,select,a,textarea,input")) CRM.detail.open(lead.id);
    });
    c.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", String(lead.id));
      c.style.opacity = ".5";
    });
    c.addEventListener("dragend", () => { c.style.opacity = ""; });
    c.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" && lead.stage < 3) { e.preventDefault(); CRM.ops.moveLead(lead.id, lead.stage + 1, true); }
      if (e.key === "ArrowLeft" && lead.stage > 0) { e.preventDefault(); CRM.ops.moveLead(lead.id, lead.stage - 1, true); }
      if (e.key === "Enter") { e.preventDefault(); CRM.detail.open(lead.id); }
      if (e.key === " ") { e.preventDefault(); toggle(lead.id); CRM.app.render(); }
    });
    return c;
  }

  function render() {
    renderBulk();
    const board = $("board");
    board.textContent = "";
    bizOf().stages.forEach((name, s) => {
      const items = S().bizLeads().filter((l) => l.stage === s && CRM.app.matches(l));
      const col = UI.el("section", "glass col");
      col.dataset.stage = String(s);
      const head = UI.el("header");
      head.append(UI.el("span", "", name), UI.el("em", "", UI.toFa(items.length)));
      col.appendChild(head);
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over-drop"); });
      col.addEventListener("dragleave", () => col.classList.remove("over-drop"));
      col.addEventListener("drop", (e) => {
        e.preventDefault();
        col.classList.remove("over-drop");
        const id = Number(e.dataTransfer.getData("text/plain"));
        if (id) CRM.ops.moveLead(id, s);
      });
      if (!items.length) col.appendChild(UI.el("div", "empty", "اطلاعیه‌ای در این مرحله نیست."));
      items.forEach((l) => col.appendChild(card(l)));
      board.appendChild(col);
    });
  }

  function bulkMove(value) {
    if (value === "") return;
    const stage = Number(value);
    const store = S();
    let moved = 0, skipped = 0;
    selected.forEach((id) => {
      const lead = store.leadById(id);
      if (!lead || lead.stage === stage) return;
      if (stage >= 2 && !lead.amount) { skipped++; return; }
      store.note(lead, "مرحله: " + bizOf().stages[lead.stage] + " ← " + bizOf().stages[stage]);
      lead.stage = stage;
      lead.stageSince = Date.now();
      moved++;
    });
    store.save();
    selected.clear();
    CRM.app.render();
    UI.toast(UI.toFa(moved) + " مورد منتقل شد" + (skipped ? "؛ " + UI.toFa(skipped) + " مورد بدون مبلغ جا ماند." : "."));
  }

  function bulkRemind() {
    const store = S();
    const at = CRM.tools.nineAm(Date.now() + UI.DAY);
    selected.forEach((id) => {
      const lead = store.leadById(id);
      if (!lead) return;
      lead.remindAt = at;
      store.note(lead, "یادآوری تنظیم شد: " + UI.jalaliTime(at));
    });
    store.save();
    const n = selected.size;
    selected.clear();
    CRM.app.render();
    UI.toast("یادآوری برای " + UI.toFa(n) + " مورد ثبت شد.");
  }

  function bulkArchive() {
    const ids = [...selected];
    selected.clear();
    CRM.ops.setArchived(ids, true);
    UI.toast(UI.toFa(ids.length) + " مورد بایگانی شد.");
  }

  let deleteArmed = false;
  function bulkDelete() {
    const btn = $("bulkDelete");
    if (!deleteArmed) {
      deleteArmed = true;
      btn.textContent = "تأیید حذف";
      btn.classList.add("confirm");
      return;
    }
    deleteArmed = false;
    btn.textContent = "حذف";
    btn.classList.remove("confirm");
    const ids = [...selected];
    selected.clear();
    CRM.ops.removeLeads(ids);
  }

  function renderArchive() {
    const list = $("archList");
    list.textContent = "";
    const items = S().bizLeads({ archived: true }).filter((l) => CRM.app.matchesSearch(l));
    if (!items.length) {
      list.appendChild(UI.el("div", "glass empty", "بایگانی خالی است."));
      return;
    }
    items.forEach((l) => {
      const row = UI.el("article", "glass row-item");
      row.addEventListener("click", (e) => { if (!e.target.closest("button")) CRM.detail.open(l.id); });
      const info = UI.el("div", "info");
      info.append(UI.el("div", "nm", l.name), UI.el("div", "meta", bizOf().stages[l.stage] + " · " + l.phone + " · " + UI.money(l.amount)));
      const btns = UI.el("div", "btns");
      const restore = UI.el("button", "btn sm primary", "بازگردانی");
      restore.type = "button";
      restore.addEventListener("click", () => CRM.ops.setArchived([l.id], false));
      const open = UI.el("button", "btn sm", "جزئیات");
      open.type = "button";
      open.addEventListener("click", () => CRM.detail.open(l.id));
      btns.append(restore, open);
      row.append(info, btns);
      list.appendChild(row);
    });
  }

  $("bulkStage").addEventListener("change", (e) => bulkMove(e.target.value));
  $("bulkRemind").addEventListener("click", bulkRemind);
  $("bulkArchive").addEventListener("click", bulkArchive);
  $("bulkDelete").addEventListener("click", bulkDelete);
  $("bulkClear").addEventListener("click", () => { selected.clear(); CRM.app.render(); });

  CRM.notices = { render, renderArchive, reset, selectedIds: () => [...selected] };
})(window.CRM);
