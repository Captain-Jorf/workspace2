(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  function dueLeads() {
    const now = Date.now();
    return S().bizLeads().filter((l) => (l.stage < 3 && UI.daysFromNow(l.next) <= 0) || (l.remindAt && l.remindAt <= now));
  }

  function render() {
    const store = S();
    const all = S().bizLeads();
    const due = dueLeads();
    $("badgeToday").textContent = UI.toFa(due.length);

    const won = all.filter((l) => l.stage === 3).reduce((s, l) => s + l.amount, 0);
    const open = all.filter((l) => l.stage < 3).reduce((s, l) => s + l.amount, 0);
    const kpis = $("kpisToday");
    kpis.textContent = "";
    [
      ["کارهای امروز", UI.toFa(due.length), "پیگیری یا یادآوری امروز"],
      ["اطلاعیه‌های باز", UI.toFa(all.filter((l) => l.stage < 3).length), "در مراحل فروش"],
      ["ارزش باز", UI.toFa(Math.round(open / 1e6)) + " م", "میلیون تومان در جریان"],
      ["انجام‌شده", UI.toFa(Math.round(won / 1e6)) + " م", "میلیون تومان"]
    ].forEach(([label, value, sub]) => {
      const card = UI.el("div", "glass kpi");
      card.append(UI.el("span", "lbl", label), UI.el("b", "", value), UI.el("small", "", sub));
      kpis.appendChild(card);
    });

    const list = $("todayList");
    list.textContent = "";
    const items = due.filter((l) => CRM.app.matchesSearch(l)).sort((a, b) => a.next - b.next);
    if (!items.length) {
      list.appendChild(UI.el("div", "glass empty", "امروز پیگیری یا یادآوری‌ای نداری."));
      return;
    }
    items.forEach((l) => {
      const d = UI.daysFromNow(l.next);
      const row = UI.el("article", "glass row-item");
      row.addEventListener("click", (e) => { if (!e.target.closest("button,a")) CRM.detail.open(l.id); });
      const info = UI.el("div", "info");
      info.append(UI.el("div", "nm", l.name), UI.el("div", "meta", bizOf().stages[l.stage] + " · " + l.phone + " · " + UI.money(l.amount)));
      const when = d < 0 ? "عقب‌افتاده " + UI.toFa(-d) + " روز · " : "پیگیری امروز · ";
      info.appendChild(UI.el("div", d < 0 ? "over" : "today", when + UI.jalali(l.next)));
      if (l.remindAt) info.appendChild(UI.el("div", "rem", "یادآوری: " + UI.jalaliTime(l.remindAt)));

      const btns = UI.el("div", "btns");
      const call = UI.el("a", "btn sm call", "تماس");
      call.href = "tel:" + l.phone;
      const wa = UI.el("a", "btn sm wa", "واتساپ");
      wa.href = "https://wa.me/98" + l.phone.slice(1);
      wa.target = "_blank";
      wa.rel = "noopener";
      const result = UI.el("button", "btn sm primary", "ثبت نتیجه");
      result.type = "button";
      result.addEventListener("click", () => CRM.detail.openCall(l.id));
      const detail = UI.el("button", "btn sm", "جزئیات");
      detail.type = "button";
      detail.addEventListener("click", () => CRM.detail.open(l.id));
      btns.append(call, wa, result, detail);
      if (l.remindAt) {
        const done = UI.el("button", "btn sm", "انجام شد");
        done.type = "button";
        done.addEventListener("click", () => {
          const lead = store.leadById(l.id);
          lead.remindAt = null;
          store.note(lead, "یادآوری انجام شد");
          store.save();
          render();
        });
        btns.appendChild(done);
      }
      row.append(info, btns);
      list.appendChild(row);
    });
  }

  function exportIcs() {
    const store = S();
    const events = [];
    S().bizLeads().forEach((l) => {
      if (l.stage < 3) {
        events.push({ uid: "follow-" + l.id, summary: "پیگیری: " + l.name, description: l.phone + " · " + bizOf().stages[l.stage], start: CRM.tools.nineAm(l.next) });
      }
      if (l.remindAt) {
        events.push({ uid: "remind-" + l.id, summary: "یادآوری: " + l.name, description: l.phone, start: l.remindAt });
      }
    });
    if (!events.length) {
      UI.toast("رویدادی برای خروجی تقویم وجود ندارد.");
      return;
    }
    UI.download("pigiri-" + store.state.business + ".ics", CRM.tools.toIcs(events), "text/calendar;charset=utf-8");
    UI.toast(UI.toFa(events.length) + " رویداد ساخته شد.");
  }

  $("icsBtn").addEventListener("click", exportIcs);

  CRM.today = { render, dueLeads };
})(window.CRM);
