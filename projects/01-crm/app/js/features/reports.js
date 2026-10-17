(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  let range = 0;

  function leads() {
    return S().bizLeads().filter((l) => !range || l.createdAt >= Date.now() - range * UI.DAY);
  }

  function bars(host, rows, total, asMoney) {
    host.textContent = "";
    rows.forEach(([label, n]) => {
      const r = UI.el("div", "bar-row");
      const bar = UI.el("div", "bar");
      const fill = UI.el("i");
      fill.style.width = (total ? (n / total) * 100 : 0) + "%";
      bar.appendChild(fill);
      r.append(UI.el("span", "", label), bar, UI.el("span", "", asMoney ? UI.toFa(Math.round(n / 1e6)) + " م" : UI.toFa(n)));
      host.appendChild(r);
    });
  }

  function model() {
    const all = leads();
    const total = all.length;
    const won = all.filter((l) => l.stage === 3);
    const rate = total ? Math.round((won.length / total) * 100) : 0;
    const avg = won.length ? Math.round(won.reduce((s, l) => s + l.amount, 0) / won.length / 1e6) : 0;
    const overdue = all.filter((l) => l.stage < 3 && UI.daysFromNow(l.next) < 0).length;
    const stages = bizOf().stages.map((s, i) => [s, all.filter((l) => l.stage === i).length]);
    const sources = [...new Set(all.map((l) => l.source))].map((s) => [s, all.filter((l) => l.source === s).length]);
    const top = [...all].sort((a, b) => b.amount - a.amount).slice(0, 5);
    return {
      total, rate, avg, overdue, stages, sources, top,
      kpis: [["کل مشتری‌ها", UI.toFa(total)], ["نرخ تبدیل", UI.toFa(rate) + "٪"], ["میانگین مبلغ انجام‌شده", UI.toFa(avg) + " م"], ["پیگیری عقب‌افتاده", UI.toFa(overdue)]]
    };
  }

  function render() {
    const m = model();
    const kpis = $("kpisReports");
    kpis.textContent = "";
    [
      ["کل مشتری‌ها", UI.toFa(m.total), "ثبت‌شده در این بازه"],
      ["نرخ تبدیل", UI.toFa(m.rate) + "٪", "مرحله‌ی آخر به کل"],
      ["میانگین مبلغ انجام‌شده", UI.toFa(m.avg) + " م", "میلیون تومان"],
      ["پیگیری عقب‌افتاده", UI.toFa(m.overdue), "نیاز به اقدام"]
    ].forEach(([label, value, sub]) => {
      const card = UI.el("div", "glass kpi");
      card.append(UI.el("span", "lbl", label), UI.el("b", "", value), UI.el("small", "", sub));
      kpis.appendChild(card);
    });
    bars($("stageBars"), m.stages, m.total);
    bars($("sourceBars"), m.sources, m.total);
    const max = m.top.length ? m.top[0].amount : 0;
    bars($("topBars"), m.top.map((l) => [l.name, l.amount]), max, true);
  }

  function printPdf() {
    const m = model();
    const rangeLabel = range ? "بازه: " + UI.toFa(range) + " روز اخیر" : "بازه: همه‌ی زمان‌ها";
    UI.printHtml(CRM.tools.reportHtml({
      title: bizOf().title,
      range: rangeLabel,
      kpis: m.kpis,
      stages: m.stages.map(([a, b]) => [a, UI.toFa(b)]),
      sources: m.sources.map(([a, b]) => [a, UI.toFa(b)]),
      top: m.top.map((l) => [l.name, UI.money(l.amount)])
    }));
  }

  $("reportRange").addEventListener("change", (e) => { range = Number(e.target.value); render(); });
  $("reportPdf").addEventListener("click", printPdf);

  CRM.reports = { render, reset: () => { range = 0; $("reportRange").value = "0"; } };
})(window.CRM);
