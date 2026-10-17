(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const cfg = CRM.config;

  function csvCell(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function toCsv(rows) {
    return "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    const src = String(text).replace(/^\uFEFF/, "");
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (quoted) {
        if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && src[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.some((c) => c.trim() !== "")) rows.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    return rows;
  }

  function icsEscape(value) {
    return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }

  function icsStamp(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + "T" + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + "Z";
  }

  function toIcs(events) {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CRM Demo//FA//", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    events.forEach((ev) => {
      lines.push("BEGIN:VEVENT", "UID:" + ev.uid + "@crm-demo", "DTSTAMP:" + icsStamp(Date.now()), "DTSTART:" + icsStamp(ev.start),
        "DURATION:PT30M", "SUMMARY:" + icsEscape(ev.summary), "DESCRIPTION:" + icsEscape(ev.description || ""),
        "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(ev.summary), "END:VALARM", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function nineAm(ts) {
    const d = new Date(ts);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }

  function invoiceHtml(inv, bizTitle) {
    const S = CRM.store;
    const status = S.INV_LABEL[S.invStatus(inv)];
    const e = UI.esc;
    return '<div dir="rtl">' +
      '<h1 style="font-size:22px;margin-bottom:4px">' + e(bizTitle) + '</h1>' +
      '<h2 style="font-size:18px;margin-bottom:18px">فاکتور ' + e(CRM.store.invCode(inv)) + '</h2>' +
      '<table style="width:100%;border-collapse:collapse">' +
      row("مشتری", inv.custName) + row("تاریخ صدور", UI.jalali(inv.issued)) + row("سررسید", UI.jalali(inv.due)) +
      row("مبلغ کل", UI.money(inv.amount)) + row("پرداخت‌شده", UI.money(S.invPaid(inv))) +
      row("مانده", UI.money(S.invRemaining(inv))) + row("وضعیت", status) +
      '</table>' +
      (inv.notes ? '<p style="margin-top:18px"><b>توضیحات:</b> ' + e(inv.notes) + '</p>' : "") +
      '</div>';

    function row(label, value) {
      return '<tr><th style="text-align:start;padding:8px;border-bottom:1px solid #ccc;width:35%">' + e(label) + '</th><td style="padding:8px;border-bottom:1px solid #ccc">' + e(value) + '</td></tr>';
    }
  }

  function reportHtml(model) {
    const e = UI.esc;
    const rowsOf = (list) => list.map(([a, b]) => '<tr><td style="padding:6px;border-bottom:1px solid #ccc">' + e(a) + '</td><td style="padding:6px;border-bottom:1px solid #ccc">' + e(b) + '</td></tr>').join("");
    return '<div dir="rtl">' +
      '<h1 style="font-size:22px;margin-bottom:4px">گزارش ' + e(model.title) + '</h1>' +
      '<p style="margin-bottom:16px">' + e(model.range) + ' · تاریخ گزارش: ' + e(UI.jalali(Date.now())) + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:18px">' + rowsOf(model.kpis) + '</table>' +
      '<h3>به تفکیک مرحله</h3><table style="width:100%;border-collapse:collapse;margin-bottom:14px">' + rowsOf(model.stages) + '</table>' +
      '<h3>منبع آشنایی</h3><table style="width:100%;border-collapse:collapse;margin-bottom:14px">' + rowsOf(model.sources) + '</table>' +
      '<h3>پنج مشتری برتر</h3><table style="width:100%;border-collapse:collapse">' + rowsOf(model.top) + '</table>' +
      '</div>';
  }

  function invoiceImage(inv, bizTitle) {
    const S = CRM.store;
    const W = 900, H = 1000, M = 70;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#4a93c9"; ctx.fillRect(0, 0, W, 14);
      ctx.direction = "rtl"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#17303f";
      ctx.font = "700 40px Shoor, sans-serif";
      ctx.fillText(bizTitle, W - M, 110);
      ctx.font = "600 30px Shoor, sans-serif";
      ctx.fillStyle = "#4a93c9";
      ctx.fillText("فاکتور " + CRM.store.invCode(inv), W - M, 170);
      const rows = [
        ["مشتری", inv.custName], ["تاریخ صدور", UI.jalali(inv.issued)], ["سررسید", UI.jalali(inv.due)],
        ["مبلغ کل", UI.money(inv.amount)], ["پرداخت‌شده", UI.money(S.invPaid(inv))], ["مانده", UI.money(S.invRemaining(inv))],
        ["وضعیت", S.INV_LABEL[S.invStatus(inv)]]
      ];
      let y = 250;
      rows.forEach(([label, value], idx) => {
        ctx.fillStyle = idx % 2 ? "#f3f8fb" : "#ffffff";
        ctx.fillRect(M - 20, y - 40, W - 2 * M + 40, 64);
        ctx.fillStyle = "#637f8f";
        ctx.font = "500 26px Shoor, sans-serif";
        ctx.fillText(label, W - M, y);
        ctx.fillStyle = "#17303f";
        ctx.font = "600 28px Shoor, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(String(value), M, y);
        ctx.textAlign = "right";
        y += 74;
      });
      if (inv.notes) {
        ctx.fillStyle = "#637f8f";
        ctx.font = "500 24px Shoor, sans-serif";
        ctx.fillText("توضیحات", W - M, y + 40);
        ctx.fillStyle = "#17303f";
        ctx.font = "400 26px Shoor, sans-serif";
        ctx.fillText(inv.notes.slice(0, 80), W - M, y + 84);
      }
      ctx.fillStyle = "#9fb4c1";
      ctx.font = "400 20px Shoor, sans-serif";
      ctx.fillText("نمونه‌ی کار با داده‌های ساختگی", W / 2, H - 50);
      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    };
    const fontsReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load("600 30px Shoor"), document.fonts.load("700 40px Shoor")]).catch(() => null) : Promise.resolve();
    return fontsReady.then(draw);
  }

  CRM.tools = { toCsv, parseCsv, toIcs, nineAm, invoiceHtml, reportHtml, invoiceImage };
})(window.CRM);
