
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const STORAGE_KEY = "schoolRP_classroom_v1";
    const TEACHING_PERIODS = [1, 2, 3, 4, 6, 7];

    const sampleStudents = [
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

    const $ = id => document.getElementById(id);
    const $$ = selector => [...document.querySelectorAll(selector)];

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function makeId() {
        return window.crypto?.randomUUID?.() ||
            Date.now().toString(36) +
            Math.random().toString(36).slice(2);
    }

    function readTeacherProfile() {
        try {
            return JSON.parse(
                localStorage.getItem("teacherProfile") || "{}"
            ) || {};
        } catch {
            return {};
        }
    }

    function loadData() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );

            if (saved && Array.isArray(saved.classes)) {
                return saved;
            }
        } catch (error) {
            console.warn("Unable to load Classroom data.", error);
        }

        return { classes: [] };
    }

    let data = loadData();
    let currentClassId = null;
    let calendarDate = new Date();
    let editingQuizId = null;

    function saveData() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );
        } catch {
            alert("Unable to save Classroom data.");
        }
    }

    function getClass() {
        return data.classes.find(
            item => item.id === currentClassId
        );
    }

    function getStudent(id) {
        return sampleStudents.find(
            student => student.id === id
        );
    }

    function formatDate(date) {
        if (!date) return "No due date";

        const [year, month, day] =
            date.split("-").map(Number);

        return new Date(
            year, month - 1, day
        ).toLocaleDateString();
    }

    function loadTeacher() {
        const profile = readTeacherProfile();

        const name =
            profile.name ||
            profile.teacherName ||
            "Teacher";

        const subject =
            profile.subject ||
            profile.teacherSubject ||
            "Not Set";

        const grade =
            profile.grade ||
            profile.teacherGrade ||
            "Not Set";

        $("teacherDisplay").textContent = name;
        $("welcomeMessage").textContent =
            `Welcome, ${name}`;

        $("settingsTeacherName").textContent = name;
        $("settingsTeacherSubject").textContent = subject;
        $("settingsTeacherGrade").textContent = grade;

        document.querySelector(".teacher-avatar")
            .textContent = name.charAt(0).toUpperCase();
    }

    // =====================================
    // AUTOMATIC TEACHING SCHEDULE
    // =====================================

    function setupTeachingSchedule() {
        const profile = readTeacherProfile();

        const subject =
            profile.subject ||
            profile.teacherSubject ||
            "General Studies";

        const grade =
            profile.grade ||
            profile.teacherGrade ||
            "7";

        let changed = false;

        TEACHING_PERIODS.forEach(period => {
            const section = `Period ${period}`;

            // Match an existing class for this period,
            // regardless of its subject or class name.
            const exists = data.classes.some(c =>
                String(c.section || "")
                    .trim()
                    .toLowerCase() === section.toLowerCase()
            );

            if (exists) return;

            data.classes.push({
                id: makeId(),
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
                automatic: true
            });

            changed = true;
        });

        if (changed) saveData();
    }

    // =====================================
    // NAVIGATION
    // =====================================

    function showView(name) {
        $$(".view").forEach(view => {
            view.classList.toggle(
                "active",
                view.id === `${name}View`
            );
        });

        $$(".nav-item").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.view === name
            );
        });

        const titles = {
            home: "Classroom Home",
            classes: "My Classes",
            classDetail: "Classroom",
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

    function showClassTab(tab) {
        $$(".class-tab").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.classTab === tab
            );
        });

        $$(".class-panel").forEach(panel => {
            panel.classList.toggle(
                "active",
                panel.id === `${tab}Panel`
            );
        });

        if (tab === "stream") renderStream();
        if (tab === "classwork") renderClasswork();
        if (tab === "people") renderStudents();
        if (tab === "grades") renderGrades();
    }

    // =====================================
    // CLASS CARDS
    // =====================================

    function renderClasses() {
        const classes = [...data.classes].sort((a, b) => {
            const getPeriod = c => {
                const match = String(c.section || "")
                    .match(/Period\s+(\d+)/i);

                return match ? Number(match[1]) : 99;
            };

            return getPeriod(a) - getPeriod(b);
        });

        const html = classes.length
            ? classes.map(c => `
                <article class="class-card"
                         data-class-id="${escapeHTML(c.id)}"
                         role="button"
                         tabindex="0">

                    <div class="class-card-header">
                        <h3>${escapeHTML(c.name)}</h3>
                        <p>${escapeHTML(c.section)}</p>
                    </div>

                    <div class="class-card-body">
                        <p>${escapeHTML(c.subject)}</p>

                        <p class="muted">
                            Room ${escapeHTML(c.room || "Not Set")}
                            · ${c.students.length} students
                        </p>
                    </div>

                    <div class="class-card-footer">
                        Open Class →
                    </div>
                </article>
            `).join("")
            : `<div class="empty-state">
                   <h3>No classes yet</h3>
               </div>`;

        $("homeClassGrid").innerHTML = html;
        $("classGrid").innerHTML = html;

        $("sidebarClassList").innerHTML = classes.map(c => `
            <button class="sidebar-class"
                    data-class-id="${escapeHTML(c.id)}">
                ${escapeHTML(c.name)}
                — ${escapeHTML(c.section)}
            </button>
        `).join("");

        $$("[data-class-id]").forEach(element => {
            const open = () =>
                openClass(element.dataset.classId);

            element.addEventListener("click", open);

            element.addEventListener("keydown", event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    open();
                }
            });
        });
    }

    function openClass(id) {
        currentClassId = id;

        const c = getClass();
        if (!c) return;

        $("classTitle").textContent = c.name;

        $("classSubtitle").textContent =
            `${c.section} · Room ${c.room || "Not Set"}`;

        $("classCodeDisplay").textContent =
            `Class Code: ${c.code}`;

        showView("classDetail");
        showClassTab("stream");
        renderClass();
    }

    function renderClass() {
        renderStream();
        renderClasswork();
        renderStudents();
        renderGrades();
    }

    // =====================================
    // ANNOUNCEMENTS / STREAM
    // =====================================

    function renderStream() {
        const c = getClass();
        if (!c) return;

        const posts = c.announcements || [];

        $("streamPosts").innerHTML = posts.length
            ? [...posts].reverse().map(post => `
                <article class="stream-post">
                    <h3>Teacher Announcement</h3>
                    <small>${escapeHTML(post.date)}</small>

                    <p style="white-space:pre-wrap">
                        ${escapeHTML(post.text)}
                    </p>
                </article>
            `).join("")
            : `<div class="empty-state">
                   <p>No announcements yet.</p>
               </div>`;

        const upcoming = c.work
            .filter(work => work.dueDate)
            .sort((a, b) =>
                a.dueDate.localeCompare(b.dueDate)
            )
            .slice(0, 5);

        $("upcomingWork").innerHTML = upcoming.length
            ? upcoming.map(work => `
                <p>
                    <strong>${escapeHTML(work.title)}</strong>
                    <br>
                    <small>
                        Due ${escapeHTML(formatDate(work.dueDate))}
                    </small>
                </p>
            `).join("")
            : `<p class="muted">No upcoming work.</p>`;
    }

    $("postAnnouncement").addEventListener("click", () => {
        const c = getClass();
        const message =
            $("announcementText").value.trim();

        if (!c || !message) return;

        c.announcements.push({
            id: makeId(),
            text: message,
            date: new Date().toLocaleString()
        });

        saveData();

        $("announcementText").value = "";
        renderStream();
    });

    // =====================================
    // CLASSWORK
    // =====================================

    function renderClasswork() {
        const c = getClass();
        if (!c) return;

        $("classworkList").innerHTML = c.work.length
            ? [...c.work].reverse().map(work => `
                <article class="work-item">

                    <div class="work-topic">
                        ${escapeHTML(work.topic || "General")}
                    </div>

                    <h3>${escapeHTML(work.title)}</h3>

                    <p>
                        ${escapeHTML(work.type.toUpperCase())}
                        · ${Number(work.points) || 0} points
                        · ${escapeHTML(formatDate(work.dueDate))}
                    </p>

                    <p style="white-space:pre-wrap">
                        ${escapeHTML(work.instructions)}
                    </p>

                    ${work.questions?.length
                        ? `<p>${work.questions.length}
                             quiz questions</p>`
                        : ""}

                    <button class="text-btn"
                            data-grade-work="${escapeHTML(work.id)}">
                        Enter Grades →
                    </button>

                    ${work.type === "quiz"
                        ? `<button class="text-btn"
                                   data-edit-quiz="${escapeHTML(work.id)}">
                               Edit Quiz
                           </button>`
                        : ""}
                </article>
            `).join("")
            : `<div class="empty-state">
                   <h3>No assignments yet</h3>
                   <p>
                       Create an assignment, quiz,
                       or question.
                   </p>
               </div>`;

        $$("[data-grade-work]").forEach(button => {
            button.addEventListener("click", () => {
                gradeAssignment(
                    button.dataset.gradeWork
                );
            });
        });

        $$("[data-edit-quiz]").forEach(button => {
            button.addEventListener("click", () => {
                const work = c.work.find(
                    item => item.id === button.dataset.editQuiz
                );

                if (work) openQuizBuilder(work);
            });
        });
    }

    $("openCreateWork").addEventListener("click", () => {
        $("createWorkDialog").showModal();
    });

    $("cancelCreateWork").addEventListener("click", () => {
        $("createWorkDialog").close();
    });

    $("createWorkForm").addEventListener("submit", event => {
        event.preventDefault();

        const c = getClass();
        if (!c) return;

        const type = $("workType").value;
        const title = $("workTitle").value.trim();

        if (!title) return;

        const work = {
            id: makeId(),
            type,
            title,
            instructions:
                $("workInstructions").value.trim(),
            points: Math.max(
                0,
                Number($("workPoints").value) || 0
            ),
            dueDate: $("workDueDate").value,
            topic: $("workTopic").value.trim(),
            grades: {},
            questions: []
        };

        c.work.push(work);
        saveData();

        $("createWorkForm").reset();
        $("createWorkDialog").close();

        renderClass();

        if (type === "quiz") {
            openQuizBuilder(work);
        }
    });

    // =====================================
    // QUIZ BUILDER
    // =====================================

    function openQuizBuilder(work) {
        editingQuizId = work.id;

        $("quizTitle").value = work.title;
        $("quizDescription").value =
            work.instructions || "";

        $("quizQuestions").innerHTML = "";

        if (work.questions?.length) {
            work.questions.forEach(addQuestion);
        } else {
            addQuestion();
        }

        $("quizBuilderDialog").showModal();
    }

    function addQuestion(question = {}) {
        const wrapper = document.createElement("div");
        wrapper.className = "quiz-question";

        wrapper.innerHTML = `
            <label>Question</label>

            <input class="question-title"
                   placeholder="Enter question"
                   value="${escapeHTML(question.title || "")}"
                   required>

            <label>Question Type</label>

            <select class="question-type">
                <option value="multiple">
                    Multiple Choice
                </option>
                <option value="short">
                    Short Answer
                </option>
                <option value="truefalse">
                    True / False
                </option>
            </select>

            <label>Answer Choices (one per line)</label>

            <textarea class="question-options"
                      rows="4"
                      placeholder="Option A&#10;Option B&#10;Option C">${escapeHTML(
                          (question.options || []).join("\n")
                      )}</textarea>

            <label>Correct Answer</label>

            <input class="question-answer"
                   value="${escapeHTML(question.answer || "")}">

            <label>Points</label>

            <input class="question-points"
                   type="number"
                   min="0"
                   value="${Number(question.points) || 10}">

            <button type="button"
                    class="remove-question text-btn">
                Remove Question
            </button>
        `;

        wrapper.querySelector(".question-type").value =
            question.type || "multiple";

        wrapper.querySelector(".remove-question")
            .addEventListener("click", () => {
                wrapper.remove();
            });

        $("quizQuestions").appendChild(wrapper);
    }

    $("addQuizQuestion").addEventListener("click", () => {
        addQuestion();
    });

    $("cancelQuizBuilder").addEventListener("click", () => {
        $("quizBuilderDialog").close();
    });

    $("quizBuilderForm").addEventListener("submit", event => {
        event.preventDefault();

        const c = getClass();

        const work = c?.work.find(
            item => item.id === editingQuizId
        );

        if (!work) return;

        const questions = $$(".quiz-question").map(element => ({
            id: makeId(),
            title: element.querySelector(".question-title")
                .value.trim(),
            type: element.querySelector(".question-type")
                .value,
            options: element.querySelector(".question-options")
                .value.split("\n")
                .map(option => option.trim())
                .filter(Boolean),
            answer: element.querySelector(".question-answer")
                .value.trim(),
            points: Math.max(
                0,
                Number(
                    element.querySelector(".question-points").value
                ) || 0
            )
        }));

        if (questions.some(question => !question.title)) {
            alert("Every question needs a title.");
            return;
        }

        work.title = $("quizTitle").value.trim();
        work.instructions =
            $("quizDescription").value.trim();
        work.questions = questions;

        work.points = questions.reduce(
            (sum, question) => sum + question.points,
            0
        );

        saveData();

        $("quizBuilderDialog").close();

        renderClasswork();
        renderStream();
    });

    // =====================================
    // STUDENTS
    // =====================================

    function renderStudents() {
        const c = getClass();
        if (!c) return;

        $("classStudentList").innerHTML = c.students.length
            ? c.students.map(id => {
                const student = getStudent(id);
                if (!student) return "";

                return `
                    <tr>
                        <td>${escapeHTML(student.name)}</td>
                        <td>${escapeHTML(student.id)}</td>
                        <td>${student.grade}</td>
                    </tr>
                `;
            }).join("")
            : `<tr>
                   <td colspan="3">
                       No students enrolled.
                   </td>
               </tr>`;
    }

    $("addStudentsButton").addEventListener("click", () => {
        const c = getClass();
        if (!c) return;

        $("availableStudents").innerHTML =
            sampleStudents.map(student => `
                <label style="display:block;padding:9px">
                    <input type="checkbox"
                           class="student-checkbox"
                           value="${student.id}"
                           ${c.students.includes(student.id)
                               ? "checked" : ""}>

                    ${escapeHTML(student.name)}
                    (${student.id})
                </label>
            `).join("");

        $("addStudentsDialog").showModal();
    });

    $("closeAddStudents").addEventListener("click", () => {
        $("addStudentsDialog").close();
    });

    $("saveClassStudents").addEventListener("click", () => {
        const c = getClass();
        if (!c) return;

        c.students = $$(".student-checkbox:checked")
            .map(checkbox => checkbox.value);

        saveData();

        $("addStudentsDialog").close();

        renderStudents();
        renderGrades();
        renderClasses();
    });

    // =====================================
    // GRADES
    // =====================================

    function renderGrades() {
        const c = getClass();
        if (!c) return;

        $("classGradesBody").innerHTML = c.students.length
            ? c.students.map(id => {
                const student = getStudent(id);
                if (!student) return "";

                let earned = 0;
                let possible = 0;
                let graded = 0;

                c.work.forEach(work => {
                    const score = work.grades?.[id];

                    if (
                        score !== undefined &&
                        score !== null
                    ) {
                        earned += Number(score);
                        possible += Number(work.points);
                        graded++;
                    }
                });

                const average = possible > 0
                    ? `${Math.round(
                        earned / possible * 100
                    )}%`
                    : "Not Graded";

                return `
                    <tr>
                        <td>${escapeHTML(student.name)}</td>
                        <td>${graded} graded</td>
                        <td>${average}</td>
                    </tr>
                `;
            }).join("")
            : `<tr>
                   <td colspan="3">
                       No students enrolled.
                   </td>
               </tr>`;
    }

    function gradeAssignment(workId) {
        const c = getClass();

        const work = c?.work.find(
            item => item.id === workId
        );

        if (!work) return;

        if (!c.students.length) {
            alert("Add students to this class first.");
            return;
        }

        work.grades ||= {};

        for (const id of c.students) {
            const student = getStudent(id);
            if (!student) continue;

            const previous = work.grades[id] ?? "";

            const answer = prompt(
                `${work.title}\n` +
                `${student.name}\n` +
                `Score out of ${work.points}`,
                previous
            );

            if (answer === null) break;
            if (answer.trim() === "") continue;

            const score = Number(answer);

            if (
                !Number.isFinite(score) ||
                score < 0 ||
                score > Number(work.points)
            ) {
                alert("Invalid score. Skipping student.");
                continue;
            }

            work.grades[id] = score;
        }

        saveData();
        renderGrades();
        renderClasswork();
    }

    // =====================================
    // CALENDAR
    // =====================================

    function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();

        $("calendarMonth").textContent =
            calendarDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            });

        const firstDay =
            new Date(year, month, 1).getDay();

        const days =
            new Date(year, month + 1, 0).getDate();

        const today = new Date();

        let html = [
            "Sun", "Mon", "Tue", "Wed",
            "Thu", "Fri", "Sat"
        ].map(day => `
            <div class="calendar-day">
                <strong>${day}</strong>
            </div>
        `).join("");

        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day"></div>`;
        }

        for (let day = 1; day <= days; day++) {
            const date = [
                year,
                String(month + 1).padStart(2, "0"),
                String(day).padStart(2, "0")
            ].join("-");

            const events = data.classes.flatMap(c =>
                c.work
                    .filter(work => work.dueDate === date)
                    .map(work =>
                        `${c.section}: ${work.title}`
                    )
            );

            const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

            html += `
                <div class="calendar-day
                    ${isToday ? "today" : ""}">

                    <strong>${day}</strong>

                    ${events.map(event => `
                        <div class="calendar-event">
                            ${escapeHTML(event)}
                        </div>
                    `).join("")}

                </div>
            `;
        }

        $("calendarGrid").innerHTML = html;
    }

    $("previousMonth").addEventListener("click", () => {
        calendarDate = new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() - 1,
            1
        );

        renderCalendar();
    });

    $("nextMonth").addEventListener("click", () => {
        calendarDate = new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + 1,
            1
        );

        renderCalendar();
    });

    // =====================================
    // TO REVIEW
    // =====================================

    function renderReview() {
        const items = data.classes.flatMap(c =>
            c.work.map(work => ({
                className: c.name,
                section: c.section,
                work
            }))
        );

        $("reviewList").innerHTML = items.length
            ? items.map(item => `
                <div class="work-item">
                    <strong>
                        ${escapeHTML(item.work.title)}
                    </strong>

                    <p>
                        ${escapeHTML(item.className)}
                        · ${escapeHTML(item.section)}
                    </p>

                    <p class="muted">
                        Open the class to enter grades.
                        Simulated submissions are coming later.
                    </p>
                </div>
            `).join("")
            : `<p class="muted">
                   No classwork to review.
               </p>`;
    }

    // =====================================
    // CREATE CLASS
    // =====================================

    function openCreateClass() {
        $("createClassDialog").showModal();
    }

    $("homeCreateClass").addEventListener(
        "click",
        openCreateClass
    );

    $("createClassButton").addEventListener(
        "click",
        openCreateClass
    );

    $("cancelCreateClass").addEventListener("click", () => {
        $("createClassDialog").close();
    });

    $("createClassForm").addEventListener("submit", event => {
        event.preventDefault();

        const name = $("newClassName").value.trim();
        if (!name) return;

        const c = {
            id: makeId(),
            code: Math.random()
                .toString(36)
                .slice(2, 8)
                .toUpperCase(),
            name,
            section: $("newClassSection").value.trim(),
            room: $("newClassRoom").value.trim(),
            subject: $("newClassSubject").value,
            students: [],
            announcements: [],
            work: [],
            automatic: false
        };

        data.classes.push(c);
        saveData();

        $("createClassForm").reset();
        $("createClassDialog").close();

        renderClasses();
        openClass(c.id);
    });

    // =====================================
    // MAIN NAVIGATION EVENTS
    // =====================================

    $$(".nav-item").forEach(button => {
        button.addEventListener("click", () => {
            showView(button.dataset.view);
        });
    });

    $$(".class-tab").forEach(button => {
        button.addEventListener("click", () => {
            showClassTab(button.dataset.classTab);
        });
    });

    $("backToClasses").addEventListener("click", () => {
        showView("classes");
    });

    $("menuToggle").addEventListener("click", () => {
        $("sidebar").classList.toggle("collapsed");
    });

    // =====================================
    // INITIALIZE
    // =====================================

    loadTeacher();
    setupTeachingSchedule();
    renderClasses();
    showView("home");
});
