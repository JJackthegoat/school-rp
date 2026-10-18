
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const STUDENT_KEY = "riverside_ai_students_v1";
  const CLASSROOM_KEY = "schoolRP_classroom_v1";
  const FORMS_KEY = "riverside_forms_v1";
  const ACTIVITY_KEY = "riverside_student_activity_v1";

  const $ = id => document.getElementById(id);

  const makeId = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString(36) +
        Math.random().toString(36).slice(2);

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      alert("Unable to save data in this browser.");
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

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function chance(probability) {
    return Math.random() < probability;
  }

  function timestamp() {
    return new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  const DEFAULT_STUDENTS = [
    ["10001", "Alex Morgan", "Friendly", "On Track"],
    ["10002", "Jordan Lee", "Quiet", "Advanced"],
    ["10003", "Taylor Brooks", "Curious", "On Track"],
    ["10004", "Casey Rivera", "Energetic", "Developing"],
    ["10005", "Morgan Davis", "Independent", "Advanced"],
    ["10006", "Avery Wilson", "Friendly", "On Track"],
    ["10007", "Riley Parker", "Talkative", "Developing"],
    ["10008", "Cameron Smith", "Curious", "Advanced"],
    ["10009", "Jamie Thompson", "Quiet", "On Track"],
    ["10010", "Quinn Johnson", "Independent", "On Track"],
    ["10011", "Dakota Brown", "Energetic", "Developing"],
    ["10012", "Reese Taylor", "Friendly", "Advanced"]
  ];

  let students = readJSON(STUDENT_KEY, null);

  if (!Array.isArray(students)) {
    students = DEFAULT_STUDENTS.map(
      ([id, name, personality, academic]) => ({
        id,
        name,
        grade: 7,
        personality,
        academic,
        status: "Active",
        completed: 0,
        messages: [],
        attendance: [],
        createdAt: new Date().toISOString()
      })
    );

    saveJSON(STUDENT_KEY, students);
  }

  let activity = readJSON(ACTIVITY_KEY, []);

  if (!Array.isArray(activity)) {
    activity = [];
  }

  function saveStudents() {
    saveJSON(STUDENT_KEY, students);
  }

  function saveActivity() {
    saveJSON(ACTIVITY_KEY, activity);
  }

  function addActivity(student, message, icon = "●") {
    activity.unshift({
      id: makeId(),
      studentId: student?.id || null,
      name: student?.name || "School System",
      message,
      icon,
      time: timestamp()
    });

    activity = activity.slice(0, 150);
    saveActivity();
  }

  function getClassroom() {
    const data = readJSON(CLASSROOM_KEY, {
      classes: []
    });

    if (!Array.isArray(data.classes)) {
      data.classes = [];
    }

    return data;
  }

  function getForms() {
    const forms = readJSON(FORMS_KEY, {});

    return forms && typeof forms === "object"
      ? forms
      : {};
  }

  function enrolledClasses(studentId) {
    const classroom = getClassroom();

    return classroom.classes.filter(c =>
      Array.isArray(c.students) &&
      c.students.includes(studentId)
    );
  }

  function studentById(id) {
    return students.find(student => student.id === id);
  }

  function setStatus(message) {
    $("simulationStatus").textContent = message;
  }

  // ==========================================
  // TEACHER PROFILE
  // ==========================================

  const teacherProfile = readJSON("teacherProfile", {});

  const teacherName =
    teacherProfile.name ||
    teacherProfile.teacherName ||
    "Teacher";

  $("teacherName").textContent = teacherName;
  $("teacherAvatar").textContent =
    teacherName.charAt(0).toUpperCase();

  // ==========================================
  // STUDENT STATISTICS
  // ==========================================

  function renderStats() {
    $("totalStudents").textContent = students.length;

    $("activeStudents").textContent =
      students.filter(s => s.status === "Active").length;

    $("completedAssignments").textContent =
      students.reduce(
        (total, student) =>
          total + (Number(student.completed) || 0),
        0
      );

    $("studentMessages").textContent =
      students.reduce(
        (total, student) =>
          total + (student.messages?.length || 0),
        0
      );
  }

  // ==========================================
  // CLASS FILTER
  // ==========================================

  function renderClassFilter() {
    const filter = $("classFilter");
    const previous = filter.value;

    const classroom = getClassroom();

    filter.innerHTML =
      '<option value="all">All Classes</option>' +
      classroom.classes.map(c => `
        <option value="${escapeHTML(c.id)}">
          ${escapeHTML(c.name)} —
          ${escapeHTML(c.section)}
        </option>
      `).join("");

    filter.value = classroom.classes.some(
      c => c.id === previous
    ) ? previous : "all";
  }

  // ==========================================
  // STUDENT ROSTER
  // ==========================================

  function renderRoster() {
    const search =
      $("studentSearch").value.trim().toLowerCase();

    const grade = $("gradeFilter").value;
    const classId = $("classFilter").value;

    const classroom = getClassroom();

    const selectedClass = classroom.classes.find(
      c => c.id === classId
    );

    const filtered = students.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(search) ||
        student.id.includes(search);

      const matchesGrade =
        grade === "all" ||
        String(student.grade) === grade;

      const matchesClass =
        classId === "all" ||
        selectedClass?.students?.includes(student.id);

      return matchesSearch &&
        matchesGrade &&
        matchesClass;
    });

    $("studentTableBody").innerHTML =
      filtered.map(student => {
        const initials = student.name
          .split(" ")
          .map(part => part.charAt(0))
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return `
          <tr>

            <td>
              <div class="student-name-cell">

                <div class="student-avatar">
                  ${escapeHTML(initials)}
                </div>

                <div>
                  <span class="student-name">
                    ${escapeHTML(student.name)}
                  </span>

                  <span class="student-id">
                    ID: ${escapeHTML(student.id)}
                  </span>
                </div>

              </div>
            </td>

            <td>Grade ${escapeHTML(student.grade)}</td>

            <td>${escapeHTML(student.personality)}</td>

            <td>
              <span class="level-badge">
                ${escapeHTML(student.academic)}
              </span>
            </td>

            <td>
              <span class="status-badge ${
                student.status !== "Active"
                  ? "inactive"
                  : ""
              }">
                ${escapeHTML(student.status)}
              </span>
            </td>

            <td>
              <button
                class="table-action"
                data-profile="${escapeHTML(student.id)}"
              >
                View Profile
              </button>
            </td>

          </tr>
        `;
      }).join("") ||
      `
        <tr>
          <td colspan="6" class="empty-state">
            No students match your filters.
          </td>
        </tr>
      `;

    document.querySelectorAll("[data-profile]")
      .forEach(button => {
        button.onclick = () =>
          openStudentProfile(button.dataset.profile);
      });
  }

  // ==========================================
  // STUDENT PROFILE
  // ==========================================

  function openStudentProfile(studentId) {
    const student = studentById(studentId);
    if (!student) return;

    const classes = enrolledClasses(student.id);

    $("profileStudentName").textContent =
      student.name;

    const details = [
      ["Student ID", student.id],
      ["Grade", `Grade ${student.grade}`],
      ["Personality", student.personality],
      ["Academic Level", student.academic],
      ["Status", student.status],
      ["Completed Assignments", student.completed || 0],
      [
        "Enrolled Classes",
        classes.length
          ? classes.map(c =>
              `${c.name} (${c.section})`
            ).join(", ")
          : "Not enrolled"
      ],
      [
        "Messages Generated",
        student.messages?.length || 0
      ]
    ];

    $("studentProfileContent").innerHTML =
      details.map(([label, value]) => `
        <div class="profile-detail">
          <span>${escapeHTML(label)}</span>
          <strong>${escapeHTML(value)}</strong>
        </div>
      `).join("");

    $("studentProfileDialog").showModal();
  }

  // ==========================================
  // ACTIVITY FEED
  // ==========================================

  function renderActivity() {
    $("activityFeed").innerHTML =
      activity.length
        ? activity.slice(0, 30).map(item => `
          <div class="activity-item">

            <div class="activity-icon">
              ${escapeHTML(item.icon)}
            </div>

            <div class="activity-details">
              <strong>${escapeHTML(item.name)}</strong>

              <p>${escapeHTML(item.message)}</p>

              <span class="activity-time">
                ${escapeHTML(item.time)}
              </span>
            </div>

          </div>
        `).join("")
        : `
          <div class="empty-state">
            No student activity yet.
          </div>
        `;
  }

  // ==========================================
  // STUDENT MESSAGES
  // ==========================================

  const MESSAGE_TEMPLATES = {
    Friendly: [
      "Good morning! I'm ready for class.",
      "I enjoyed today's lesson!",
      "Thank you for explaining the assignment."
    ],

    Quiet: [
      "Could you explain question 3?",
      "I finished my work.",
      "May I ask something about the lesson?"
    ],

    Curious: [
      "Why does that happen?",
      "Can we learn more about this topic?",
      "Is there another way to solve this?"
    ],

    Energetic: [
      "Are we doing an activity today?",
      "I finished early! What's next?",
      "Can we work in groups?"
    ],

    Independent: [
      "I've completed the assignment.",
      "I checked my answers.",
      "Can I work ahead?"
    ],

    Talkative: [
      "Can I share my answer with the class?",
      "I have a question about the homework.",
      "Are we reviewing this tomorrow?"
    ]
  };

  function generateStudentMessages() {
    const active = students.filter(
      student => student.status === "Active"
    );

    if (!active.length) {
      setStatus("No active students available.");
      return 0;
    }

    const selected = [...active]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(4, active.length));

    let count = 0;

    selected.forEach(student => {
      const templates =
        MESSAGE_TEMPLATES[student.personality] ||
        MESSAGE_TEMPLATES.Friendly;

      const message = randomItem(templates);

      student.messages ||= [];

      student.messages.push({
        id: makeId(),
        text: message,
        time: new Date().toISOString(),
        read: false
      });

      addActivity(student, `Sent a message: "${message}"`, "✉");
      count++;
    });

    saveStudents();
    renderAll();

    setStatus(
      `${count} fictional student messages generated.`
    );

    return count;
  }

  // ==========================================
  // QUIZ SCORING
  // ==========================================

  function academicAccuracy(student) {
    const rates = {
      Developing: 0.58,
      "On Track": 0.78,
      Advanced: 0.92
    };

    return rates[student.academic] || 0.75;
  }

  function simulateQuiz(student, assignment, form) {
    const answers = {};
    let earned = 0;

    form.questions.forEach(question => {
      const options = question.options || [];
      const correct = question.answer || [];
      const points = Math.max(
        0,
        Number(question.points) || 0
      );

      const objective =
        ["multiple", "checkbox", "dropdown"]
          .includes(question.type);

      if (!objective || !options.length) {
        answers[question.id] = {
          answer: "",
          correct: false,
          points: 0,
          needsReview: true
        };
        return;
      }

      const hasKey =
        correct.length > 0 &&
        correct.every(index =>
          Number.isInteger(index) &&
          index >= 0 &&
          index < options.length
        );

      if (!hasKey) {
        answers[question.id] = {
          answer: [],
          correct: false,
          points: 0,
          needsReview: true
        };
        return;
      }

      const knowsAnswer =
        chance(academicAccuracy(student));

      let selected;

      if (knowsAnswer) {
        selected = [...correct];
      } else {
        const incorrect = options
          .map((_, index) => index)
          .filter(index => !correct.includes(index));

        selected = incorrect.length
          ? [randomItem(incorrect)]
          : [];
      }

      const correctAnswer =
        selected.length === correct.length &&
        selected.every(index => correct.includes(index));

      const awarded = correctAnswer ? points : 0;

      earned += awarded;

      answers[question.id] = {
        answer: selected,
        correct: correctAnswer,
        points: awarded,
        needsReview: false
      };
    });

    return {
      answers,
      score: earned
    };
  }

  // ==========================================
  // SIMULATE ASSIGNMENTS
  // ==========================================

  function simulateAssignments() {
    const classroom = getClassroom();
    const forms = getForms();

    let completed = 0;
    let skipped = 0;

    classroom.classes.forEach(c => {
      if (!Array.isArray(c.students)) return;
      if (!Array.isArray(c.work)) return;

      c.work.forEach(work => {
        if (work.status === "draft") return;

        work.grades ||= {};
        work.simulatedSubmissions ||= {};

        c.students.forEach(studentId => {
          const student = studentById(studentId);

          if (!student || student.status !== "Active") {
            return;
          }

          // Do not overwrite existing work.
          if (
            work.simulatedSubmissions[studentId] ||
            work.grades[studentId] !== undefined
          ) {
            skipped++;
            return;
          }

          const completionRate = {
            Developing: 0.72,
            "On Track": 0.87,
            Advanced: 0.96
          }[student.academic] || 0.85;

          if (!chance(completionRate)) {
            skipped++;
            return;
          }

          let score = 0;
          let answers = {};

          if (
            work.type === "quiz" &&
            work.formId &&
            forms[work.formId]
          ) {
            const result = simulateQuiz(
              student,
              work,
              forms[work.formId]
            );

            score = result.score;
            answers = result.answers;

            forms[work.formId].responses ||= [];

            const alreadyResponded =
              forms[work.formId].responses.some(
                response =>
                  response.studentId === studentId
              );

            if (!alreadyResponded) {
              forms[work.formId].responses.push({
                id: makeId(),
                studentId,
                name: student.name,
                date: new Date().toISOString(),
                answers,
                score,
                classId: c.id
              });
            }
          } else {
            const maxPoints =
              Math.max(0, Number(work.points) || 0);

            const base =
              academicAccuracy(student);

            const variation =
              (Math.random() - 0.5) * 0.25;

            score = Math.round(
              maxPoints *
              Math.max(
                0.3,
                Math.min(1, base + variation)
              )
            );
          }

          work.grades[studentId] = score;

          work.simulatedSubmissions[studentId] = {
            id: makeId(),
            submittedAt: new Date().toISOString(),
            score,
            answers,
            simulated: true
          };

          student.completed =
            (Number(student.completed) || 0) + 1;

          addActivity(
            student,
            `Completed "${work.title}" in ${c.section}.`,
            "✓"
          );

          completed++;
        });
      });
    });

    saveJSON(CLASSROOM_KEY, classroom);
    saveJSON(FORMS_KEY, forms);
    saveStudents();

    renderAll();

    setStatus(
      `${completed} simulated submissions created. ` +
      `${skipped} existing or incomplete submissions skipped.`
    );

    return completed;
  }

  // ==========================================
  // RUN SCHOOL DAY
  // ==========================================

  function runSchoolDay() {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    let present = 0;
    let absent = 0;

    students.forEach(student => {
      if (student.status !== "Active") return;

      student.attendance ||= [];

      const existing = student.attendance.find(
        record => record.date === today
      );

      if (existing) {
        if (existing.status === "Present") present++;
        else absent++;
        return;
      }

      const status =
        chance(0.94) ? "Present" : "Absent";

      student.attendance.push({
        date: today,
        status
      });

      if (status === "Present") present++;
      else absent++;
    });

    saveStudents();

    const completed = simulateAssignments();
    const messages = generateStudentMessages();

    addActivity(
      null,
      `School day simulated: ${present} present, ` +
      `${absent} absent, ${completed} submissions, ` +
      `${messages} messages.`,
      "▣"
    );

    renderAll();

    setStatus(
      `School day complete! ${present} present, ` +
      `${absent} absent, ${completed} assignments ` +
      `completed, and ${messages} messages generated.`
    );
  }

  // ==========================================
  // ADD STUDENT
  // ==========================================

  $("addStudentButton").onclick = () =>
    $("addStudentDialog").showModal();

  $("closeAddStudent").onclick = () =>
    $("addStudentDialog").close();

  $("cancelAddStudent").onclick = () =>
    $("addStudentDialog").close();

  $("addStudentForm").onsubmit = event => {
    event.preventDefault();

    const name = $("newStudentName").value.trim();

    if (!name) return;

    const usedIds = new Set(
      students.map(student => Number(student.id))
    );

    let number = 10001;

    while (usedIds.has(number)) {
      number++;
    }

    const student = {
      id: String(number),
      name,
      grade: Number($("newStudentGrade").value),
      personality: $("newStudentPersonality").value,
      academic: $("newStudentAcademic").value,
      status: "Active",
      completed: 0,
      messages: [],
      attendance: [],
      createdAt: new Date().toISOString()
    };

    students.push(student);

    saveStudents();

    addActivity(
      student,
      "Added to the fictional student roster.",
      "+"
    );

    $("addStudentForm").reset();
    $("addStudentDialog").close();

    renderAll();
  };

  $("closeStudentProfile").onclick = () =>
    $("studentProfileDialog").close();

  // ==========================================
  // BUTTON EVENTS
  // ==========================================

  $("runSimulation").onclick = runSchoolDay;

  $("simulateAssignments").onclick =
    simulateAssignments;

  $("simulateMessages").onclick =
    generateStudentMessages;

  $("clearActivity").onclick = () => {
    if (!confirm("Clear all simulated activity?")) {
      return;
    }

    activity = [];
    saveActivity();
    renderActivity();
  };

  $("studentSearch").oninput = renderRoster;
  $("gradeFilter").onchange = renderRoster;
  $("classFilter").onchange = renderRoster;

  // ==========================================
  // REFRESH
  // ==========================================

  function renderAll() {
    renderStats();
    renderClassFilter();
    renderRoster();
    renderActivity();
  }

  renderAll();

  setStatus(
    "Simulation ready. Enroll students in Riverside " +
    "Classroom to begin generating classwork."
  );
});
