
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const KEY = "schoolRP_classroom_v1";
  const PERIODS = [1, 2, 3, 4, 6, 7];

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const id = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString(36) +
        Math.random().toString(36).slice(2);

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));

  const students = [
    ["10001", "Alex Morgan"],
    ["10002", "Jordan Lee"],
    ["10003", "Taylor Brooks"],
    ["10004", "Casey Rivera"],
    ["10005", "Morgan Davis"],
    ["10006", "Avery Wilson"],
    ["10007", "Riley Parker"],
    ["10008", "Cameron Smith"],
    ["10009", "Jamie Thompson"],
    ["10010", "Quinn Johnson"],
    ["10011", "Dakota Brown"],
    ["10012", "Reese Taylor"]
  ].map(([id, name]) => ({
    id,
    name,
    grade: 7
  }));

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  const profile = readJSON("teacherProfile", {});

  const teacher =
    profile.name || profile.teacherName || "Teacher";

  const subject =
    profile.subject ||
    profile.teacherSubject ||
    "General Studies";

  const grade =
    profile.grade || profile.teacherGrade || "7";

  let data = readJSON(KEY, { classes: [] });

  if (!Array.isArray(data.classes)) {
    data = { classes: [] };
  }

  let currentClassId = null;
  let editingWorkId = null;
  let editingType = "assignment";
  let calendarDate = new Date();
  let collapsedTopics = new Set();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      alert("Unable to save. Browser storage may be full.");
    }
  }

  function current() {
    return data.classes.find(c => c.id === currentClassId);
  }

  function getStudent(sid) {
    return students.find(s => s.id === sid);
  }

  function dateLabel(iso) {
    if (!iso) return "No due date";

    const [y, m, d] = iso.split("-").map(Number);

    return new Date(y, m - 1, d).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  }

  // ==========================================
  // INITIALIZE CLASSES
  // ==========================================

  let added = false;

  PERIODS.forEach(period => {
    const section = `Period ${period}`;

    const exists = data.classes.some(c =>
      String(c.section || "")
        .trim()
        .toLowerCase() === section.toLowerCase()
    );

    if (exists) return;

    data.classes.push({
      id: id(),
      code: Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase(),
      name: `${subject} ${grade}`,
      section,
      room: "204",
      subject,
      students: [],
      announcements: [],
      work: [],
      topics: [],
      automatic: true
    });

    added = true;
  });

  data.classes.forEach(c => {
    c.students ||= [];
    c.announcements ||= [];
    c.work ||= [];
    c.topics ||= [];
  });

  if (added) save();

  // ==========================================
  // TEACHER PROFILE
  // ==========================================

  $("teacherDisplay").textContent = teacher;
  $("welcomeMessage").textContent = `Welcome, ${teacher}`;

  $("settingsTeacherName").textContent = teacher;
  $("settingsTeacherSubject").textContent = subject;
  $("settingsTeacherGrade").textContent = grade;

  const avatar = document.querySelector(".teacher-avatar");

  if (avatar) {
    avatar.textContent = teacher.charAt(0).toUpperCase();
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  function view(name) {
    $$(".view").forEach(el => {
      el.classList.toggle(
        "active",
        el.id === `${name}View`
      );
    });

    $$(".nav-item[data-view]").forEach(el => {
      el.classList.toggle(
        "active",
        el.dataset.view === name
      );
    });

    const titles = {
      home: "Classroom",
      classes: "Teaching",
      classDetail: current()?.name || "Classroom",
      assignmentEditor: "Classwork",
      calendar: "Calendar",
      todo: "To Review",
      settings: "Settings"
    };

    $("pageTitle").textContent =
      titles[name] || "Classroom";

    if (name === "home" || name === "classes") {
      renderClasses();
    }

    if (name === "calendar") renderCalendar();
    if (name === "todo") renderReview();
  }

  // ==========================================
  // CLASS CARDS
  // ==========================================

  function renderClasses() {
    const sorted = [...data.classes].sort((a, b) => {
      const period = c =>
        Number(
          String(c.section || "")
            .match(/Period\s*(\d+)/i)?.[1] || 99
        );

      return period(a) - period(b);
    });

    const cards = sorted.map(c => `
      <article
        class="class-card"
        data-class-id="${esc(c.id)}"
        role="button"
        tabindex="0"
      >
        <div class="class-card-header">
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.section)}</p>
        </div>

        <div class="class-card-body">
          <p>${esc(c.subject)}</p>

          <p class="muted">
            Room ${esc(c.room || "Not set")}
            · ${c.students.length} students
          </p>
        </div>

        <div class="class-card-footer">
          Open class →
        </div>
      </article>
    `).join("");

    $("homeClassGrid").innerHTML = cards;
    $("classGrid").innerHTML = cards;

    $("sidebarClassList").innerHTML =
      sorted.map(c => `
        <button
          class="sidebar-class"
          data-class-id="${esc(c.id)}"
        >
          ${esc(c.name)} — ${esc(c.section)}
        </button>
      `).join("");

    $$("[data-class-id]").forEach(el => {
      const open = () => openClass(el.dataset.classId);

      el.addEventListener("click", open);

      el.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function openClass(classId) {
    currentClassId = classId;

    const c = current();
    if (!c) return;

    $("classTitle").textContent = c.name;

    $("classSubtitle").textContent =
      `${c.section} · Room ${c.room || "Not set"}`;

    $("classCodeDisplay").textContent =
      `Class code: ${c.code}`;

    view("classDetail");
    classTab("stream");
  }

  function classTab(tab) {
    $$(".class-tab").forEach(el => {
      el.classList.toggle(
        "active",
        el.dataset.classTab === tab
      );
    });

    $$(".class-panel").forEach(el => {
      el.classList.toggle(
        "active",
        el.id === `${tab}Panel`
      );
    });

    if (tab === "stream") renderStream();
    if (tab === "classwork") renderClasswork();
    if (tab === "people") renderStudents();
    if (tab === "grades") renderGrades();
  }

  // ==========================================
  // STREAM
  // ==========================================

  function renderStream() {
    const c = current();
    if (!c) return;

    $("streamPosts").innerHTML =
      c.announcements.length
        ? [...c.announcements].reverse().map(p => `
          <article class="stream-post">
            <h3>Announcement</h3>
            <small>${esc(p.date)}</small>

            <p style="white-space:pre-wrap">
              ${esc(p.text)}
            </p>
          </article>
        `).join("")
        : '<div class="empty-state">No announcements yet.</div>';

    const upcoming = c.work
      .filter(w => w.status !== "draft" && w.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    $("upcomingWork").innerHTML =
      upcoming.length
        ? upcoming.map(w => `
          <p>
            <strong>${esc(w.title)}</strong>
            <br>
            <small>Due ${esc(dateLabel(w.dueDate))}</small>
          </p>
        `).join("")
        : '<p class="muted">No upcoming work.</p>';
  }

  // ==========================================
  // CLASSWORK
  // ==========================================

  function allTopics(c) {
    if (!c) return [];

    return [...new Set([
      ...(c.topics || []),
      ...c.work.map(w => w.topic).filter(Boolean)
    ])];
  }

  function renderClasswork() {
    const c = current();
    if (!c) return;

    const topics = allTopics(c);
    const filter = $("classworkTopicFilter");
    const previous = filter.value;

    filter.innerHTML =
      '<option value="all">All topics</option>' +
      topics.map(t => `
        <option value="${esc(t)}">${esc(t)}</option>
      `).join("");

    filter.value =
      topics.includes(previous) ? previous : "all";

    const shown =
      filter.value === "all"
        ? c.work
        : c.work.filter(
            w => (w.topic || "") === filter.value
          );

    const workCard = w => `
      <article class="work-item">
        <h3>${esc(w.title || "Untitled")}</h3>

        <p>
          ${esc(({
            assignment: "Assignment",
            quiz: "Quiz assignment",
            question: "Question",
            material: "Material"
          })[w.type] || w.type)}
          ·
          ${w.status === "draft" ? "Draft" : "Assigned"}
          ·
          ${esc(dateLabel(w.dueDate))}
        </p>

        <p>${esc(w.instructions || "")}</p>

        <button
          class="text-btn"
          data-edit-work="${esc(w.id)}"
        >
          Edit
        </button>

        <button
          class="text-btn"
          data-grade-work="${esc(w.id)}"
        >
          Enter grades
        </button>
      </article>
    `;

    let html = "";

    const groups =
      filter.value === "all"
        ? topics
        : topics.filter(t => t === filter.value);

    groups.forEach(topic => {
      const works = shown.filter(w => w.topic === topic);

      html += `
        <section class="topic-section">
          <div class="topic-header">
            <h3>${esc(topic)}</h3>

            <button
              class="topic-toggle"
              data-toggle-topic="${esc(topic)}"
            >
              ${collapsedTopics.has(topic) ? "⌄" : "⌃"}
            </button>
          </div>

          <div class="topic-items ${
            collapsedTopics.has(topic) ? "collapsed" : ""
          }">
            ${
              works.length
                ? works.map(workCard).join("")
                : '<p class="muted">No work in this topic yet.</p>'
            }
          </div>
        </section>
      `;
    });

    const ungrouped = shown.filter(w => !w.topic);

    if (ungrouped.length) {
      html += `
        <section class="topic-section">
          <div class="topic-header">
            <h3>Without a topic</h3>
          </div>

          ${ungrouped.map(workCard).join("")}
        </section>
      `;
    }

    $("classworkList").innerHTML =
      html || `
        <div class="empty-state">
          <h3>No classwork yet</h3>
          <p>Click Create to add an assignment or topic.</p>
        </div>
      `;

    $$("[data-toggle-topic]").forEach(button => {
      button.onclick = () => {
        const topic = button.dataset.toggleTopic;

        if (collapsedTopics.has(topic)) {
          collapsedTopics.delete(topic);
        } else {
          collapsedTopics.add(topic);
        }

        renderClasswork();
      };
    });

    $$("[data-edit-work]").forEach(button => {
      button.onclick = () => {
        const work = current().work.find(
          w => w.id === button.dataset.editWork
        );

        if (!work) return;

        if (work.type === "quiz" && work.formId) {
          openRiversideForms(work.formId);
        } else {
          openEditor(work);
        }
      };
    });

    $$("[data-grade-work]").forEach(button => {
      button.onclick = () =>
        gradeAssignment(button.dataset.gradeWork);
    });
  }

  // ==========================================
  // RIVERSIDE FORMS CONNECTION
  // ==========================================

  function openRiversideForms(existingFormId = null) {
    const c = current();

    if (!c) {
      alert("Please open a class first.");
      return;
    }

    const formId = existingFormId || id();

    const params = new URLSearchParams({
      id: formId,
      classId: c.id,
      source: "classroom"
    });

    window.location.href =
      "forms.html?" + params.toString();
  }

  // ==========================================
  // ASSIGNMENT EDITOR
  // ==========================================

  function editorOptions() {
    $("editorAssignmentClass").innerHTML =
      data.classes.map(c => `
        <option value="${esc(c.id)}">
          ${esc(c.name)} — ${esc(c.section)}
        </option>
      `).join("");

    $("editorAssignmentClass").value = currentClassId;

    $("editorAssignmentTopic").innerHTML =
      '<option value="">No topic</option>' +
      allTopics(current()).map(t => `
        <option value="${esc(t)}">${esc(t)}</option>
      `).join("");
  }

  function openEditor(work = null, type = "assignment") {
    const c = current();
    if (!c) return;

    editingWorkId = work?.id || null;
    editingType = work?.type || type;

    editorOptions();

    const names = {
      assignment: "Assignment",
      quiz: "Quiz assignment",
      question: "Question",
      material: "Material"
    };

    $("assignmentEditorHeading").textContent =
      names[editingType] || "Assignment";

    $("editorAssignmentTitle").value =
      work?.title || "";

    $("editorAssignmentInstructions").value =
      work?.instructions || "";

    $("editorAssignmentPoints").value =
      work?.points ??
      (editingType === "material" ? 0 : 100);

    $("editorAssignmentDueDate").value =
      work?.dueDate || "";

    $("editorAssignmentTopic").value =
      work?.topic || "";

    $("editorAssignmentCategory").value =
      editingType;

    $("assignmentAttachments").innerHTML =
      (work?.attachments || []).map(a => `
        <p>
          🔗
          <a
            href="${esc(a.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${esc(a.label || a.url)}
          </a>
        </p>
      `).join("");

    $("assignmentSaveStatus").textContent =
      work
        ? work.status === "draft"
          ? "Draft"
          : "Assigned"
        : "Unsaved changes";

    view("assignmentEditor");
  }

  function saveEditor(status) {
    const title =
      $("editorAssignmentTitle").value.trim();

    if (!title) {
      alert("Enter an assignment title.");
      $("editorAssignmentTitle").focus();
      return;
    }

    const source = current();
    if (!source) return;

    const target = data.classes.find(
      c => c.id === $("editorAssignmentClass").value
    ) || source;

    let work = source.work.find(
      w => w.id === editingWorkId
    );

    if (!work) {
      work = {
        id: id(),
        grades: {},
        questions: [],
        attachments: []
      };

      target.work.push(work);
    } else if (target.id !== source.id) {
      source.work = source.work.filter(
        w => w.id !== work.id
      );

      target.work.push(work);
    }

    Object.assign(work, {
      title,
      instructions:
        $("editorAssignmentInstructions").value.trim(),
      points: Math.max(
        0,
        Number($("editorAssignmentPoints").value) || 0
      ),
      dueDate: $("editorAssignmentDueDate").value,
      topic: $("editorAssignmentTopic").value,
      type: $("editorAssignmentCategory").value,
      status
    });

    save();

    currentClassId = target.id;

    openClass(target.id);
    classTab("classwork");
  }

  // ==========================================
  // STUDENTS
  // ==========================================

  function renderStudents() {
    const c = current();
    if (!c) return;

    $("classStudentList").innerHTML =
      c.students.map(sid => {
        const s = getStudent(sid);

        if (!s) return "";

        return `
          <tr>
            <td>${esc(s.name)}</td>
            <td>${esc(s.id)}</td>
            <td>${s.grade}</td>
          </tr>
        `;
      }).join("") ||
      '<tr><td colspan="3">No students enrolled.</td></tr>';
  }

  // ==========================================
  // GRADES
  // ==========================================

  function renderGrades() {
    const c = current();
    if (!c) return;

    $("classGradesBody").innerHTML =
      c.students.map(sid => {
        const s = getStudent(sid);
        if (!s) return "";

        let earned = 0;
        let possible = 0;
        let count = 0;

        c.work
          .filter(w => w.status !== "draft")
          .forEach(w => {
            const score = w.grades?.[sid];

            if (
              score !== undefined &&
              score !== null
            ) {
              earned += Number(score);
              possible += Number(w.points) || 0;
              count++;
            }
          });

        return `
          <tr>
            <td>${esc(s.name)}</td>
            <td>${count} graded</td>
            <td>
              ${
                possible
                  ? Math.round(
                      earned / possible * 100
                    ) + "%"
                  : "Not graded"
              }
            </td>
          </tr>
        `;
      }).join("") ||
      '<tr><td colspan="3">No students enrolled.</td></tr>';
  }

  function gradeAssignment(workId) {
    const c = current();

    const work = c?.work.find(
      w => w.id === workId
    );

    if (!work) return;

    if (!c.students.length) {
      alert("Add students to the class first.");
      return;
    }

    work.grades ||= {};

    for (const sid of c.students) {
      const student = getStudent(sid);
      if (!student) continue;

      const value = prompt(
        `${work.title}\n${student.name}\nScore out of ${work.points} (Cancel to stop):`,
        work.grades[sid] ?? ""
      );

      if (value === null) break;
      if (value.trim() === "") continue;

      const score = Number(value);

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > Number(work.points)
      ) {
        alert("Invalid score.");
        continue;
      }

      work.grades[sid] = score;
    }

    save();
    renderGrades();
  }

  // ==========================================
  // CALENDAR
  // ==========================================

  function renderCalendar() {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();

    $("calendarMonth").textContent =
      calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });

    let html = [
      "Sun", "Mon", "Tue", "Wed",
      "Thu", "Fri", "Sat"
    ].map(day => `
      <div class="calendar-day">
        <strong>${day}</strong>
      </div>
    `).join("");

    html += '<div class="calendar-day"></div>'
      .repeat(new Date(y, m, 1).getDay());

    const daysInMonth =
      new Date(y, m + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const iso =
        `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const events = data.classes.flatMap(c =>
        c.work
          .filter(w =>
            w.status !== "draft" &&
            w.dueDate === iso
          )
          .map(w => `${c.section}: ${w.title}`)
      );

      const today = new Date();

      const isToday =
        today.getFullYear() === y &&
        today.getMonth() === m &&
        today.getDate() === day;

      html += `
        <div class="calendar-day ${
          isToday ? "today" : ""
        }">
          <strong>${day}</strong>

          ${events.map(event => `
            <div class="calendar-event">
              ${esc(event)}
            </div>
          `).join("")}
        </div>
      `;
    }

    $("calendarGrid").innerHTML = html;
  }

  // ==========================================
  // TO REVIEW
  // ==========================================

  function renderReview() {
    const works = data.classes.flatMap(c =>
      c.work
        .filter(w => w.status !== "draft")
        .map(w => ({ c, w }))
    );

    $("reviewList").innerHTML =
      works.map(({ c, w }) => `
        <article class="work-item">
          <h3>${esc(w.title)}</h3>

          <p>
            ${esc(c.name)} · ${esc(c.section)}
          </p>

          <p class="muted">
            Open the class to enter grades.
            Student submissions are not simulated yet.
          </p>
        </article>
      `).join("") ||
      '<div class="empty-state">Nothing to review yet.</div>';
  }

  // ==========================================
  // NAVIGATION EVENTS
  // ==========================================

  $$(".nav-item[data-view]").forEach(button => {
    button.onclick = () =>
      view(button.dataset.view);
  });

  $$(".class-tab").forEach(button => {
    button.onclick = () =>
      classTab(button.dataset.classTab);
  });

  $("backToClasses").onclick =
    () => view("classes");

  $("menuToggle").onclick = () =>
    $("sidebar").classList.toggle("collapsed");

  // ==========================================
  // CREATE CLASS
  // ==========================================

  const openCreateClass = () =>
    $("createClassDialog").showModal();

  $("homeCreateClass").onclick = openCreateClass;
  $("createClassButton").onclick = openCreateClass;

  $("cancelCreateClass").onclick =
    () => $("createClassDialog").close();

  $("createClassForm").onsubmit = event => {
    event.preventDefault();

    const c = {
      id: id(),
      code: Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase(),
      name: $("newClassName").value.trim(),
      section: $("newClassSection").value.trim(),
      room: $("newClassRoom").value.trim(),
      subject: $("newClassSubject").value,
      students: [],
      announcements: [],
      work: [],
      topics: []
    };

    if (!c.name) return;

    data.classes.push(c);
    save();

    $("createClassForm").reset();
    $("createClassDialog").close();

    openClass(c.id);
  };

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  $("postAnnouncement").onclick = () => {
    const text =
      $("announcementText").value.trim();

    if (!text || !current()) return;

    current().announcements.push({
      id: id(),
      text,
      date: new Date().toLocaleString()
    });

    save();

    $("announcementText").value = "";
    renderStream();
  };

  // ==========================================
  // CREATE CLASSWORK MENU
  // ==========================================

  $("openCreateWork").onclick = () => {
    const menu = $("createWorkMenu");

    menu.hidden = !menu.hidden;

    $("openCreateWork").setAttribute(
      "aria-expanded",
      String(!menu.hidden)
    );
  };

  document.addEventListener("click", event => {
    if (
      !event.target.closest("#openCreateWork") &&
      !event.target.closest("#createWorkMenu")
    ) {
      $("createWorkMenu").hidden = true;

      $("openCreateWork").setAttribute(
        "aria-expanded",
        "false"
      );
    }
  });

  $$("[data-create-type]").forEach(button => {
    button.onclick = () => {
      $("createWorkMenu").hidden = true;

      $("openCreateWork").setAttribute(
        "aria-expanded",
        "false"
      );

      const type = button.dataset.createType;

      if (type === "topic") {
        $("createTopicDialog").showModal();
        return;
      }

      if (type === "reuse") {
        alert("Reuse post will be added later.");
        return;
      }

      // NEW: Open Riverside Forms for quizzes.
      if (type === "quiz") {
        openRiversideForms();
        return;
      }

      openEditor(null, type);
    };
  });

  // ==========================================
  // TOPICS
  // ==========================================

  $("createTopicForm").onsubmit = event => {
    event.preventDefault();

    const name = $("newTopicName").value.trim();
    const c = current();

    if (!name || !c) return;

    if (!allTopics(c).includes(name)) {
      c.topics.push(name);
    }

    save();

    $("createTopicForm").reset();
    $("createTopicDialog").close();

    renderClasswork();
  };

  $("cancelCreateTopic").onclick =
    () => $("createTopicDialog").close();

  $("classworkTopicFilter").onchange =
    renderClasswork;

  $("collapseTopics").onclick = () => {
    const topics = allTopics(current());

    collapsedTopics =
      collapsedTopics.size === topics.length
        ? new Set()
        : new Set(topics);

    renderClasswork();

    $("collapseTopics").textContent =
      collapsedTopics.size
        ? "Expand all"
        : "Collapse all";
  };

  // ==========================================
  // ASSIGNMENT EDITOR EVENTS
  // ==========================================

  $("closeAssignmentEditor").onclick = () => {
    openClass(currentClassId);
    classTab("classwork");
  };

  $("saveAssignmentDraft").onclick =
    () => saveEditor("draft");

  $("publishAssignment").onclick =
    () => saveEditor("assigned");

  $("assignmentMoreOptions").onclick = () =>
    alert("Scheduling will be added later.");

  $("editorAssignmentClass").onchange = () => {
    const c = data.classes.find(
      c => c.id === $("editorAssignmentClass").value
    );

    if (!c) return;

    $("editorAssignmentTopic").innerHTML =
      '<option value="">No topic</option>' +
      allTopics(c).map(t => `
        <option value="${esc(t)}">${esc(t)}</option>
      `).join("");
  };

  [
    "editorAssignmentTitle",
    "editorAssignmentInstructions",
    "editorAssignmentPoints",
    "editorAssignmentDueDate",
    "editorAssignmentTopic"
  ].forEach(key => {
    $(key).addEventListener("input", () => {
      $("assignmentSaveStatus").textContent =
        "Unsaved changes";
    });
  });

  // ==========================================
  // ATTACHMENTS
  // ==========================================

  $("attachLink").onclick = () => {
    const url = prompt("Enter a web link:");

    if (!url) return;

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol !== "https:" &&
        parsed.protocol !== "http:"
      ) {
        throw new Error("Invalid protocol");
      }

      $("assignmentAttachments").insertAdjacentHTML(
        "beforeend",
        `
          <p>
            🔗
            <a
              href="${esc(parsed.href)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${esc(parsed.href)}
            </a>
          </p>
        `
      );

      alert(
        "Link preview added. Permanent attachment saving will be added later."
      );
    } catch {
      alert("Please enter a valid web link.");
    }
  };

  $("attachFile").onclick = () =>
    alert(
      "File uploads require additional storage support."
    );

  // NEW: The Forms attachment button now works.
  $("attachForm").onclick = () =>
    openRiversideForms();

  // ==========================================
  // ADD STUDENTS
  // ==========================================

  $("addStudentsButton").onclick = () => {
    const c = current();
    if (!c) return;

    $("availableStudents").innerHTML =
      students.map(s => `
        <label style="display:block;padding:10px">
          <input
            class="student-checkbox"
            type="checkbox"
            value="${esc(s.id)}"
            ${c.students.includes(s.id) ? "checked" : ""}
          >

          ${esc(s.name)} (${esc(s.id)})
        </label>
      `).join("");

    $("addStudentsDialog").showModal();
  };

  $("closeAddStudents").onclick =
    () => $("addStudentsDialog").close();

  $("saveClassStudents").onclick = () => {
    const c = current();
    if (!c) return;

    c.students =
      $$(".student-checkbox:checked")
        .map(el => el.value);

    save();

    $("addStudentsDialog").close();

    renderStudents();
    renderGrades();
    renderClasses();
  };

  // ==========================================
  // CALENDAR EVENTS
  // ==========================================

  $("previousMonth").onclick = () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() - 1,
      1
    );

    renderCalendar();
  };

  $("nextMonth").onclick = () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      1
    );

    renderCalendar();
  };

  // ==========================================
  // START APPLICATION
  // ==========================================

  renderClasses();
  view("home");
});
