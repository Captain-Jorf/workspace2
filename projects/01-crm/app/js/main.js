(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;
  const bizOf = () => cfg.BIZ[S().state.business];

  let view = "today";
  let filter = "all";
  let search = "";

  const VIEW_TITLE = { today: "امروز", notices: "اطلاعیه‌ها", customers: "مشتری‌ها", invoices: "فاکتورها", notes: "یادداشت‌ها", archive: "بایگانی", reports: "گزارش‌ها" };

  function matchesSearch(lead) {
    const q = UI.toEn(search).trim().toLowerCase();
    return !q || lead.name.toLowerCase().indexOf(q) >= 0 || lead.phone.indexOf(q) >= 0;
  }

  function matches(lead) {
    if (!matchesSearch(lead)) return false;
    const d = UI.daysFromNow(lead.next);
    switch (filter) {
      case "today": return lead.stage < 3 && d <= 0;
      case "overdue": return lead.stage < 3 && d < 0;
      case "open": return lead.stage < 3;
      case "won": return lead.stage === 3;
      default: return true;
    }
  }

  function render() {
    if (!S().state.business) return;
    $("badgeToday").textContent = UI.toFa(CRM.today.dueLeads().length);
    if (view === "today") CRM.today.render();
    if (view === "notices") CRM.notices.render();
    if (view === "customers") CRM.customers.render();
    if (view === "invoices") CRM.invoices.render();
    if (view === "notes") CRM.notes.render();
    if (view === "archive") CRM.notices.renderArchive();
    if (view === "reports") CRM.reports.render();
    $("pageSub").textContent = bizOf().title + " · " + UI.toFa(S().bizLeads().length) + " مشتری";
  }

  function setView(v) {
    view = v;
    document.querySelectorAll(".nav[data-view]").forEach((b) => b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false"));
    document.querySelectorAll(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    $("pageTitle").textContent = VIEW_TITLE[v];
    render();
  }

  function setFilter(f) {
    filter = f;
    document.querySelectorAll(".chip[data-filter]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === f)));
    render();
  }

  function setCollapsed(collapsed) {
    S().state.ui.collapsed = collapsed;
    $("shell").classList.toggle("collapsed", collapsed);
    $("toggleSide").setAttribute("aria-expanded", String(!collapsed));
    S().save();
  }

  function applyBizUI() {
    const biz = bizOf();
    $("newNotice").textContent = "";
    $("newNotice").append("اطلاعیه‌ی جدید ", UI.el("kbd", "", "N"));
    CRM.leadForm.populateStages();
  }

  function showStart() {
    $("shell").hidden = true;
    $("start").hidden = false;
    renderStart();
    UI.closeAll();
  }

  function showShell() {
    $("start").hidden = true;
    $("shell").hidden = false;
    setCollapsed(!!S().state.ui.collapsed);
    applyBizUI();
    setView("today");
  }

  function pickBiz(key) {
    const store = S();
    store.state.business = key;
    store.ensureSeed(key);
    store.save();
    search = "";
    $("q").value = "";
    filter = "all";
    document.querySelectorAll(".chip[data-filter]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === "all")));
    CRM.notices.reset();
    CRM.customers.reset();
    CRM.invoices.reset();
    CRM.reports.reset();
    showShell();
    UI.toast("کسب‌وکار: " + cfg.BIZ[key].title);
  }

  function renderStart() {
    const grid = $("bizGrid");
    grid.textContent = "";
    cfg.BIZ_ORDER.forEach((key) => {
      const biz = cfg.BIZ[key];
      const card = UI.el("article", "glass biz");
      card.appendChild(UI.el("h2", "", biz.title));
      card.appendChild(UI.el("p", "", biz.desc));
      const list = UI.el("ul");
      biz.features.forEach((f) => list.appendChild(UI.el("li", "", f)));
      card.appendChild(list);
      const pick = UI.el("button", "btn primary", "انتخاب این کسب‌وکار");
      pick.type = "button";
      pick.addEventListener("click", () => pickBiz(key));
      card.appendChild(pick);
      grid.appendChild(card);
    });
  }

  function resetToStart() {
    S().state.business = null;
    S().save();
    showStart();
  }

  function refreshAccount() {
    applyBizUI();
    render();
  }

  document.querySelectorAll(".nav[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  document.querySelectorAll(".chip[data-filter]").forEach((c) => c.addEventListener("click", () => setFilter(c.dataset.filter)));
  $("q").addEventListener("input", (e) => { search = e.target.value; render(); });
  $("toggleSide").addEventListener("click", () => setCollapsed(!S().state.ui.collapsed));
  $("newNotice").addEventListener("click", () => CRM.leadForm.open(null));
  $("newCustomer").addEventListener("click", () => CRM.leadForm.open(null));
  $("sideSwitch").addEventListener("click", showStart);
  $("scrim").addEventListener("click", UI.closeAll);

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "Escape") UI.closeAll();
    if (typing || !S().state.business) return;
    if (e.key === "/") { e.preventDefault(); $("q").focus(); }
    if ((e.key === "n" || e.key === "N") && !UI.isOpen("drawer")) { e.preventDefault(); CRM.leadForm.open(null); }
  });

  CRM.app = { render, setView, matches, matchesSearch, refreshAccount, resetToStart, showStart };

  S().load();
  CRM.settings.applyAppearance();
  if (S().state.business && cfg.BIZ[S().state.business]) {
    S().ensureSeed(S().state.business);
    showShell();
  } else {
    showStart();
  }
})(window.CRM);
