(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  let editingId = null;

  function renderExtra(values) {
    const host = $("extraFields");
    host.textContent = "";
    bizOf().fields.forEach((f) => {
      const wrap = UI.el("div", "field");
      wrap.id = "f-x-" + f.k;
      const label = UI.el("label", "", f.l);
      label.htmlFor = "x_" + f.k;
      wrap.appendChild(label);
      let input;
      if (f.t === "sel") {
        input = UI.el("select", "input");
        f.o.forEach((opt) => { const o = UI.el("option", "", opt); o.value = opt; input.appendChild(o); });
      } else {
        input = UI.el("input", "input");
        input.type = "text";
        input.inputMode = f.t === "num" ? "numeric" : "text";
      }
      input.id = "x_" + f.k;
      if (values && values[f.k] != null && values[f.k] !== "") {
        input.value = f.t === "num" ? UI.groupFa(values[f.k]) : values[f.k];
      }
      wrap.appendChild(input);
      host.appendChild(wrap);
    });
  }

  function open(id, requireAmount) {
    const lead = id ? S().leadById(id) : null;
    editingId = lead ? lead.id : null;
    $("dtitle").textContent = lead ? "ویرایش اطلاعیه" : "اطلاعیه‌ی جدید";
    $("name").value = lead ? lead.name : "";
    $("phone").value = lead ? lead.phone : "";
    $("source").value = lead ? lead.source : "";
    $("stage").value = lead ? String(lead.stage) : "0";
    $("amount").value = lead && lead.amount ? UI.groupFa(lead.amount) : "";
    $("next").value = "2";
    $("notes").value = lead ? lead.notes : "";
    renderExtra(lead ? lead.extra : null);
    UI.clearErrors($("form"));
    UI.openPanel("drawer");
    setTimeout(() => $("name").focus(), 50);
    if (requireAmount) {
      $("stage").value = "2";
      $("amount").focus();
    }
  }

  function close() {
    UI.closePanel("drawer");
  }

  function populateStages() {
    const sel = $("stage");
    sel.textContent = "";
    bizOf().stages.forEach((s, i) => { const o = UI.el("option", "", s); o.value = String(i); sel.appendChild(o); });
  }

  function validate() {
    let ok = true;
    const name = $("name").value.trim();
    const phone = UI.cleanPhone($("phone").value);
    const stage = Number($("stage").value);
    const raw = UI.toEn($("amount").value).replace(/[,٬\s]/g, "");
    const amount = raw ? Number(raw) : 0;
    if (name.length < 2) { UI.setErr("f-name", "نام را حداقل ۲ حرف وارد کن."); ok = false; } else UI.setErr("f-name", "");
    if (!UI.validPhone(phone)) { UI.setErr("f-phone", "شماره موبایل باید ۱۱ رقم و با 09 شروع شود."); ok = false; } else UI.setErr("f-phone", "");
    if (!$("source").value) { UI.setErr("f-source", "منبع آشنایی را انتخاب کن."); ok = false; } else UI.setErr("f-source", "");
    if (stage >= 2 && !amount) { UI.setErr("f-amount", "برای این مرحله مبلغ لازم است."); ok = false; }
    else if (raw && (!/^\d+$/.test(raw) || amount <= 0)) { UI.setErr("f-amount", "مبلغ فقط عدد مثبت باشد."); ok = false; }
    else UI.setErr("f-amount", "");
    if (!ok) return null;
    const extra = {};
    bizOf().fields.forEach((f) => {
      const input = $("x_" + f.k);
      const value = input ? input.value.trim() : "";
      extra[f.k] = f.t === "num" ? Number(UI.toEn(value).replace(/[,٬\s]/g, "") || 0) : value;
    });
    return {
      name, phone, stage, amount, extra,
      source: $("source").value,
      notes: $("notes").value.trim(),
      days: Number($("next").value)
    };
  }

  function submit(event) {
    event.preventDefault();
    const v = validate();
    if (!v) return;
    const next = Date.now() + v.days * UI.DAY;
    const store = S();
    if (editingId) {
      const lead = store.leadById(editingId);
      Object.assign(lead, { name: v.name, phone: v.phone, stage: v.stage, amount: v.amount, source: v.source, next, extra: v.extra, notes: v.notes });
      store.note(lead, "اطلاعات ویرایش شد");
    } else {
      const lead = store.addLead({ name: v.name, phone: v.phone, stage: v.stage, stageSince: Date.now(), amount: v.amount, source: v.source, next, extra: v.extra, notes: v.notes });
      store.note(lead, "اطلاعیه ثبت شد");
    }
    store.save();
    close();
    CRM.app.render();
    UI.toast(editingId ? "تغییرات ذخیره شد." : "اطلاعیه ثبت شد.");
  }

  function moveLead(id, stage, keepFocus) {
    const store = S();
    const lead = store.leadById(id);
    if (!lead || lead.stage === stage) return;
    if (stage >= 2 && !lead.amount) {
      UI.toast("برای مرحله‌ی «" + bizOf().stages[stage] + "» ابتدا مبلغ را وارد کن.", "ویرایش", () => open(id));
      open(id, true);
      return;
    }
    const from = bizOf().stages[lead.stage];
    lead.stage = stage;
    lead.stageSince = Date.now();
    store.note(lead, "مرحله: " + from + " ← " + bizOf().stages[stage]);
    store.save();
    CRM.app.render();
    if (keepFocus) {
      const card = document.querySelector('[data-id="' + id + '"]');
      if (card) card.focus();
    }
    UI.toast(lead.name + " به «" + bizOf().stages[stage] + "» رفت.");
  }

  function setArchived(ids, archived) {
    const store = S();
    ids.forEach((id) => {
      const lead = store.leadById(id);
      if (!lead) return;
      lead.archived = archived;
      store.note(lead, archived ? "به بایگانی رفت" : "از بایگانی برگشت");
    });
    store.save();
    CRM.app.render();
  }

  function removeLeads(ids) {
    const store = S();
    const removed = [];
    ids.forEach((id) => {
      const r = store.removeLead(id);
      if (r) removed.push(r);
    });
    store.save();
    CRM.app.render();
    if (!removed.length) return;
    const label = removed.length === 1 ? removed[0].lead.name + " حذف شد." : removed.length + " اطلاعیه حذف شد.";
    UI.toast(label, "بازگردانی", () => {
      removed.sort((a, b) => a.index - b.index).forEach((r) => {
        const list = S().state.leads;
        list.splice(Math.min(r.index, list.length), 0, r.lead);
      });
      S().save();
      CRM.app.render();
      UI.toast("بازگردانی شد.");
    }, 5000);
  }

  $("form").addEventListener("submit", submit);
  $("form").addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); $("form").requestSubmit(); }
  });
  $("closeBtn").addEventListener("click", close);
  $("cancelBtn").addEventListener("click", close);

  CRM.leadForm = { open, close, populateStages };
  CRM.ops = { moveLead, setArchived, removeLeads };
})(window.CRM);
