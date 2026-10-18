
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // TEACHER PROFILE
    // =====================================

    let teacherProfile = {};

    try {
        teacherProfile =
            JSON.parse(localStorage.getItem("teacherProfile")) || {};
    } catch (error) {
        teacherProfile = {};
    }

    const teacherName =
        teacherProfile.name ||
        teacherProfile.teacherName ||
        "Teacher";

    const teacherSubject =
        teacherProfile.subject ||
        teacherProfile.teacherSubject ||
        "Mathematics";

    const teacherGrade =
        teacherProfile.grade ||
        teacherProfile.teacherGrade ||
        "7";

    document.getElementById("genesisTeacher").textContent =
        teacherName;

    document.getElementById("genesisSubject").textContent =
        teacherSubject;

    document.getElementById("genesisGrade").textContent =
        teacherGrade;

    // =====================================
    // NAVIGATION
    // =====================================

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

    function openPage(pageName) {

        mainTabs.forEach(tab => {
            tab.classList.toggle(
                "active",
                tab.dataset.tab === pageName
            );
        });

        pages.forEach(page => {
            page.classList.toggle(
                "active",
                page.id === pageMap[pageName]
            );
        });

        // Show attendance sub-navigation
        const subNav = document.querySelector(".sub-nav");

        if (subNav) {
            subNav.style.display =
                pageName === "attendance" ? "flex" : "none";
        }
    }

    mainTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            openPage(tab.dataset.tab);
        });
    });

    subTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            subTabs.forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");
        });
    });

    // Attendance is the default page
    openPage("attendance");

    // =====================================
    // FICTIONAL STUDENT RECORDS
    // =====================================

    const students = [
        {
            id: "10001",
            first: "Alex",
            last: "Morgan",
            grade: "7",
            homeroom: "100"
        },
        {
            id: "10002",
            first: "Jordan",
            last: "Lee",
            grade: "7",
            homeroom: "100"
        },
        {
            id: "10003",
            first: "Taylor",
            last: "Brooks",
            grade: "7",
            homeroom: "100"
        }
    ];

    // =====================================
    // STUDENT SEARCH
    // =====================================

    const studentSearch =
        document.getElementById("studentSearch");

    const studentTableBody =
        document.getElementById("studentTableBody");

    function renderStudents(searchTerm = "") {

        const term = searchTerm.toLowerCase().trim();

        const filtered = students.filter(student => {
            const fullName =
                `${student.first} ${student.last}`.toLowerCase();

            const reverseName =
                `${student.last} ${student.first}`.toLowerCase();

            return (
                fullName.includes(term) ||
                reverseName.includes(term) ||
                student.id.includes(term)
            );
        });

        studentTableBody.innerHTML = "";

        if (filtered.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "No students found.";

            row.appendChild(cell);
            studentTableBody.appendChild(row);
            return;
        }

        filtered.forEach(student => {

            const row = document.createElement("tr");

            [
                student.id,
                student.last,
                student.first,
                student.grade,
                student.homeroom
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            studentTableBody.appendChild(row);
        });
    }

    studentSearch.addEventListener("input", () => {
        renderStudents(studentSearch.value);
    });

    renderStudents();

    // =====================================
    // ATTENDANCE SYSTEM
    // =====================================

    const attendanceDate =
        document.getElementById("attendanceDate");

    const attendanceTableBody =
        document.getElementById("attendanceTableBody");

    const attendanceStatus =
        document.getElementById("attendanceStatus");

    const attendanceMessage =
        document.getElementById("attendanceMessage");

    const postAttendance =
        document.getElementById("postAttendance");

    const clearAttendance =
        document.getElementById("clearAttendance");

    // Default to today's date in the browser
    const now = new Date();

    const localDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    attendanceDate.value = localDate;

    function storageKey() {
        return `schoolRP_attendance_${attendanceDate.value}`;
    }

    function getSavedAttendance() {
        try {
            return JSON.parse(
                localStorage.getItem(storageKey())
            ) || null;
        } catch (error) {
            return null;
        }
    }

    function makeCell(value) {
        const cell = document.createElement("td");
        cell.textContent = value;
        return cell;
    }

    function renderAttendance() {

        const saved = getSavedAttendance();

        attendanceTableBody.innerHTML = "";
        attendanceMessage.textContent = "";

        students.forEach(student => {

            const row = document.createElement("tr");
            row.dataset.studentId = student.id;

            row.appendChild(makeCell(student.id));
            row.appendChild(makeCell(student.last));
            row.appendChild(makeCell(student.first));
            row.appendChild(makeCell("—"));

            const statusCell = document.createElement("td");
            const select = document.createElement("select");

            select.className = "attendance-select";
            select.setAttribute(
                "aria-label",
                `Attendance for ${student.first} ${student.last}`
            );

            ["Present", "Absent", "Tardy", "Excused"]
                .forEach(status => {
                    const option = document.createElement("option");
                    option.value = status;
                    option.textContent = status;
                    select.appendChild(option);
                });

            if (saved && saved[student.id]) {
                select.value = saved[student.id].status;
            }

            statusCell.appendChild(select);
            row.appendChild(statusCell);

            const commentCell = document.createElement("td");
            const commentInput = document.createElement("input");

            commentInput.type = "text";
            commentInput.className = "attendance-comment";
            commentInput.placeholder = "Comment";

            commentInput.setAttribute(
                "aria-label",
                `Comment for ${student.first} ${student.last}`
            );

            if (saved && saved[student.id]) {
                commentInput.value =
                    saved[student.id].comment || "";
            }

            commentCell.appendChild(commentInput);
            row.appendChild(commentCell);

            attendanceTableBody.appendChild(row);
        });

        attendanceStatus.textContent =
            saved ? "Posted" : "Not Posted";
    }

    postAttendance.addEventListener("click", () => {

        if (!attendanceDate.value) {
            attendanceMessage.textContent =
                "Please select an attendance date.";
            return;
        }

        const records = {};

        attendanceTableBody.querySelectorAll("tr")
            .forEach(row => {

                const id = row.dataset.studentId;

                if (!id) return;

                records[id] = {
                    status: row.querySelector(
                        ".attendance-select"
                    ).value,

                    comment: row.querySelector(
                        ".attendance-comment"
                    ).value
                };
            });

        try {
            localStorage.setItem(
                storageKey(),
                JSON.stringify(records)
            );

            attendanceStatus.textContent = "Posted";

            attendanceMessage.textContent =
                "Attendance posted successfully!";
        } catch (error) {
            attendanceMessage.textContent =
                "Unable to save attendance on this device.";
        }
    });

    clearAttendance.addEventListener("click", () => {
        renderAttendance();
    });

    attendanceDate.addEventListener("change", () => {
        renderAttendance();
    });

    renderAttendance();

});
