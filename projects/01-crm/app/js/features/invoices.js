(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizTitle = () => cfg.BIZ[S().state.business].title;

  let editingNo = null;
  let payingNo = null;
  let range = 0;

  function inRange(inv) {
    return !range || inv.issued >= Date.now() - range * UI.DAY;
  }

  function filtered() {
    return S().bizInvoices().filter(inRange);
  }

  function render() {
    const store = S();
    const all = filtered();
    const active = all.filter((i) => !i.draft);
    const unpaid = active.filter((i) => store.invPaid(i) < i.amount);
    const paidSum = active.reduce((s, i) => s + store.invPaid(i), 0);
    const outstanding = unpaid.reduce((s, i) => s + store.invRemaining(i), 0);
    const overdue = unpaid.filter((i) => i.due < Date.now());
    const kpis = $("kpisInv");
    kpis.textContent = "";
    [
      ["فاکتورهای صادر شده", UI.toFa(active.length), "بدون پیش‌نویس"],
      ["وصول‌شده", UI.toFa(Math.round(paidSum / 1e6)) + " م", "میلیون تومان"],
      ["مانده‌ی وصول‌نشده", UI.toFa(Math.round(outstanding / 1e6)) + " م", "میلیون تومان"],
      ["معوق", UI.toFa(overdue.length), "گذشته از سررسید"]
    ].forEach(([label, value, sub]) => {
      const card = UI.el("div", "glass kpi");
      card.append(UI.el("span", "lbl", label), UI.el("b", "", value), UI.el("small", "", sub));
      kpis.appendChild(card);
    });

    const body = $("invBody");
    body.textContent = "";
    all.forEach((inv) => {
      const key = store.invStatus(inv);
      const tr = UI.el("tr");
      if (store.leadById(inv.leadId)) tr.addEventListener("click", () => CRM.detail.open(inv.leadId));
      const stc = UI.el("td");
      stc.appendChild(UI.el("span", "st " + key, store.INV_LABEL[key]));
      const acts = UI.el("td");
      const wrap = UI.el("div", "btns");
      const btn = (label, cls, fn) => {
        const b = UI.el("button", "btn sm " + (cls || ""), label);
        b.type = "button";
        b.addEventListener("click", (e) => { e.stopPropagation(); fn(b); });
        wrap.appendChild(b);
        return b;
      };
      if (!inv.draft && store.invRemaining(inv) > 0) btn("ثبت پرداخت", "primary", () => openPay(inv.no));
      btn("ویرایش", "", () => openForm(inv.no, null));
      btn("کپی", "", () => copyInvoice(inv.no));
      btn("چاپ", "", () => printInvoice(inv.no));
      btn("اشتراک گذاری", "", (b) => shareImage(inv.no, b));
      btn("حذف", "danger", (b) => {
        if (b.dataset.armed !== "1") {
          b.dataset.armed = "1";
          b.textContent = "تأیید حذف";
          b.classList.add("confirm");
          return;
        }
        removeInvoice(inv.no);
      });
      acts.appendChild(wrap);
      tr.append(UI.el("td", "", UI.padInvoiceNo(inv.no)), UI.el("td", "", inv.custName), UI.el("td", "", UI.jalali(inv.issued)),
        UI.el("td", "", UI.jalali(inv.due)), UI.el("td", "", UI.money(inv.amount)), stc, acts);
      body.appendChild(tr);
    });
    if (!all.length) {
      const tr = UI.el("tr");
      const td = UI.el("td", "empty", "فاکتوری در این بازه نیست.");
      td.colSpan = 7;
      tr.appendChild(td);
      body.appendChild(tr);
    }
  }

  function fillCustomers(selectedId) {
    const sel = $("invCust");
    sel.textContent = "";
    S().bizLeads().forEach((l) => {
      const o = UI.el("option", "", l.name);
      o.value = String(l.id);
      sel.appendChild(o);
    });
    if (selectedId) sel.value = String(selectedId);
  }

  function nearestDays(inv) {
    const days = Math.round((inv.due - inv.issued) / UI.DAY);
    return [7, 14, 30].reduce((best, d) => (Math.abs(d - days) < Math.abs(best - days) ? d : best), 14);
  }

  function openForm(no, leadId) {
    const store = S();
    if (!store.bizLeads().length) {
      UI.toast("ابتدا یک مشتری ثبت کن.");
      return;
    }
    const inv = no ? store.state.invoices.find((i) => i.no === no) : null;
    editingNo = inv ? inv.no : null;
    $("invTitle").textContent = inv ? "ویرایش " + UI.padInvoiceNo(inv.no) : "فاکتور جدید";
    fillCustomers(inv ? inv.leadId : leadId);
    const lead = inv ? store.leadById(inv.leadId) : store.leadById(leadId);
    $("invAmt").value = inv ? UI.groupFa(inv.amount) : lead && lead.amount ? UI.groupFa(lead.amount) : "";
    $("invDue").value = String(inv ? nearestDays(inv) : 14);
    $("invStatus").value = inv && inv.draft ? "draft" : "issued";
    $("invNotes").value = inv ? inv.notes : "";
    UI.clearErrors($("invForm"));
    UI.openPanel("invModal");
  }

  function saveForm() {
    const store = S();
    const leadId = Number($("invCust").value);
    const lead = store.leadById(leadId);
    if (!lead) { UI.setErr("f-inv-cust", "مشتری را انتخاب کن."); return; }
    UI.setErr("f-inv-cust", "");
    const raw = UI.toEn($("invAmt").value).replace(/[,٬\s]/g, "");
    const amount = Number(raw);
    if (!/^\d+$/.test(raw) || amount <= 0) { UI.setErr("f-inv-amt", "مبلغ را فقط با عدد مثبت وارد کن."); return; }
    UI.setErr("f-inv-amt", "");
    const days = Number($("invDue").value);
    const draft = $("invStatus").value === "draft";
    const notes = $("invNotes").value.trim();
    if (editingNo) {
      const inv = store.state.invoices.find((i) => i.no === editingNo);
      if (inv) {
        Object.assign(inv, { leadId, custName: lead.name, amount, due: inv.issued + days * UI.DAY, draft, notes });
        store.note(lead, "فاکتور " + UI.padInvoiceNo(inv.no) + " ویرایش شد");
      }
    } else {
      const inv = store.addInvoice({ business: store.state.business, leadId, custName: lead.name, amount, issued: Date.now(), due: Date.now() + days * UI.DAY, draft, notes });
      store.note(lead, "فاکتور " + UI.padInvoiceNo(inv.no) + (draft ? " به‌صورت پیش‌نویس ثبت شد" : " صادر شد") + " · " + UI.money(amount));
    }
    store.save();
    UI.closePanel("invModal");
    CRM.app.render();
    UI.toast("فاکتور ذخیره شد.");
  }

  function openPay(no) {
    const store = S();
    const inv = store.state.invoices.find((i) => i.no === no);
    if (!inv) return;
    payingNo = no;
    $("paySub").textContent = UI.padInvoiceNo(inv.no) + " · " + inv.custName + " · مانده: " + UI.money(store.invRemaining(inv));
    $("payAmt").value = UI.groupFa(store.invRemaining(inv));
    UI.clearErrors($("payForm"));
    UI.openPanel("payModal");
  }

  function recordPayment(full) {
    const store = S();
    const inv = store.state.invoices.find((i) => i.no === payingNo);
    if (!inv) return;
    const remaining = store.invRemaining(inv);
    let amount = remaining;
    if (!full) {
      const raw = UI.toEn($("payAmt").value).replace(/[,٬\s]/g, "");
      amount = Number(raw);
      if (!/^\d+$/.test(raw) || amount <= 0) { UI.setErr("f-pay-amt", "مبلغ را فقط با عدد مثبت وارد کن."); return; }
      if (amount > remaining) { UI.setErr("f-pay-amt", "مبلغ از مانده‌ی فاکتور بیشتر است."); return; }
      UI.setErr("f-pay-amt", "");
    }
    inv.payments.push({ at: Date.now(), amount });
    const lead = store.leadById(inv.leadId);
    if (lead) store.note(lead, "پرداخت " + UI.money(amount) + " برای " + UI.padInvoiceNo(inv.no));
    store.save();
    UI.closePanel("payModal");
    CRM.app.render();
    UI.toast(store.invStatus(inv) === "paid" ? "فاکتور کامل پرداخت شد." : "پرداخت ثبت شد.");
  }

  function copyInvoice(no) {
    const store = S();
    const src = store.state.invoices.find((i) => i.no === no);
    if (!src) return;
    const copy = store.addInvoice({ business: src.business, leadId: src.leadId, custName: src.custName, amount: src.amount, issued: Date.now(), due: Date.now() + 14 * UI.DAY, draft: true, notes: src.notes });
    store.save();
    CRM.app.render();
    UI.toast("کپی به‌صورت پیش‌نویس ساخته شد: " + UI.padInvoiceNo(copy.no));
  }

  function printInvoice(no) {
    const inv = S().state.invoices.find((i) => i.no === no);
    if (!inv) return;
    UI.printHtml(CRM.tools.invoiceHtml(inv, bizTitle()));
  }

  let sharePending = null;
  let previewUrl = null;

  function canSendFile(file) {
    return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
  }

  function shareImage(no, button) {
    const inv = S().state.invoices.find((i) => i.no === no);
    if (!inv) return;
    const name = "invoice-" + UI.toFa(inv.no) + ".png";
    if (button) button.disabled = true;
    CRM.tools.invoiceImage(inv, bizTitle()).then((blob) => {
      if (button) button.disabled = false;
      const file = new File([blob], name, { type: "image/png" });
      sharePending = { blob, name, file, title: UI.padInvoiceNo(inv.no) };
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
      $("shPreview").src = previewUrl;
      $("shSub").textContent = UI.padInvoiceNo(inv.no) + " · " + inv.custName + " · عکس ساخته شد. یکی از گزینه‌ها را انتخاب کن.";
      $("shSend").disabled = !canSendFile(file);
      $("shSendHint").textContent = canSendFile(file) ? "" : "این دستگاه ارسال مستقیم عکس را پشتیبانی نمی‌کند؛ عکس را دانلود کن و از همان‌جا بفرست.";
      UI.openPanel("shareModal");
    });
  }

  function sendPending() {
    if (!sharePending || !canSendFile(sharePending.file)) return;
    navigator.share({ files: [sharePending.file], title: sharePending.title })
      .then(() => UI.closePanel("shareModal"))
      .catch(() => {});
  }

  function downloadPending() {
    if (!sharePending) return;
    UI.download(sharePending.name, sharePending.blob);
    UI.toast("عکس فاکتور دانلود شد.");
  }

  function closeShare() {
    UI.closePanel("shareModal");
  }

  function removeInvoice(no) {
    const store = S();
    const inv = store.state.invoices.find((i) => i.no === no);
    store.removeInvoice(no);
    store.save();
    CRM.app.render();
    UI.toast((inv ? UI.padInvoiceNo(no) : "فاکتور") + " حذف شد.");
  }

  function exportCsv() {
    const store = S();
    const rows = [["شماره", "مشتری", "تاریخ صدور", "سررسید", "مبلغ", "پرداخت‌شده", "مانده", "وضعیت"]];
    filtered().forEach((inv) => {
      rows.push([inv.no, inv.custName, UI.jalali(inv.issued), UI.jalali(inv.due), inv.amount, store.invPaid(inv), store.invRemaining(inv), store.INV_LABEL[store.invStatus(inv)]]);
    });
    UI.download("invoices-" + store.state.business + ".csv", CRM.tools.toCsv(rows), "text/csv;charset=utf-8");
    UI.toast("فایل CSV فاکتورها ساخته شد.");
  }

  $("newInv").addEventListener("click", () => openForm(null, null));
  $("invCsv").addEventListener("click", exportCsv);
  $("invRange").addEventListener("change", (e) => { range = Number(e.target.value); render(); });
  $("invClose").addEventListener("click", () => UI.closePanel("invModal"));
  $("invCancel").addEventListener("click", () => UI.closePanel("invModal"));
  $("invSave").addEventListener("click", saveForm);
  $("payClose").addEventListener("click", () => UI.closePanel("payModal"));
  $("payCancel").addEventListener("click", () => UI.closePanel("payModal"));
  $("shSend").addEventListener("click", sendPending);
  $("shDownload").addEventListener("click", downloadPending);
  $("shCancel").addEventListener("click", closeShare);
  $("shClose").addEventListener("click", closeShare);
  $("paySave").addEventListener("click", () => recordPayment(false));
  $("payFull").addEventListener("click", () => recordPayment(true));

  CRM.invoices = { render, openForm, openPay, printInvoice, shareImage, exportCsv, reset: () => { range = 0; $("invRange").value = "0"; } };
})(window.CRM);
