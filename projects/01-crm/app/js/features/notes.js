(function (CRM) {
  "use strict";

  const UI = CRM.ui;
  const $ = UI.$;
  const S = () => CRM.store;

  let editingId = null;

  function customerName(id) {
    if (!id) return "";
    const lead = S().leadById(id);
    return lead ? lead.name : "";
  }

  function fillCustomers(selectedId) {
    const sel = $("nCust");
    sel.textContent = "";
    const none = UI.el("option", "", "بدون مشتری");
    none.value = "";
    sel.appendChild(none);
    S().state.leads
      .filter((l) => l.business === S().state.business)
      .forEach((l) => {
        const o = UI.el("option", "", l.name);
        o.value = String(l.id);
        sel.appendChild(o);
      });
    sel.value = selectedId ? String(selectedId) : "";
  }

  function render() {
    const list = $("noteList");
    list.textContent = "";
    const q = UI.toEn($("noteQ").value).trim().toLowerCase();
    const items = S().bizNotes().filter((n) => !q || n.title.toLowerCase().indexOf(q) >= 0 || n.body.toLowerCase().indexOf(q) >= 0);
    if (!items.length) {
      list.appendChild(UI.el("div", "glass empty", "یادداشتی نیست. با «یادداشت جدید» شروع کن."));
      return;
    }
    items.forEach((n) => {
      const row = UI.el("article", "glass row-item");
      row.addEventListener("click", (e) => { if (!e.target.closest("button")) open(n.id); });
      const info = UI.el("div", "info");
      const preview = n.body.length > 140 ? n.body.slice(0, 140) + "…" : n.body;
      info.append(UI.el("div", "nm", n.title), UI.el("div", "meta", preview || "بدون متن"));
      const meta = [customerName(n.customerId), UI.jalaliTime(n.updatedAt)].filter(Boolean).join(" · ");
      info.appendChild(UI.el("div", "meta", meta));
      const btns = UI.el("div", "btns");
      const edit = UI.el("button", "btn sm", "ویرایش");
      edit.type = "button";
      edit.addEventListener("click", () => open(n.id));
      const del = UI.el("button", "btn sm danger", "حذف");
      del.type = "button";
      del.addEventListener("click", () => {
        if (del.dataset.armed !== "1") {
          del.dataset.armed = "1";
          del.textContent = "تأیید حذف";
          del.classList.add("confirm");
          return;
        }
        S().removeNote(n.id);
        S().save();
        render();
        UI.toast("یادداشت حذف شد.");
      });
      btns.append(edit, del);
      row.append(info, btns);
      list.appendChild(row);
    });
  }

  function open(id) {
    const note = id ? S().bizNotes().find((n) => n.id === id) : null;
    editingId = note ? note.id : null;
    $("nTitle").textContent = note ? "ویرایش یادداشت" : "یادداشت جدید";
    $("nTitleInput").value = note ? note.title : "";
    $("nBody").value = note ? note.body : "";
    $("nDelete").hidden = !note;
    $("nDelete").dataset.armed = "";
    $("nDelete").textContent = "حذف";
    fillCustomers(note ? note.customerId : null);
    UI.clearErrors($("noteForm"));
    UI.openPanel("noteModal");
  }

  function close() {
    UI.closePanel("noteModal");
  }

  function save() {
    const title = $("nTitleInput").value.trim();
    UI.setErr("f-n-title", title.length < 2 ? "عنوان را حداقل ۲ حرف وارد کن." : "");
    if (title.length < 2) return;
    const body = $("nBody").value.trim();
    const customerId = Number($("nCust").value) || null;
    const now = Date.now();
    if (editingId) {
      const note = S().state.notes.find((n) => n.id === editingId);
      if (note) Object.assign(note, { title, body, customerId, updatedAt: now });
    } else {
      S().addNote({ title, body, customerId, createdAt: now, updatedAt: now });
    }
    S().save();
    close();
    render();
    UI.toast(editingId ? "یادداشت ذخیره شد." : "یادداشت ثبت شد.");
  }

  function removeFromModal() {
    const btn = $("nDelete");
    if (btn.dataset.armed !== "1") {
      btn.dataset.armed = "1";
      btn.textContent = "تأیید حذف";
      btn.classList.add("confirm");
      return;
    }
    S().removeNote(editingId);
    S().save();
    close();
    render();
    UI.toast("یادداشت حذف شد.");
  }

  $("newNote").addEventListener("click", () => open(null));
  $("noteQ").addEventListener("input", render);
  $("nSave").addEventListener("click", save);
  $("nCancel").addEventListener("click", close);
  $("nClose").addEventListener("click", close);
  $("nDelete").addEventListener("click", removeFromModal);

  CRM.notes = { render, open };
})(window.CRM);
