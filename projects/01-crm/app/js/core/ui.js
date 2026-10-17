(function (CRM) {
  "use strict";

  const DIGITS_FA = "۰۱۲۳۴۵۶۷۸۹";
  const DIGITS_AR = "٠١٢٣٤٥٦٧٨٩";
  const DAY = CRM.config.DAY;
  const PANELS = ["drawer", "callModal", "remindModal", "detailModal", "invModal", "payModal", "mergeModal", "colsModal", "importModal", "settingsModal"];

  const $ = (id) => document.getElementById(id);

  const toFa = (value) => String(value).replace(/\d/g, (d) => DIGITS_FA[d]);

  const toEn = (value) => String(value == null ? "" : value)
    .replace(/[۰-۹]/g, (d) => String(DIGITS_FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(DIGITS_AR.indexOf(d)));

  const groupFa = (n) => Number(n).toLocaleString("fa-IR");

  const money = (n) => (n ? groupFa(n) + " تومان" : "بدون مبلغ");

  const cleanPhone = (value) => toEn(value).replace(/[\s-]/g, "");

  const validPhone = (phone) => /^09\d{9}$/.test(phone);

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  const esc = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const daysFromNow = (ts) => Math.ceil((ts - Date.now()) / DAY);

  const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

  function gregorianToJalali(gy, gm, gd) {
    const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + gdm[gm - 1];
    let jy = -1595 + 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
  }

  function jalali(ts) {
    const d = new Date(ts);
    const parts = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return toFa(parts[2]) + " " + JALALI_MONTHS[parts[1] - 1] + " " + toFa(parts[0]);
  }

  function jalaliTime(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return jalali(ts) + " · " + toFa(pad(d.getHours()) + ":" + pad(d.getMinutes()));
  }

  function jalaliNumeric(ts) {
    const d = new Date(ts);
    const parts = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return parts[0] + "/" + String(parts[1]).padStart(2, "0") + "/" + String(parts[2]).padStart(2, "0");
  }

  function padInvoiceNo(no) {
    return "ف-" + toFa(String(no).padStart(3, "0"));
  }

  let toastTimer = null;
  function toast(message, actionLabel, actionFn, ms) {
    const box = $("toast");
    $("toastMsg").textContent = message;
    const act = $("toastAct");
    if (actionLabel) {
      act.hidden = false;
      act.textContent = actionLabel;
      act.onclick = () => { actionFn(); hideToast(); };
    } else {
      act.hidden = true;
      act.onclick = null;
    }
    box.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, ms || 2600);
  }
  function hideToast() {
    $("toast").classList.remove("on");
  }

  function isOpen(id) {
    return $(id).classList.contains("on");
  }

  function syncScrim() {
    const any = PANELS.some((id) => isOpen(id));
    $("scrim").classList.toggle("on", any);
  }

  function openPanel(id) {
    const node = $(id);
    node.classList.add("on");
    node.setAttribute("aria-hidden", "false");
    syncScrim();
  }

  function closePanel(id) {
    const node = $(id);
    node.classList.remove("on");
    node.setAttribute("aria-hidden", "true");
    syncScrim();
  }

  function closeAll() {
    PANELS.forEach((id) => {
      const node = $(id);
      node.classList.remove("on");
      node.setAttribute("aria-hidden", "true");
    });
    syncScrim();
  }

  function setErr(fieldId, message) {
    const field = $(fieldId);
    if (!field) return;
    field.classList.toggle("bad", !!message);
    field.querySelector(".err").textContent = message || "";
  }

  function clearErrors(root) {
    root.querySelectorAll(".field").forEach((field) => {
      field.classList.remove("bad");
      const err = field.querySelector(".err");
      if (err) err.textContent = "";
    });
  }

  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function printHtml(html) {
    const area = $("printArea");
    area.innerHTML = html;
    window.print();
  }

  CRM.ui = {
    $, el, esc, toFa, toEn, groupFa, money, cleanPhone, validPhone, daysFromNow,
    jalali, jalaliTime, jalaliNumeric, gregorianToJalali, padInvoiceNo, JALALI_MONTHS,
    toast, hideToast, isOpen, openPanel, closePanel, closeAll, setErr, clearErrors,
    download, printHtml, DAY
  };
})(window.CRM);
