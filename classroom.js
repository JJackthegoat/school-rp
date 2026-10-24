
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const KEY = "schoolRP_classroom_v1";
  const PARENT_STUDENT_KEY = "riverside_ai_students_v1";
  const PERIODS = [1, 2, 3, 4, 6, 7];

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const id = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[ch]));

  const students = [
    ["10001", "Alex Morgan"], ["10002", "Jordan Lee"],
    ["10003", "Taylor Brooks"], ["10004", "Casey Rivera"],
    ["10005", "Morgan Davis"], ["10006", "Avery Wilson"],
    ["10007", "Riley Parker"], ["10008", "Cameron Smith"],
    ["10009", "Jamie Thompson"], ["10010", "Quinn Johnson"],
    ["10011", "Dakota Brown"], ["10012", "Reese Taylor"]
  ].map(([id, name]) => ({ id, name, grade: 7 }));

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  const profile = readJSON("teacherProfile", {});
  const teacher = profile.name || profile.teacherName || "Teacher";
  const subject = profile.subject || profile.teacherSubject || "General Studies";
  const grade = profile.grade || profile.teacherGrade || "7";

  let data = readJSON(KEY, { classes: [] });
  if (!Array.isArray(data.classes)) data = { classes: [] };

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
    return students.find(s => String(s.id) === String(sid));
  }

  const EXTRA_FIRST_NAMES = [
    "Sam", "Peyton", "Emerson", "Rowan", "Skyler", "Finley",
    "Charlie", "Blake", "Drew", "Reagan", "Kendall", "Harper",
    "Logan", "Micah", "Sage", "Adrian", "Ellis", "Jesse",
    "Remy", "Shiloh", "Robin", "Frankie", "Lennon", "Ari",
    "Marley", "River", "Cory", "Jamie", "Phoenix", "Bailey"
  ];

  const EXTRA_LAST_NAMES = [
    "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin",
    "Garcia", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young",
    "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson",
    "Hill", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips",
    "Evans", "Turner", "Torres", "Collins"
  ];

  function buildStudentRoster() {
    const roster = readJSON(PARENT_STUDENT_KEY, []);
    const stored = Array.isArray(roster) ? roster : [];
    const knownIds = new Set([
      ...students.map(s => String(s.id)),
      ...stored.filter(Boolean).map(s => String(s.id))
    ]);

    for (let i = 0; i < 120; i++) {
      const studentId = String(10001 + i);
      if (knownIds.has(studentId)) continue;

      const student = {
        id: studentId,
        name: `${EXTRA_FIRST_NAMES[i % EXTRA_FIRST_NAMES.length]} ${
          EXTRA_LAST_NAMES[
            Math.floor(i / EXTRA_FIRST_NAMES.length) %
            EXTRA_LAST_NAMES.length
          ]
        }`,
        grade: 7
      };

      students.push(student);
      knownIds.add(studentId);
    }

    const merged = new Map();
    [...stored, ...students].forEach(student => {
      if (!student || student.id == null) return;
      merged.set(String(student.id), {
        id: String(student.id),
        name: student.name || "Student",
        grade: student.grade ?? 7
      });
    });

    try {
      localStorage.setItem(
        PARENT_STUDENT_KEY,
        JSON.stringify([...merged.values()])
      );
    } catch (error) {
      console.error("Could not sync student roster:", error);
      alert("The shared parent roster could not be saved. Check browser storage.");
    }
  }

  function dateLabel(iso) {
    if (!iso) return "No due date";
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  // INITIALIZE CLASSES
  let added = false;

  PERIODS.forEach(period => {
    const section = `Period ${period}`;
    const exists = data.classes.some(c =>
      String(c.section || "").trim().toLowerCase() === section.toLowerCase()
    );
    if (exists) return;

    data.classes.push({
      id: id(),
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
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

  // TEACHER PROFILE
  $("teacherDisplay").textContent = teacher;
  $("welcomeMessage").textContent = `Welcome, ${teacher}`;
  $("settingsTeacherName").textContent = teacher;
  $("settingsTeacherSubject").textContent = subject;
  $("settingsTeacherGrade").textContent = grade;

  const avatar = document.querySelector(".teacher-avatar");
  if (avatar) avatar.textContent = teacher.charAt(0).toUpperCase();

  // NAVIGATION
  function view(name) {
    $$(".view").forEach(el =>
      el.classList.toggle("active", el.id === `${name}View`)
    );

    $$(".nav-item[data-view]").forEach(el =>
      el.classList.toggle("active", el.dataset.view === name)
    );

    const titles = {
      home: "Classroom",
      classes: "Teaching",
      classDetail: current()?.name || "Classroom",
      assignmentEditor: "Classwork",
      calendar: "Calendar",
      todo: "To Review",
      settings: "Settings"
    };

    $("pageTitle").textContent = titles[name] || "Classroom";
    if (name === "home" || name === "classes") renderClasses();
    if (name === "calendar") renderCalendar();
    if (name === "todo") renderReview();
  }

  // CLASS CARDS
  function renderClasses() {
    const sorted = [...data.classes].sort((a, b) => {
      const period = c => Number(
        String(c.section || "").match(/Period\s*(\d+)/i)?.[1] || 99
      );
      return period(a) - period(b);
    });

    const cards = sorted.map(c => `
      <article class="class-card" data-class-id="${esc(c.id)}"
        role="button" tabindex="0">
        <div class="class-card-header">
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.section)}</p>
        </div>
        <div class="class-card-body">
          <p>${esc(c.subject)}</p>
          <p class="muted">Room ${esc(c.room || "Not set")} · ${c.students.length} students</p>
        </div>
        <div class="class-card-footer">Open class →</div>
      </article>
    `).join("");

    $("homeClassGrid").innerHTML = cards;
    $("classGrid").innerHTML = cards;

    $("sidebarClassList").innerHTML = sorted.map(c => `
      <button class="sidebar-class" data-class-id="${esc(c.id)}">
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
    $("classSubtitle").textContent = `${c.section} · Room ${c.room || "Not set"}`;
    $("classCodeDisplay").textContent = `Class code: ${c.code}`;
    view("classDetail");
    classTab("stream");
  }

  function classTab(tab) {
    $$(".class-tab").forEach(el =>
      el.classList.toggle("active", el.dataset.classTab === tab)
    );
    $$(".class-panel").forEach(el =>
      el.classList.toggle("active", el.id === `${tab}Panel`)
    );

    if (tab === "stream") renderStream();
    if (tab === "classwork") renderClasswork();
    if (tab === "people") renderStudents();
    if (tab === "grades") renderGrades();
  }

  // STREAM
  function renderStream() {
    const c = current();
    if (!c) return;

    $("streamPosts").innerHTML = c.announcements.length
      ? [...c.announcements].reverse().map(p => `
        <article class="stream-post">
          <h3>Announcement</h3>
          <small>${esc(p.date)}</small>
          <p style="white-space:pre-wrap">${esc(p.text)}</p>
        </article>
      `).join("")
      : '<div class="empty-state">No announcements yet.</div>';

    const upcoming = c.work
      .filter(w => w.status !== "draft" && w.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    $("upcomingWork").innerHTML = upcoming.length
      ? upcoming.map(w => `
        <p><strong>${esc(w.title)}</strong><br>
        <small>Due ${esc(dateLabel(w.dueDate))}</small></p>
      `).join("")
      : '<p class="muted">No upcoming work.</p>';
  }

  // CLASSWORK
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

    filter.innerHTML = '<option value="all">All topics</option>' +
      topics.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");

    filter.value = topics.includes(previous) ? previous : "all";

    const shown = filter.value === "all"
      ? c.work
      : c.work.filter(w => (w.topic || "") === filter.value);

    const workCard = w => `
      <article class="work-item">
        <h3>${esc(w.title || "Untitled")}</h3>
        <p>${esc(({
          assignment: "Assignment", quiz: "Quiz assignment",
          question: "Question", material: "Material"
        })[w.type] || w.type)} · ${w.status === "draft" ? "Draft" : "Assigned"}
        · ${esc(dateLabel(w.dueDate))}</p>
        <p>${esc(w.instructions || "")}</p>
        <button class="text-btn" data-edit-work="${esc(w.id)}">Edit</button>
        <button class="text-btn" data-grade-work="${esc(w.id)}">Enter grades</button>
      </article>
    `;

    let html = "";
    const groups = filter.value === "all" ? topics : topics.filter(t => t === filter.value);

    groups.forEach(topic => {
      const works = shown.filter(w => w.topic === topic);
      html += `
        <section class="topic-section">
          <div class="topic-header">
            <h3>${esc(topic)}</h3>
            <button class="topic-toggle" data-toggle-topic="${esc(topic)}">
              ${collapsedTopics.has(topic) ? "⌄" : "⌃"}
            </button>
          </div>
          <div class="topic-items ${collapsedTopics.has(topic) ? "collapsed" : ""}">
            ${works.length ? works.map(workCard).join("") : '<p class="muted">No work in this topic yet.</p>'}
          </div>
        </section>`;
    });

    const ungrouped = shown.filter(w => !w.topic);
    if (ungrouped.length) {
      html += `<section class="topic-section"><div class="topic-header">
        <h3>Without a topic</h3></div>${ungrouped.map(workCard).join("")}</section>`;
    }

    $("classworkList").innerHTML = html || `
      <div class="empty-state"><h3>No classwork yet</h3>
      <p>Click Create to add an assignment or topic.</p></div>`;

    $$("[data-toggle-topic]").forEach(button => {
      button.onclick = () => {
        const topic = button.dataset.toggleTopic;
        if (collapsedTopics.has(topic)) collapsedTopics.delete(topic);
        else collapsedTopics.add(topic);
        renderClasswork();
      };
    });

    $$("[data-edit-work]").forEach(button => {
      button.onclick = () => {
        const work = current().work.find(w => w.id === button.dataset.editWork);
        if (!work) return;
        if (work.type === "quiz" && work.formId) openRiversideForms(work.formId);
        else openEditor(work);
      };
    });

    $$("[data-grade-work]").forEach(button => {
      button.onclick = () => gradeAssignment(button.dataset.gradeWork);
    });
  }

  // RIVERSIDE FORMS CONNECTION
  function openRiversideForms(existingFormId = null) {
    const c = current();
    if (!c) {
      alert("Please open a class first.");
      return;
    }
    const formId = existingFormId || id();
    const params = new URLSearchParams({
      id: formId, classId: c.id, source: "classroom"
    });
    window.location.href = "forms.html?" + params.toString();
  }

  // ASSIGNMENT EDITOR
  function editorOptions() {
    $("editorAssignmentClass").innerHTML = data.classes.map(c => `
      <option value="${esc(c.id)}">${esc(c.name)} — ${esc(c.section)}</option>
    `).join("");
    $("editorAssignmentClass").value = currentClassId;
    $("editorAssignmentTopic").innerHTML = '<option value="">No topic</option>' +
      allTopics(current()).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  }

  function openEditor(work = null, type = "assignment") {
    const c = current();
    if (!c) return;

    editingWorkId = work?.id || null;
    editingType = work?.type || type;
    editorOptions();

    const names = {
      assignment: "Assignment", quiz: "Quiz assignment",
      question: "Question", material: "Material"
    };
    $("assignmentEditorHeading").textContent = names[editingType] || "Assignment";
    $("editorAssignmentTitle").value = work?.title || "";
    $("editorAssignmentInstructions").value = work?.instructions || "";
    $("editorAssignmentPoints").value = work?.points ?? (editingType === "material" ? 0 : 100);
    $("editorAssignmentDueDate").value = work?.dueDate || "";
    $("editorAssignmentTopic").value = work?.topic || "";
    $("editorAssignmentCategory").value = editingType;

    $("assignmentAttachments").innerHTML = (work?.attachments || []).map(a => `
      <p>🔗 <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">
      ${esc(a.label || a.url)}</a></p>
    `).join("");

    $("assignmentSaveStatus").textContent = work
      ? work.status === "draft" ? "Draft" : "Assigned"
      : "Unsaved changes";

    view("assignmentEditor");
  }

  function saveEditor(status) {
    const title = $("editorAssignmentTitle").value.trim();
    if (!title) {
      alert("Enter an assignment title.");
      $("editorAssignmentTitle").focus();
      return;
    }

    const source = current();
    if (!source) return;

    const target = data.classes.find(c => c.id === $("editorAssignmentClass").value) || source;
    let work = source.work.find(w => w.id === editingWorkId);

    if (!work) {
      work = { id: id(), grades: {}, questions: [], attachments: [] };
      target.work.push(work);
    } else if (target.id !== source.id) {
      source.work = source.work.filter(w => w.id !== work.id);
      target.work.push(work);
    }

    Object.assign(work, {
      title,
      instructions: $("editorAssignmentInstructions").value.trim(),
      points: Math.max(0, Number($("editorAssignmentPoints").value) || 0),
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

  // STUDENTS
  function renderStudents() {
    const c = current();
    if (!c) return;

    $("classStudentList").innerHTML = c.students.map(sid => {
      const s = getStudent(sid);
      if (!s) return "";

      return `<tr>
        <td>${esc(s.name)}</td>
        <td>${esc(s.id)}</td>
        <td>${esc(s.grade)}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="3">No students enrolled.</td></tr>';
  }

  // GRADES
  function renderGrades() {
    const c = current();
    if (!c) return;

    $("classGradesBody").innerHTML = c.students.map(sid => {
      const s = getStudent(sid);
      if (!s) return "";

      let earned = 0;
      let possible = 0;
      let count = 0;

      c.work.filter(w => w.status !== "draft").forEach(w => {
        const score = w.grades?.[sid];

        if (score !== undefined && score !== null && score !== "") {
          const numericScore = typeof score === "object"
            ? Number(score.score ?? score.grade)
            : Number(score);

          if (Number.isFinite(numericScore)) {
            earned += numericScore;
            possible += Number(w.points) || 0;
            count++;
          }
        }
      });

      return `<tr>
        <td>${esc(s.name)}</td>
        <td>${count} graded</td>
        <td>${possible ? Math.round(earned / possible * 100) + "%" : "Not graded"}</td>
      </tr>`;
    }).join("") || '<tr><td colspan="3">No students enrolled.</td></tr>';
  }

  function gradeAssignment(workId) {
    const c = current();
    const work = c?.work.find(w => w.id === workId);
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

      if (!Number.isFinite(score) || score < 0 || score > Number(work.points)) {
        alert("Invalid score.");
        continue;
      }

      work.grades[sid] = score;
    }

    save();
    renderGrades();
  }

  // CALENDAR
  function renderCalendar() {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();

    $("calendarMonth").textContent = calendarDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    let html = [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ].map(day => `<div class="calendar-day"><strong>${day}</strong></div>`).join("");

    html += '<div class="calendar-day"></div>'.repeat(new Date(y, m, 1).getDay());

    const daysInMonth = new Date(y, m + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const events = data.classes.flatMap(c =>
        c.work.filter(w => w.status !== "draft" && w.dueDate === iso)
          .map(w => `${c.section}: ${w.title}`)
      );

      const today = new Date();
      const isToday = today.getFullYear() === y &&
        today.getMonth() === m && today.getDate() === day;

      html += `<div class="calendar-day ${isToday ? "today" : ""}">
        <strong>${day}</strong>
        ${events.map(event => `<div class="calendar-event">${esc(event)}</div>`).join("")}
      </div>`;
    }

    $("calendarGrid").innerHTML = html;
  }

  // TO REVIEW
  function renderReview() {
    const works = data.classes.flatMap(c =>
      c.work.filter(w => w.status !== "draft").map(w => ({ c, w }))
    );

    $("reviewList").innerHTML = works.map(({ c, w }) => `
      <article class="work-item">
        <h3>${esc(w.title)}</h3>
        <p>${esc(c.name)} · ${esc(c.section)}</p>
        <p class="muted">
          Open the class to enter grades.
          Student submissions are not simulated yet.
        </p>
      </article>
    `).join("") || '<div class="empty-state">Nothing to review yet.</div>';
  }

  // NAVIGATION EVENTS
  $$(".nav-item[data-view]").forEach(button => {
    button.onclick = () => view(button.dataset.view);
  });

  $$(".class-tab").forEach(button => {
    button.onclick = () => classTab(button.dataset.classTab);
  });

  $("backToClasses").onclick = () => view("classes");
  $("menuToggle").onclick = () => $("sidebar").classList.toggle("collapsed");

  // CREATE CLASS
  const openCreateClass = () => $("createClassDialog").showModal();

  $("homeCreateClass").onclick = openCreateClass;
  $("createClassButton").onclick = openCreateClass;

  $("cancelCreateClass").onclick = () => $("createClassDialog").close();

  $("createClassForm").onsubmit = event => {
    event.preventDefault();

    const c = {
      id: id(),
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
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

  // ANNOUNCEMENTS
  $("postAnnouncement").onclick = () => {
    const text = $("announcementText").value.trim();
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

  // CREATE CLASSWORK MENU
  $("openCreateWork").onclick = () => {
    const menu = $("createWorkMenu");
    menu.hidden = !menu.hidden;
    $("openCreateWork").setAttribute("aria-expanded", String(!menu.hidden));
  };

  document.addEventListener("click", event => {
    if (!event.target.closest("#openCreateWork") &&
        !event.target.closest("#createWorkMenu")) {
      $("createWorkMenu").hidden = true;
      $("openCreateWork").setAttribute("aria-expanded", "false");
    }
  });

  $$("[data-create-type]").forEach(button => {
    button.onclick = () => {
      $("createWorkMenu").hidden = true;
      $("openCreateWork").setAttribute("aria-expanded", "false");

      const type = button.dataset.createType;

      if (type === "topic") {
        $("createTopicDialog").showModal();
        return;
      }

      if (type === "reuse") {
        alert("Reuse post will be added later.");
        return;
      }

      if (type === "quiz") {
        openRiversideForms();
        return;
      }

      openEditor(null, type);
    };
  });

  // TOPICS
  $("createTopicForm").onsubmit = event => {
    event.preventDefault();

    const name = $("newTopicName").value.trim();
    const c = current();
    if (!name || !c) return;

    if (!allTopics(c).includes(name)) c.topics.push(name);

    save();
    $("createTopicForm").reset();
    $("createTopicDialog").close();
    renderClasswork();
  };

  $("cancelCreateTopic").onclick = () => $("createTopicDialog").close();
  $("classworkTopicFilter").onchange = renderClasswork;

  $("collapseTopics").onclick = () => {
    const topics = allTopics(current());
    collapsedTopics = collapsedTopics.size === topics.length
      ? new Set()
      : new Set(topics);

    renderClasswork();
    $("collapseTopics").textContent = collapsedTopics.size
      ? "Expand all"
      : "Collapse all";
  };
  // =========================================================
  // ASSIGNMENT EDITOR: SAVE, DRAFT, PUBLISH, ATTACHMENTS
  // =========================================================

  $("closeEditor").onclick = () => {
    $("assignmentEditor").classList.add("hidden");
  };

  $("cancelEditor").onclick = () => {
    $("assignmentEditor").classList.add("hidden");
  };

  $("saveDraft").onclick = () => {
    saveEditor("draft");
  };

  $("publishAssignment").onclick = () => {
    saveEditor("published");
  };

  $("moreOptions").onclick = () => {
    const options = $("moreOptionsMenu");
    if (options) {
      options.classList.toggle("hidden");
    } else {
      alert("Use the assignment editor to set points, due date, topic, and instructions.");
    }
  };

  $("assignmentType").onchange = () => {
    const type = $("assignmentType").value;
    const questions = $("questionBuilder");
    if (questions) {
      questions.classList.toggle("hidden", type !== "quiz");
    }
  };

  $("addQuestion").onclick = () => {
    const questionText = prompt("Enter the quiz question:");
    if (!questionText || !questionText.trim()) return;

    const question = {
      id: uid(),
      text: questionText.trim(),
      options: [],
      answer: ""
    };

    if (!window.classroomQuestions) {
      window.classroomQuestions = [];
    }

    window.classroomQuestions.push(question);

    const list = $("questionList");
    if (list) {
      const item = document.createElement("div");
      item.className = "question-item";
      item.textContent = question.text;
      list.appendChild(item);
    }
  };

  // =========================================================
  // ATTACHMENTS
  // =========================================================

  const pendingAttachments = [];

  if ($("addAttachment")) {
    $("addAttachment").onclick = () => {
      const picker = $("attachmentPicker");
      if (picker) picker.click();
    };
  }

  if ($("attachmentPicker")) {
    $("attachmentPicker").onchange = event => {
      const files = Array.from(event.target.files || []);

      files.forEach(file => {
        pendingAttachments.push({
          id: uid(),
          name: file.name,
          type: file.type || "file",
          size: file.size,
          note: "File selected in this session"
        });
      });

      const list = $("attachmentList");
      if (list) {
        list.innerHTML = "";

        pendingAttachments.forEach(file => {
          const item = document.createElement("div");
          item.className = "attachment-item";
          item.textContent = `${file.name} (${Math.ceil(file.size / 1024)} KB)`;
          list.appendChild(item);
        });
      }

      event.target.value = "";
    };
  }

  // =========================================================
  // ENROLL STUDENTS
  // =========================================================

  const addStudentsButton = $("addStudentsButton");
  const studentModal = $("studentModal");
  const availableStudents = $("availableStudents");
  const saveClassStudents = $("saveClassStudents");

  if (addStudentsButton) {
    addStudentsButton.onclick = () => {
      if (!currentClassId) {
        alert("Open a class first.");
        return;
      }

      buildStudentRoster();

      const c = getClass(currentClassId);
      if (!c) return;

      availableStudents.innerHTML = "";

      students.forEach(student => {
        const label = document.createElement("label");
        label.className = "student-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = student.id;
        checkbox.checked = c.students.map(String).includes(String(student.id));

        const name = document.createElement("span");
        name.textContent = `${student.name} — Grade ${student.grade}`;

        label.appendChild(checkbox);
        label.appendChild(name);
        availableStudents.appendChild(label);
      });

      studentModal.classList.remove("hidden");
    };
  }

  const closeStudentModal = $("closeStudentModal");
  if (closeStudentModal) {
    closeStudentModal.onclick = () => {
      studentModal.classList.add("hidden");
    };
  }

  if (saveClassStudents) {
    saveClassStudents.onclick = () => {
      const c = getClass(currentClassId);
      if (!c) return;

      const selected = Array.from(
        availableStudents.querySelectorAll('input[type="checkbox"]:checked')
      ).map(input => input.value);

      c.students = selected;
      saveData();

      studentModal.classList.add("hidden");
      renderClasses();
      renderStudents();
      renderGrades();
    };
  }

  // =========================================================
  // ADD 20 STUDENTS TO EACH CLASS
  // =========================================================

  function addTwentyStudentsToEachClass() {
    buildStudentRoster();

    let addedTotal = 0;
    let updatedClasses = 0;

    classes.forEach(c => {
      if (!Array.isArray(c.students)) {
        c.students = [];
      }

      // Remove duplicates while preserving the existing order.
      c.students = [...new Set(c.students.map(String))];

      const targetCount = 20;

      if (c.students.length >= targetCount) return;

      const enrolled = new Set(c.students);
      const available = students.filter(
        student => !enrolled.has(String(student.id))
      );

      const needed = targetCount - c.students.length;
      const additions = available.slice(0, needed);

      additions.forEach(student => {
        c.students.push(String(student.id));
        enrolled.add(String(student.id));
      });

      addedTotal += additions.length;

      if (additions.length > 0) {
        updatedClasses++;
      }
    });

    saveData();
    renderClasses();

    if (currentClassId) {
      renderStudents();
      renderGrades();
    }

    alert(
      `Student roster updated!\n\n` +
      `${updatedClasses} classes updated.\n` +
      `${addedTotal} student enrollments added.\n\n` +
      `Each class now has up to 20 students.`
    );
  }

  // Add the button beside the existing Create Class button.
  const createClassButton = $("homeCreateClass");

  if (createClassButton && ! $("addTwentyStudentsButton")) {
    const button = document.createElement("button");
    button.id = "addTwentyStudentsButton";
    button.type = "button";
    button.className = createClassButton.className;
    button.textContent = "Add 20 Students to Each Class";

    button.addEventListener("click", addTwentyStudentsToEachClass);

    createClassButton.insertAdjacentElement("afterend", button);
  }

  // =========================================================
  // CALENDAR NAVIGATION
  // =========================================================

  if ($("calendarPrevious")) {
    $("calendarPrevious").onclick = () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      renderCalendar();
    };
  }

  if ($("calendarNext")) {
    $("calendarNext").onclick = () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      renderCalendar();
    };
  }

  // =========================================================
  // INITIALIZE THE ROSTER AND DASHBOARD
  // =========================================================

  buildStudentRoster();
  renderClasses();
  view("home");

});
