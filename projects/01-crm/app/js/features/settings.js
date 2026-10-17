(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;
  const cfg = CRM.config;

  function applyAppearance() {
    const ui = S().state.ui;
    document.documentElement.setAttribute("data-theme", ui.theme === "dark" ? "dark" : "light");
    const step = cfg.FONT_STEPS[ui.fontStep] || 1;
    document.documentElement.style.setProperty("--zoom", String(step));
    $("fontLabel").textContent = UI.toFa(Math.round(step * 100)) + "٪";
    $("themeBtn").textContent = ui.theme === "dark" ? "☀" : "☾";
    document.querySelectorAll("[data-theme-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === ui.theme)));
  }

  function setTheme(theme) {
    S().state.ui.theme = theme;
    S().save();
    applyAppearance();
  }

  function changeFont(delta) {
    const ui = S().state.ui;
    const max = cfg.FONT_STEPS.length - 1;
    const next = ui.fontStep + delta;
    if (next < 0 || next > max) return;
    ui.fontStep = next;
    S().save();
    applyAppearance();
  }

  function resetFont() {
    S().state.ui.fontStep = cfg.FONT_STEPS.indexOf(1);
    S().save();
    applyAppearance();
  }

  function setTab(tab) {
    $("pane-look").hidden = tab !== "look";
    $("pane-profile").hidden = tab !== "profile";
    document.querySelectorAll("[data-stab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.stab === tab)));
    if (tab === "profile") renderAuth();
  }

  function setAuthTab(tab) {
    $("loginForm").hidden = tab !== "login";
    $("signupForm").hidden = tab !== "signup";
    document.querySelectorAll("#authTabs [data-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === tab)));
  }

  function renderAuth() {
    const user = S().currentUser();
    $("authBox").hidden = !!user;
    $("accountBox").hidden = !user;
    if (user) {
      $("accText").textContent = "وارد شده‌ای با " + user.name + " (" + user.phone + ")";
      const p = S().state.profile;
      $("pName").value = p.name || "";
      $("pRole").value = p.role || "";
      $("pCompany").value = p.company || "";
    } else {
      setAuthTab($("signupForm").hidden ? "login" : "signup");
    }
  }

  function clearAuthErrors() {
    UI.clearErrors($("authBox"));
  }

  function openSettings(tab) {
    clearAuthErrors();
    UI.clearErrors($("accountBox"));
    setTab(tab || "look");
    UI.openPanel("settingsModal");
  }

  async function submitLogin(e) {
    e.preventDefault();
    clearAuthErrors();
    const phone = UI.cleanPhone($("lPhone").value);
    const pw = $("lPw").value;
    if (!UI.validPhone(phone)) { UI.setErr("f-l-phone", "شماره موبایل باید ۱۱ رقم و با 09 شروع شود."); return; }
    if (!pw) { UI.setErr("f-l-pw", "رمز عبور را وارد کن."); return; }
    const res = await S().signIn(phone, pw);
    if (res.error === "no-user") { UI.setErr("f-l-phone", "حسابی با این شماره پیدا نشد. ابتدا ثبت نام کن."); return; }
    if (res.error === "bad-password") { UI.setErr("f-l-pw", "رمز عبور درست نیست."); return; }
    $("lPw").value = "";
    CRM.app.refreshAccount();
    renderAuth();
    UI.toast("خوش آمدی، " + res.user.name);
  }

  async function submitSignup(e) {
    e.preventDefault();
    clearAuthErrors();
    const name = $("sName").value.trim();
    const phone = UI.cleanPhone($("sPhone").value);
    const pw = $("sPw").value;
    const pw2 = $("sPw2").value;
    let ok = true;
    if (name.length < 2) { UI.setErr("f-s-name", "نام را حداقل ۲ حرف وارد کن."); ok = false; }
    if (!UI.validPhone(phone)) { UI.setErr("f-s-phone", "شماره موبایل باید ۱۱ رقم و با 09 شروع شود."); ok = false; }
    else if (S().findUser(phone)) { UI.setErr("f-s-phone", "با این شماره قبلاً حساب ساخته شده است."); ok = false; }
    if (pw.length < 6) { UI.setErr("f-s-pw", "رمز عبور حداقل ۶ نویسه باشد."); ok = false; }
    if (pw2 !== pw) { UI.setErr("f-s-pw2", "رمز عبور و تکرار آن یکی نیستند."); ok = false; }
    if (!ok) return;
    await S().signUp(name, phone, pw);
    ["sName", "sPhone", "sPw", "sPw2"].forEach((id) => { $(id).value = ""; });
    CRM.app.refreshAccount();
    renderAuth();
    UI.toast("حساب ساخته شد و وارد شدی.");
  }

  function saveProfile() {
    const name = $("pName").value.trim();
    if (name.length < 2) { UI.toast("نام پروفایل را وارد کن."); return; }
    S().updateProfile({ name, role: $("pRole").value.trim(), company: $("pCompany").value.trim() });
    CRM.app.refreshAccount();
    UI.toast("پروفایل ذخیره شد.");
  }

  async function changePassword() {
    UI.clearErrors($("pwForm"));
    const oldPw = $("cOld").value, newPw = $("cNew").value, newPw2 = $("cNew2").value;
    let ok = true;
    if (!oldPw) { UI.setErr("f-c-old", "رمز فعلی را وارد کن."); ok = false; }
    if (newPw.length < 6) { UI.setErr("f-c-new", "رمز جدید حداقل ۶ نویسه باشد."); ok = false; }
    if (newPw2 !== newPw) { UI.setErr("f-c-new2", "تکرار رمز با رمز جدید یکی نیست."); ok = false; }
    if (!ok) return;
    const res = await S().changePassword(oldPw, newPw);
    if (res.error === "bad-password") { UI.setErr("f-c-old", "رمز فعلی درست نیست."); return; }
    ["cOld", "cNew", "cNew2"].forEach((id) => { $(id).value = ""; });
    UI.toast("رمز عبور تغییر کرد.");
  }

  function logout() {
    S().signOut();
    renderAuth();
    UI.toast("از حساب خارج شدی.");
  }

  function deleteAccount() {
    UI.clearErrors($("accountBox"));
    if ($("delWord").value.trim() !== "حذف") {
      UI.setErr("f-del", "برای تأیید، کلمه‌ی «حذف» را دقیقاً بنویس.");
      return;
    }
    S().deleteAccount();
    UI.closeAll();
    CRM.app.resetToStart();
    UI.toast("حساب و داده‌های این دستگاه پاک شد.");
  }

  $("settingsBtn").addEventListener("click", () => openSettings("look"));
  $("sideSettings").addEventListener("click", () => openSettings("look"));
  $("sClose").addEventListener("click", () => UI.closePanel("settingsModal"));
  $("sDone").addEventListener("click", () => UI.closePanel("settingsModal"));
  document.querySelectorAll("[data-stab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.stab)));
  document.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeSet)));
  $("themeBtn").addEventListener("click", () => setTheme(S().state.ui.theme === "dark" ? "light" : "dark"));
  $("fontUp").addEventListener("click", () => changeFont(1));
  $("fontDown").addEventListener("click", () => changeFont(-1));
  $("fontReset").addEventListener("click", resetFont);
  $("authTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    clearAuthErrors();
    setAuthTab(b.dataset.tab);
  });
  $("loginForm").addEventListener("submit", submitLogin);
  $("signupForm").addEventListener("submit", submitSignup);
  $("logoutBtn").addEventListener("click", logout);
  $("pSave").addEventListener("click", saveProfile);
  $("cSavePw").addEventListener("click", changePassword);
  $("delAccount").addEventListener("click", deleteAccount);

  CRM.settings = { applyAppearance, openSettings, renderAuth };
})(window.CRM);
