
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ==========================================
  // RIVERSIDE GENESIS SIS
  // Student Records, Attendance, and Gradebook
  // ==========================================

  const $ = id => document.getElementById(id);

  const CLASSROOM_KEY = "schoolRP_classroom_v1";
  const STUDENTS_KEY = "riverside_ai_students_v1";
  const SIMULATION_KEY = "riverside_simulation_v2";

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      alert("Unable to save. Check browser storage.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  // ==========================================
  // TEACHER PROFILE
  // ==========================================

  const profile = read("teacherProfile", {});

  const teacherName =
    profile.name ||
    profile.teacherName ||
    "Teacher";

  const teacherSubject =
    profile.subject ||
    profile.teacherSubject ||
    "Mathematics";

  const teacherGrade =
    profile.grade ||
    profile.teacherGrade ||
    "7";

  $("genesisTeacher").textContent = teacherName;
  $("genesisSubject").textContent = teacherSubject;
  $("genesisGrade").textContent = teacherGrade;

  // ==========================================
  // NAVIGATION
  // ==========================================

  const mainTabs = document.querySelectorAll(".main-tab");
  const pages = document.querySelectorAll(".genesis-page");
  const subTabs = document.querySelectorAll(".sub-tab");

  const pageMap = {
    studentData: "studentDataPage",
    registration: "registrationPage",
    scheduling: "schedulingPage",
    grading: "gradingPage",
    attendance: "attendancePage",
    calendar: "calendarPage",
    setup: "setupPage"
  };

  function openPage(name) {
    mainTabs.forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.tab === name
      );
    });

    pages.forEach(page => {
      page.classList.toggle(
        "active",
        page.id === pageMap[name]
      );
    });

    const subNav = document.querySelector(".sub-nav");

    if (subNav) {
      subNav.style.display =
        name === "attendance" ? "flex" : "none";
    }

    if (name === "grading") renderGradebook();
    if (name === "studentData") renderStudents();
    if (name === "attendance") renderAttendance();
  }

  mainTabs.forEach(tab => {
    tab.onclick = () => openPage(tab.dataset.tab);
  });

  subTabs.forEach(tab => {
    tab.onclick = () => {
      subTabs.forEach(item =>
        item.classList.remove("active")
      );

      tab.classList.add("active");
    };
  });

  // ==========================================
  // STUDENT DATA
  // ==========================================

  const DEFAULT_STUDENTS = [
    { id: "10001", name: "Alex Morgan", grade: 7 },
    { id: "10002", name: "Jordan Lee", grade: 7 },
    { id: "10003", name: "Taylor Brooks", grade: 7 },
    { id: "10004", name: "Casey Rivera", grade: 7 },
    { id: "10005", name: "Morgan Davis", grade: 7 },
    { id: "10006", name: "Avery Wilson", grade: 7 },
    { id: "10007", name: "Riley Parker", grade: 7 },
    { id: "10008", name: "Cameron Smith", grade: 7 },
    { id: "10009", name: "Jamie Thompson", grade: 7 },
    { id: "10010", name: "Quinn Johnson", grade: 7 },
    { id: "10011", name: "Dakota Brown", grade: 7 },
    { id: "10012", name: "Reese Taylor", grade: 7 }
  ];

  function getClassroom() {
    const data = read(CLASSROOM_KEY, { classes: [] });

    if (!Array.isArray(data.classes)) {
      data.classes = [];
    }

    return data;
  }

  function getStudents() {
    const saved = read(STUDENTS_KEY, []);

    const map = new Map();

    DEFAULT_STUDENTS.forEach(student => {
      map.set(student.id, student);
    });

    if (Array.isArray(saved)) {
      saved.forEach(student => {
        if (!student?.id) return;

        map.set(String(student.id), {
          ...student,
          id: String(student.id)
        });
      });
    }

    return map;
  }

  function getStudent(id) {
    return getStudents().get(String(id)) || {
      id: String(id),
      name: `Student ${id}`,
      grade: 7
    };
  }

  function allStudents() {
    const map = getStudents();

    getClassroom().classes.forEach(c => {
      (c.students || []).forEach(id => {
        if (!map.has(String(id))) {
          map.set(String(id), getStudent(id));
        }
      });
    });

    return [...map.values()];
  }

  function nameParts(student) {
    const parts = student.name.trim().split(/\s+/);

    return {
      first: parts[0] || "",
      last: parts.slice(1).join(" ")
    };
  }

  function renderStudents() {
    const body = $("studentTableBody");
    if (!body) return;

    const search =
      ($("studentSearch")?.value || "")
        .trim()
        .toLowerCase();

    const filtered = allStudents().filter(s => {
      return (
        s.name.toLowerCase().includes(search) ||
        String(s.id).includes(search)
      );
    });

    body.innerHTML = filtered.map(s => {
      const parts = nameParts(s);

      return `
        <tr>
          <td>${escapeHTML(s.id)}</td>
          <td>${escapeHTML(parts.last)}</td>
          <td>${escapeHTML(parts.first)}</td>
          <td>${escapeHTML(s.grade || 7)}</td>
          <td>—</td>
        </tr>
      `;
    }).join("") || `
      <tr>
        <td colspan="5">No students found.</td>
      </tr>
    `;
  }

  if ($("studentSearch")) {
    $("studentSearch").oninput = renderStudents;
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================

  const attendanceDate = $("attendanceDate");
  const attendanceBody = $("attendanceTableBody");
  const attendanceStatus = $("attendanceStatus");
  const attendanceMessage = $("attendanceMessage");

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  if (attendanceDate) {
    attendanceDate.value = todayString;
  }

  function attendanceKey() {
    return `schoolRP_attendance_${attendanceDate.value}`;
  }

  function renderAttendance() {
    if (!attendanceBody || !attendanceDate) return;

    const saved = read(attendanceKey(), null);

    attendanceBody.innerHTML = allStudents().map(s => {
      const parts = nameParts(s);
      const record = saved?.[s.id] || {};

      return `
        <tr data-attendance-student="${escapeHTML(s.id)}">
          <td>${escapeHTML(s.id)}</td>
          <td>${escapeHTML(parts.last)}</td>
          <td>${escapeHTML(parts.first)}</td>
          <td>—</td>
          <td>
            <select class="attendance-select">
              ${[
                "Present",
                "Absent",
                "Tardy",
                "Excused"
              ].map(status => `
                <option
                  value="${status}"
                  ${
                    (record.status || "Present") === status
                      ? "selected"
                      : ""
                  }
                >
                  ${status}
                </option>
              `).join("")}
            </select>
          </td>
          <td>
            <input
              class="attendance-comment"
              placeholder="Comment"
              value="${escapeHTML(record.comment || "")}"
            >
          </td>
        </tr>
      `;
    }).join("");

    if (attendanceStatus) {
      attendanceStatus.textContent =
        saved ? "Posted" : "Not Posted";
    }

    if (attendanceMessage) {
      attendanceMessage.textContent = "";
    }
  }

  if ($("postAttendance")) {
    $("postAttendance").onclick = () => {
      if (!attendanceDate.value) {
        attendanceMessage.textContent =
          "Select an attendance date.";
        return;
      }

      const records = {};

      attendanceBody
        .querySelectorAll("[data-attendance-student]")
        .forEach(row => {
          records[row.dataset.attendanceStudent] = {
            status:
              row.querySelector(".attendance-select").value,
            comment:
              row.querySelector(".attendance-comment").value
          };
        });

      if (write(attendanceKey(), records)) {
        attendanceStatus.textContent = "Posted";

        attendanceMessage.textContent =
          "Attendance posted successfully!";
      }
    };
  }

  if ($("clearAttendance")) {
    $("clearAttendance").onclick = renderAttendance;
  }

  if (attendanceDate) {
    attendanceDate.onchange = renderAttendance;
  }

  // ==========================================
  // GENESIS GRADEBOOK
  // ==========================================

  const gradingPage = $("gradingPage");

  let selectedStudentId = null;

  if (gradingPage) {
    const style = document.createElement("style");

    style.textContent = `
      .gb-container {
        background: white;
        border: 1px solid #d5dce6;
        border-radius: 7px;
        padding: 20px;
        margin: 15px 0;
        color: #1e293b;
      }

      .gb-toolbar {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        align-items: end;
        margin: 20px 0;
      }

      .gb-toolbar label {
        display: grid;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
      }

      .gb-toolbar select {
        padding: 9px;
        min-width: 145px;
        border: 1px solid #b9c7d8;
        border-radius: 4px;
        background: white;
      }

      .gb-table-wrap {
        width: 100%;
        overflow-x: auto;
      }

      .gb-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        min-width: 550px;
      }

      .gb-table th {
        background: #4774b8;
        color: white;
        text-align: left;
        padding: 11px;
        border: 1px solid #d5dce6;
        white-space: nowrap;
      }

      .gb-table td {
        padding: 10px;
        border: 1px solid #d5dce6;
        vertical-align: middle;
      }

      .gb-table tbody tr:nth-child(even) {
        background: #f3f7fc;
      }

      .gb-table input[type="number"] {
        width: 75px;
        padding: 7px;
        border: 1px solid #a8b7c9;
        border-radius: 3px;
      }

      .gb-comment {
        width: 100%;
        min-width: 150px;
        padding: 8px;
        border: 1px solid #a8b7c9;
        border-radius: 3px;
      }

      .gb-student-link {
        border: 0;
        background: transparent;
        color: #1769aa;
        text-decoration: underline;
        cursor: pointer;
        font: inherit;
        text-align: left;
      }

      .gb-button {
        padding: 9px 14px;
        background: #4774b8;
        color: white;
        border: 1px solid #3668a9;
        border-radius: 4px;
        cursor: pointer;
      }

      .gb-button:hover {
        background: #345c96;
      }

      .gb-muted {
        color: #64748b;
        font-size: 12px;
      }

      .gb-message {
        margin: 10px 0;
        font-size: 13px;
        color: #166534;
        min-height: 18px;
      }

      .gb-answer {
        background: #f3f7fc;
        border: 1px solid #dce4ed;
        border-radius: 5px;
        padding: 12px;
        margin: 10px 0;
        white-space: pre-wrap;
      }

      .gb-submission {
        padding: 15px;
        margin-top: 15px;
        border: 1px solid #d5dce6;
        border-radius: 6px;
      }

      .gb-student-heading {
        margin: 20px 0;
      }
    `;

    document.head.appendChild(style);

    gradingPage.innerHTML = `
      <div class="gb-container">

        <h2>Genesis Assignment Gradebook</h2>

        <p class="gb-muted">
          Assignments are imported automatically from
          Riverside Classroom. All grades are entered
          by the teacher.
        </p>

        <div class="gb-toolbar">

          <label>
            Class
            <select id="gbClass"></select>
          </label>

          <label>
            Marking Period
            <select id="gbPeriod">
              <option value="all">All Periods</option>
              <option value="MP1">MP1</option>
              <option value="MP2">MP2</option>
              <option value="MP3">MP3</option>
              <option value="MP4">MP4</option>
            </select>
          </label>

          <button id="gbRefresh" class="gb-button">
            Refresh Assignments
          </button>

        </div>

        <div id="gbMessage" class="gb-message"></div>

        <div id="gbContent"></div>

      </div>
    `;
  }

  function getPeriod(work) {
    if (/^MP[1-4]$/.test(work.gradingPeriod || "")) {
      return work.gradingPeriod;
    }

    const date = new Date(
      work.dueDate ||
      work.publishedAt ||
      Date.now()
    );

    const month = date.getMonth() + 1;

    if (month >= 9 && month <= 11) return "MP1";
    if (month === 12 || month === 1) return "MP2";
    if (month >= 2 && month <= 4) return "MP3";

    return "MP4";
  }

  function getSimulation() {
    return read(SIMULATION_KEY, {
      submissions: {},
      missing: {}
    });
  }

  function getSubmission(c, work, studentId) {
    const simulation = getSimulation();

    const key =
      `${c.id}::${work.id}::${studentId}`;

    return {
      key,
      submission: simulation.submissions?.[key],
      missing: simulation.missing?.[key]
    };
  }

  function getStatus(c, work, studentId) {
    const grade = work.grades?.[studentId];

    if (
      grade !== undefined &&
      grade !== null &&
      grade !== ""
    ) {
      return "Graded";
    }

    const record = getSubmission(c, work, studentId);

    if (record.submission) {
      if (record.submission.status === "revision") {
        return "Revision Requested";
      }

      if (record.submission.status === "graded") {
        return "Graded";
      }

      return record.submission.late
        ? "Late — To Grade"
        : "Submitted — To Grade";
    }

    if (record.missing) return "Missing";

    return "Not Submitted";
  }

  function getAverage(works, studentId) {
    let earned = 0;
    let possible = 0;

    works.forEach(work => {
      const score = work.grades?.[studentId];
      const max = Number(work.points);

      if (
        score === undefined ||
        score === null ||
        score === "" ||
        !Number.isFinite(Number(score)) ||
        !Number.isFinite(max) ||
        max <= 0
      ) {
        return;
      }

      earned += Number(score);
      possible += max;
    });

    return possible
      ? `${(earned / possible * 100).toFixed(1)}%`
      : "—";
  }

  function getSelectedClass() {
    return getClassroom().classes.find(
      c => c.id === $("gbClass")?.value
    );
  }

  function getVisibleWork(c) {
    const period = $("gbPeriod")?.value || "all";

    return (c.work || []).filter(work => {
      return (
        work.status !== "draft" &&
        (
          period === "all" ||
          getPeriod(work) === period
        )
      );
    });
  }

  // ==========================================
  // SAVE TEACHER GRADE
  // ==========================================

  function saveGrade(
    classId,
    workId,
    studentId,
    rawScore,
    comment = ""
  ) {
    const classroom = getClassroom();

    const c = classroom.classes.find(
      c => c.id === classId
    );

    const work = c?.work?.find(
      work => work.id === workId
    );

    if (!work) {
      $("gbMessage").textContent =
        "Assignment not found. Refresh the page.";
      return false;
    }

    const max = Number(work.points) || 0;
    const value = String(rawScore).trim();

    if (
      value !== "" &&
      (
        !Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > max
      )
    ) {
      $("gbMessage").textContent =
        `Score must be between 0 and ${max}.`;
      return false;
    }

    work.grades ||= {};
    work.gradeComments ||= {};

    if (value === "") {
      delete work.grades[studentId];
    } else {
      work.grades[studentId] = Number(value);
    }

    work.gradeComments[studentId] = comment;

    if (!write(CLASSROOM_KEY, classroom)) {
      return false;
    }

    // Sync the teacher's grade with the simulation.
    const simulation = getSimulation();

    const key =
      `${classId}::${workId}::${studentId}`;

    if (simulation.submissions?.[key]) {
      const submission = simulation.submissions[key];

      if (value === "") {
        submission.status = "submitted";
        delete submission.grade;
        delete submission.gradedAt;
      } else {
        submission.status = "graded";
        submission.grade = Number(value);
        submission.gradedAt =
          new Date().toISOString();
      }

      write(SIMULATION_KEY, simulation);
    }

    $("gbMessage").textContent =
      "Grade saved successfully.";

    return true;
  }

  // ==========================================
  // CLASS GRADEBOOK
  // ==========================================

  function renderGradebook() {
    if (!gradingPage) return;

    const classes = getClassroom().classes;

    const selector = $("gbClass");
    const previous = selector.value;

    selector.innerHTML = classes.map(c => `
      <option value="${escapeHTML(c.id)}">
        ${escapeHTML(c.name)} —
        ${escapeHTML(c.section)}
      </option>
    `).join("");

    if (classes.some(c => c.id === previous)) {
      selector.value = previous;
    }

    const c = getSelectedClass();

    if (!c) {
      $("gbContent").innerHTML = `
        <p>
          No classes found. Create a class
          in Riverside Classroom first.
        </p>
      `;

      return;
    }

    const works = getVisibleWork(c);

    const roster = (c.students || []).map(
      id => getStudent(id)
    );

    if (
      selectedStudentId &&
      !roster.some(s => s.id === selectedStudentId)
    ) {
      selectedStudentId = null;
    }

    if (selectedStudentId) {
      renderIndividualStudent(
        c,
        works,
        getStudent(selectedStudentId)
      );

      return;
    }

    if (!roster.length) {
      $("gbContent").innerHTML = `
        <p>
          No students enrolled in this class.
          Enroll students through Classroom or
          the Riverside simulation.
        </p>
      `;

      return;
    }

    $("gbContent").innerHTML = `
      <h3>
        ${escapeHTML(c.name)} —
        ${escapeHTML(c.section)}
      </h3>

      <p class="gb-muted">
        ${roster.length} students ·
        ${works.length} assignments
      </p>

      <div class="gb-table-wrap">
        <table class="gb-table">

          <thead>
            <tr>
              <th>Student</th>

              ${works.map(work => `
                <th>
                  ${escapeHTML(work.title)}
                  <br>
                  <small>
                    /${Number(work.points) || 0}
                    · ${getPeriod(work)}
                  </small>
                </th>
              `).join("")}

              <th>Average</th>
            </tr>
          </thead>

          <tbody>

            ${roster.map(student => `
              <tr>

                <td>
                  <button
                    class="gb-student-link"
                    data-student="${escapeHTML(student.id)}"
                  >
                    ${escapeHTML(student.name)}
                  </button>

                  <br>

                  <small>${escapeHTML(student.id)}</small>
                </td>

                ${works.map(work => `
                  <td>

                    <input
                      type="number"
                      min="0"
                      max="${Number(work.points) || 0}"
                      step="0.01"
                      data-work="${escapeHTML(work.id)}"
                      data-student-score="${escapeHTML(student.id)}"
                      value="${escapeHTML(
                        work.grades?.[student.id] ?? ""
                      )}"
                      placeholder="—"
                    >

                    <br>

                    <small>
                      ${escapeHTML(
                        getStatus(c, work, student.id)
                      )}
                    </small>

                  </td>
                `).join("")}

                <td>
                  <strong>
                    ${getAverage(works, student.id)}
                  </strong>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>
      </div>

      <p class="gb-muted">
        Enter a score and leave the box to save.
        A blank score means ungraded, not zero.
        Click a student's name to see their assignments.
      </p>
    `;

    document
      .querySelectorAll("[data-student]")
      .forEach(button => {
        button.onclick = () => {
          selectedStudentId = button.dataset.student;
          renderGradebook();
        };
      });

    document
      .querySelectorAll("[data-student-score]")
      .forEach(input => {
        input.onchange = () => {
          const work = works.find(
            w => w.id === input.dataset.work
          );

          if (!work) return;

          const studentId =
            input.dataset.studentScore;

          const comment =
            work.gradeComments?.[studentId] || "";

          if (
            saveGrade(
              c.id,
              work.id,
              studentId,
              input.value,
              comment
            )
          ) {
            renderGradebook();
          }
        };
      });
  }

  // ==========================================
  // INDIVIDUAL STUDENT GRADEBOOK
  // ==========================================

  function renderIndividualStudent(c, works, student) {
    const content = $("gbContent");

    content.innerHTML = `
      <button id="gbBack" class="gb-button">
        ← Back to Class Gradebook
      </button>

      <div class="gb-student-heading">
        <h2>${escapeHTML(student.name)}</h2>

        <p>
          Student ID:
          ${escapeHTML(student.id)}
        </p>

        <p>
          ${escapeHTML(c.name)} —
          ${escapeHTML(c.section)}
        </p>

        <h3>
          Current Average:
          ${getAverage(works, student.id)}
        </h3>
      </div>

      <div class="gb-table-wrap">

        <table class="gb-table">

          <thead>
            <tr>
              <th>Assignment</th>
              <th>Marking Period</th>
              <th>Status</th>
              <th>Grade</th>
              <th>Teacher Comment</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            ${works.map(work => `
              <tr data-grade-row="${escapeHTML(work.id)}">

                <td>
                  <strong>
                    ${escapeHTML(work.title)}
                  </strong>

                  <br>

                  <small>
                    ${escapeHTML(work.instructions || "")}
                  </small>
                </td>

                <td>${getPeriod(work)}</td>

                <td>
                  ${escapeHTML(
                    getStatus(c, work, student.id)
                  )}
                </td>

                <td>
                  <input
                    class="gb-score"
                    type="number"
                    min="0"
                    max="${Number(work.points) || 0}"
                    step="0.01"
                    placeholder="—"
                    value="${escapeHTML(
                      work.grades?.[student.id] ?? ""
                    )}"
                  >

                  / ${Number(work.points) || 0}
                </td>

                <td>
                  <input
                    class="gb-comment"
                    placeholder="Optional comment"
                    value="${escapeHTML(
                      work.gradeComments?.[student.id] || ""
                    )}"
                  >
                </td>

                <td>
                  <button class="gb-button gb-save">
                    Save Grade
                  </button>
                </td>

              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>

      ${
        works.length
          ? ""
          : "<p>No assignments in this marking period.</p>"
      }

      <div id="gbStudentSubmissions"></div>
    `;

    $("gbBack").onclick = () => {
      selectedStudentId = null;
      renderGradebook();
    };

    content
      .querySelectorAll("[data-grade-row]")
      .forEach(row => {
        const work = works.find(
          w => w.id === row.dataset.gradeRow
        );

        if (!work) return;

        row.querySelector(".gb-save").onclick = () => {
          const score =
            row.querySelector(".gb-score").value;

          const comment =
            row.querySelector(".gb-comment").value;

          if (
            saveGrade(
              c.id,
              work.id,
              student.id,
              score,
              comment
            )
          ) {
            renderGradebook();
          }
        };
      });

    renderStudentSubmissions(c, works, student);
  }

  // ==========================================
  // VIEW STUDENT SUBMISSIONS
  // ==========================================

  function renderStudentSubmissions(c, works, student) {
    const container = $("gbStudentSubmissions");

    if (!container) return;

    const submissions = works.map(work => {
      const record = getSubmission(
        c,
        work,
        student.id
      );

      return {
        work,
        submission: record.submission
      };
    }).filter(item => item.submission);

    if (!submissions.length) {
      container.innerHTML = `
        <div class="gb-container">
          <h3>Student Submissions</h3>

          <p class="gb-muted">
            This student has not submitted any
            simulated work yet.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="gb-container">

        <h3>Student Submissions</h3>

        ${submissions.map(({ work, submission }) => `
          <div class="gb-submission">

            <h4>${escapeHTML(work.title)}</h4>

            <p class="gb-muted">
              Status:
              ${escapeHTML(submission.status)}

              ${submission.late ? " · Late" : ""}
            </p>

            ${
              Array.isArray(submission.answers) &&
              submission.answers.length
                ? submission.answers.map(answer => `
                  <div class="gb-answer">

                    <strong>
                      ${escapeHTML(
                        answer.question || "Question"
                      )}
                    </strong>

                    <p>
                      ${escapeHTML(
                        answer.answer || "No response"
                      )}
                    </p>

                  </div>
                `).join("")
                : `
                  <p class="gb-muted">
                    No written answers available.
                  </p>
                `
            }

          </div>
        `).join("")}

      </div>
    `;
  }

  // ==========================================
  // GRADEBOOK CONTROLS
  // ==========================================

  if (gradingPage) {
    $("gbClass").onchange = () => {
      selectedStudentId = null;
      renderGradebook();
    };

    $("gbPeriod").onchange = () => {
      renderGradebook();
    };

    $("gbRefresh").onclick = () => {
      $("gbMessage").textContent =
        "Classroom data refreshed.";

      renderGradebook();
    };
  }

  // ==========================================
  // UPDATE WHEN OTHER TABS CHANGE STORAGE
  // ==========================================

  window.addEventListener("storage", event => {
    if (
      [
        CLASSROOM_KEY,
        STUDENTS_KEY,
        SIMULATION_KEY
      ].includes(event.key)
    ) {
      renderStudents();
      renderAttendance();
      renderGradebook();
    }
  });

  // ==========================================
  // START GENESIS
  // ==========================================

  renderStudents();
  renderAttendance();
  renderGradebook();

  openPage("attendance");
});
