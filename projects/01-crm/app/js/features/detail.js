(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  let currentId = null;
  let callResult = "answered";
  let remindId = null;
  let remindChoice = "hour";

  function open(id) {
    const store = S();
    const lead = store.leadById(id);
    if (!lead) return;
    currentId = id;
    const biz = bizOf();
    const d = UI.daysFromNow(lead.next);
    $("dName").textContent = lead.name;
    $("dSub").textContent = biz.title + " · " + biz.stages[lead.stage] + " · " + lead.phone;
    $("dCall").href = "tel:" + lead.phone;
    $("dWa").href = "https://wa.me/98" + lead.phone.slice(1);
    $("dArchive").textContent = lead.archived ? "از بایگانی برگردان" : "بایگانی";
    $("dRemind").textContent = lead.remindAt ? "یادآوری: " + UI.jalaliTime(lead.remindAt) : "یادآوری";
    $("dDelete").textContent = "حذف";
    $("dDelete").classList.remove("confirm");
    $("dDelete").dataset.armed = "";

    const calls = (lead.log || []).filter((x) => x.text.indexOf("تماس") === 0).length;
    const inStage = Math.max(0, Math.floor((Date.now() - (lead.stageSince || Date.now())) / UI.DAY));
    const prob = [10, 30, 60, 100][lead.stage] || 0;
    const stats = $("dStats");
    stats.textContent = "";
    [[UI.toFa(calls), "تماس ثبت‌شده"], [UI.toFa(inStage) + " روز", "در مرحله‌ی فعلی"], [UI.toFa(prob) + "٪", "احتمال موفقیت"], [UI.money(lead.amount), "مبلغ"]]
      .forEach(([v, t]) => { const x = UI.el("div"); x.append(UI.el("b", "", v), UI.el("span", "", t)); stats.appendChild(x); });

    const kv = $("dKv");
    kv.textContent = "";
    const items = [
      ["موبایل", lead.phone], ["منبع آشنایی", lead.source], ["مرحله", biz.stages[lead.stage]],
      ["پیگیری بعدی", UI.jalali(lead.next) + (d < 0 ? " (عقب‌افتاده)" : d === 0 ? " (امروز)" : "")],
      ["تاریخ ثبت", UI.jalali(lead.createdAt)]
    ];
    biz.fields.forEach((f) => {
      const v = lead.extra && lead.extra[f.k];
      items.push([f.l, f.t === "num" && v ? UI.groupFa(v) : (v || "—")]);
    });
    items.forEach(([k, v]) => { const x = UI.el("div"); x.append(UI.el("span", "", k), UI.el("b", "", String(v))); kv.appendChild(x); });

    $("dNotes").textContent = lead.notes || "توضیحاتی ثبت نشده است. از دکمه‌ی ویرایش می‌توانی اضافه کنی.";

    const di = $("dInv");
    di.textContent = "";
    const invs = store.invoicesFor(lead.id);
    if (!invs.length) di.appendChild(UI.el("div", "empty", "فاکتوری برای این مشتری نیست."));
    invs.forEach((inv) => {
      const r = UI.el("div", "tl");
      r.append(UI.el("span", "", store.invCode(inv) + " · " + UI.money(inv.amount)), UI.el("small", "", store.INV_LABEL[store.invStatus(inv)]));
      di.appendChild(r);
    });

    const tl = $("dTimeline");
    tl.textContent = "";
    (lead.log || []).slice(0, 30).forEach((e) => {
      const r = UI.el("div", "tl");
      r.append(UI.el("span", "", e.text), UI.el("small", "", UI.jalaliTime(e.t)));
      tl.appendChild(r);
    });
    if (!(lead.log || []).length) tl.appendChild(UI.el("div", "empty", "هنوز فعالیتی ثبت نشده است."));

    UI.openPanel("detailModal");
  }

  function close() {
    UI.closePanel("detailModal");
  }

  function openCall(id) {
    const lead = S().leadById(id);
    if (!lead) return;
    currentId = id;
    callResult = "answered";
    $("cSub").textContent = lead.name + " · " + lead.phone;
    $("cNote").value = "";
    $("cNext").value = "2";
    document.querySelectorAll(".choice").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.res === callResult)));
    UI.openPanel("callModal");
  }

  function saveCall() {
    const store = S();
    const lead = store.leadById(currentId);
    if (!lead) return;
    const days = Number($("cNext").value);
    const extra = $("cNote").value.trim();
    lead.next = Date.now() + days * UI.DAY;
    const label = { answered: "پاسخ داد", voicemail: "پیام گذاشته شد", nores: "پاسخ نداد" }[callResult];
    if (callResult === "answered" && lead.stage === 0) { lead.stage = 1; lead.stageSince = Date.now(); }
    store.note(lead, "تماس: " + label + (extra ? " · " + extra : "") + " · پیگیری " + UI.toFa(days) + " روز بعد");
    store.save();
    UI.closePanel("callModal");
    CRM.app.render();
    UI.toast(lead.name + ": " + label + " · پیگیری " + UI.toFa(days) + " روز بعد");
  }

  function openRemind(id) {
    const lead = S().leadById(id);
    if (!lead) return;
    remindId = id;
    $("rSub").textContent = lead.name + (lead.remindAt ? " · یادآوری فعلی: " + UI.jalaliTime(lead.remindAt) : "");
    setRemindChoice("hour");
    UI.openPanel("remindModal");
  }

  function setRemindChoice(choice) {
    remindChoice = choice;
    document.querySelectorAll("[data-rem]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rem === choice)));
    $("f-rem-custom").hidden = choice !== "custom";
    if (choice === "custom") {
      const d = new Date(Date.now() + 3600000);
      const pad = (n) => String(n).padStart(2, "0");
      $("rCustom").value = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }
  }

  function saveRemind() {
    const store = S();
    const lead = store.leadById(remindId);
    if (!lead) return;
    const now = Date.now();
    let at = null;
    if (remindChoice === "hour") at = now + 3600000;
    if (remindChoice === "tomorrow") at = CRM.tools.nineAm(now + UI.DAY);
    if (remindChoice === "three") at = now + 3 * UI.DAY;
    if (remindChoice === "custom") {
      at = new Date($("rCustom").value).getTime();
      if (!at || at <= now) {
        UI.setErr("f-rem-custom", "زمان یادآوری باید در آینده باشد.");
        return;
      }
      UI.setErr("f-rem-custom", "");
    }
    lead.remindAt = at;
    store.note(lead, "یادآوری تنظیم شد: " + UI.jalaliTime(at));
    store.save();
    UI.closePanel("remindModal");
    CRM.app.render();
    UI.toast("یادآوری ثبت شد: " + UI.jalaliTime(at));
  }

  function clearRemind() {
    const store = S();
    const lead = store.leadById(remindId);
    if (!lead) return;
    lead.remindAt = null;
    store.note(lead, "یادآوری حذف شد");
    store.save();
    UI.closePanel("remindModal");
    CRM.app.render();
    UI.toast("یادآوری حذف شد.");
  }

  $("dClose").addEventListener("click", close);
  $("dCallLog").addEventListener("click", () => { const id = currentId; close(); openCall(id); });
  $("dRemind").addEventListener("click", () => { const id = currentId; close(); openRemind(id); });
  $("dEdit").addEventListener("click", () => { const id = currentId; close(); CRM.leadForm.open(id); });
  $("dInvoice").addEventListener("click", () => { const id = currentId; close(); CRM.invoices.openForm(null, id); });
  $("dArchive").addEventListener("click", () => {
    const id = currentId;
    const lead = S().leadById(id);
    close();
    CRM.ops.setArchived([id], !lead.archived);
    UI.toast(lead.archived ? "از بایگانی برگشت." : "به بایگانی رفت.");
  });
  $("dDelete").addEventListener("click", () => {
    const btn = $("dDelete");
    if (btn.dataset.armed !== "1") {
      btn.dataset.armed = "1";
      btn.classList.add("confirm");
      btn.textContent = "تأیید حذف";
      return;
    }
    const id = currentId;
    close();
    CRM.ops.removeLeads([id]);
  });

  $("cSave").addEventListener("click", saveCall);
  $("cCancel").addEventListener("click", () => UI.closePanel("callModal"));
  document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => {
    callResult = b.dataset.res;
    document.querySelectorAll(".choice").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));

  document.querySelectorAll("[data-rem]").forEach((b) => b.addEventListener("click", () => setRemindChoice(b.dataset.rem)));
  $("rSave").addEventListener("click", saveRemind);
  $("rClear").addEventListener("click", clearRemind);
  $("rClose").addEventListener("click", () => UI.closePanel("remindModal"));

  CRM.detail = { open, close, openCall, openRemind };
})(window.CRM);
