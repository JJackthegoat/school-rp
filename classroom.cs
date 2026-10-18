
/* =========================================
   RIVERSIDE CLASSROOM
   SCHOOL RP SIMULATION
========================================= */

:root {
    --primary: #16785f;
    --primary-dark: #105a48;
    --primary-light: #e6f4ee;
    --background: #f6f8fa;
    --surface: #ffffff;
    --text: #202b35;
    --muted: #687783;
    --border: #dfe5e9;
    --shadow: 0 2px 8px rgba(20, 35, 45, 0.05);
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    color: var(--text);
    background: var(--background);
}

button,
input,
select,
textarea {
    font: inherit;
}

button {
    cursor: pointer;
}

a {
    color: var(--primary);
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

.muted {
    color: var(--muted);
    font-size: 13px;
}

/* =========================================
   APP LAYOUT
========================================= */

.app-layout {
    display: flex;
    min-height: calc(100vh - 50px);
}

.sidebar {
    width: 260px;
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 23px 17px;
    border-bottom: 1px solid var(--border);
}

.brand-icon {
    width: 42px;
    height: 42px;
    background: var(--primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    font-size: 23px;
    font-weight: bold;
}

.sidebar-brand h2 {
    margin: 0 0 5px;
    font-size: 16px;
}

.sidebar-brand small {
    color: var(--muted);
    font-size: 11px;
}

.sidebar-nav {
    padding: 15px 10px;
}

.nav-item {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    padding: 13px 17px;
    border-radius: 8px;
    margin-bottom: 5px;
    color: #344450;
    font-weight: 500;
}

.nav-item:hover {
    background: #f1f5f4;
}

.nav-item.active {
    background: var(--primary-light);
    color: var(--primary-dark);
    font-weight: bold;
}

.sidebar-section {
    padding: 18px;
    border-top: 1px solid var(--border);
}

.sidebar-section h3 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--muted);
}

.sidebar-class {
    display: block;
    padding: 11px;
    margin-top: 7px;
    background: transparent;
    border: none;
    border-radius: 6px;
    width: 100%;
    text-align: left;
}

.sidebar-class:hover {
    background: var(--primary-light);
}

.sidebar-bottom {
    margin-top: auto;
    padding: 18px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 13px;
}

/* =========================================
   MAIN AREA / HEADER
========================================= */

.main-area {
    flex: 1;
    min-width: 0;
}

.topbar {
    background: white;
    border-bottom: 1px solid var(--border);
    min-height: 82px;
    padding: 15px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.topbar-left,
.topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.topbar h1 {
    font-size: 20px;
    margin: 0 0 5px;
}

.topbar p {
    margin: 0;
    font-size: 12px;
    color: var(--muted);
}

#menuToggle {
    border: none;
    background: transparent;
    font-size: 22px;
    padding: 8px;
    border-radius: 6px;
}

#menuToggle:hover {
    background: #eef2f4;
}

.teacher-avatar {
    width: 38px;
    height: 38px;
    background: #d9ede6;
    color: var(--primary-dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.content {
    max-width: 1450px;
    padding: 30px;
    margin: 0 auto;
}

/* =========================================
   VIEWS
========================================= */

.view {
    display: none;
}

.view.active {
    display: block;
}

.section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin: 25px 0 18px;
}

.section-heading h2,
.section-heading h3 {
    margin: 0;
}

.section-heading p {
    color: var(--muted);
    font-size: 13px;
}

.welcome-banner {
    background: linear-gradient(
        110deg,
        #126c57,
        #2a9a79
    );
    border-radius: 13px;
    padding: 32px;
    color: white;
}

.welcome-banner h2 {
    margin: 0 0 10px;
    font-size: 27px;
}

.welcome-banner p {
    margin-bottom: 20px;
    color: #e5fff3;
}

/* =========================================
   BUTTONS
========================================= */

.primary-btn {
    background: var(--primary);
    border: 1px solid var(--primary);
    color: white;
    padding: 11px 18px;
    border-radius: 7px;
    font-weight: bold;
}

.primary-btn:hover {
    background: var(--primary-dark);
}

.welcome-banner .primary-btn {
    background: white;
    color: var(--primary-dark);
    border-color: white;
}

.text-btn {
    background: transparent;
    color: var(--primary);
    border: none;
    padding: 10px 0;
    font-weight: bold;
}

/* =========================================
   CLASS CARDS
========================================= */

.class-grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
}

.class-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 11px;
    overflow: hidden;
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: transform 0.15s;
}

.class-card:hover {
    transform: translateY(-3px);
}

.class-card-header {
    background: #19775f;
    color: white;
    min-height: 120px;
    padding: 20px;
}

.class-card-header h3 {
    margin: 0 0 10px;
    font-size: 20px;
}

.class-card-header p {
    font-size: 13px;
}

.class-card-body {
    padding: 20px;
    min-height: 95px;
}

.class-card-footer {
    border-top: 1px solid var(--border);
    padding: 14px 20px;
    text-align: right;
    color: var(--primary);
    font-weight: bold;
}

.empty-state {
    background: white;
    border: 1px dashed #c7d5cf;
    border-radius: 10px;
    padding: 40px 25px;
    text-align: center;
    color: var(--muted);
}

.empty-state h3 {
    color: var(--text);
}

/* =========================================
   CLASS DETAIL
========================================= */

.class-banner {
    margin-top: 15px;
    background: linear-gradient(
        120deg,
        #196d59,
        #399c83
    );
    padding: 35px;
    color: white;
    border-radius: 12px;
}

.class-banner h2 {
    font-size: 28px;
    margin: 0 0 10px;
}

.class-banner p {
    margin: 0 0 15px;
}

.class-banner small {
    background: rgba(255,255,255,0.18);
    padding: 7px 10px;
    border-radius: 5px;
}

.class-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border);
    margin: 22px 0;
    overflow-x: auto;
}

.class-tab {
    background: transparent;
    border: none;
    padding: 14px 20px;
    color: var(--muted);
    white-space: nowrap;
}

.class-tab:hover {
    color: var(--primary);
}

.class-tab.active {
    color: var(--primary);
    font-weight: bold;
    border-bottom: 3px solid var(--primary);
}

.class-panel {
    display: none;
}

.class-panel.active {
    display: block;
}

/* =========================================
   STREAM
========================================= */

.stream-layout {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 20px;
}

.panel-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 23px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
}

.panel-card h3 {
    margin-top: 0;
}

.stream-main textarea {
    width: 100%;
    margin: 12px 0;
}

.stream-post {
    background: white;
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 20px;
    margin-bottom: 15px;
}

.stream-post h3 {
    margin: 0 0 8px;
}

.stream-post small {
    color: var(--muted);
}

/* =========================================
   CLASSWORK
========================================= */

.work-item {
    background: white;
    border: 1px solid var(--border);
    border-radius: 9px;
    padding: 20px;
    margin-bottom: 13px;
}

.work-item h3 {
    margin: 0 0 8px;
}

.work-item p {
    color: var(--muted);
    font-size: 13px;
}

.work-topic {
    color: var(--primary);
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 10px;
}

/* =========================================
   TABLES
========================================= */

.table-wrapper {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    text-align: left;
    background: #f0f5f2;
    color: #355347;
    padding: 13px;
    border-bottom: 1px solid var(--border);
}

.data-table td {
    padding: 13px;
    border-bottom: 1px solid var(--border);
}

.data-table tbody tr:hover {
    background: #f7faf8;
}

/* =========================================
   CALENDAR
========================================= */

.calendar-toolbar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 25px;
    margin-bottom: 20px;
}

.calendar-toolbar button {
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 14px;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
}

.calendar-day {
    background: white;
    min-height: 95px;
    padding: 10px;
    font-size: 13px;
}

.calendar-day.today {
    background: var(--primary-light);
}

.calendar-event {
    background: #d8eee4;
    color: #145c47;
    padding: 5px;
    border-radius: 4px;
    margin-top: 6px;
    font-size: 11px;
    overflow-wrap: anywhere;
}

/* =========================================
   FORMS / DIALOGS
========================================= */

input,
select,
textarea {
    background: white;
    border: 1px solid #cbd7d0;
    border-radius: 6px;
    padding: 11px;
    color: var(--text);
}

input:focus,
select:focus,
textarea:focus {
    outline: 2px solid #77bba5;
    outline-offset: 1px;
}

.app-dialog {
    width: min(95vw, 490px);
    max-height: 88vh;
    overflow-y: auto;
    border: none;
    border-radius: 12px;
    padding: 28px;
    box-shadow: 0 15px 60px rgba(0,0,0,0.25);
}

.app-dialog::backdrop {
    background: rgba(10,25,20,0.5);
}

.app-dialog h2 {
    margin-top: 0;
}

.app-dialog form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.app-dialog label {
    font-weight: bold;
    font-size: 13px;
    margin-top: 6px;
}

.app-dialog input,
.app-dialog select,
.app-dialog textarea {
    width: 100%;
}

.wide-dialog {
    width: min(95vw, 760px);
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.dialog-actions button {
    padding: 11px 17px;
    border-radius: 6px;
    border: 1px solid var(--border);
}

.dialog-actions .primary-btn {
    border-color: var(--primary);
}

.quiz-question {
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin: 12px 0;
}

.quiz-question input,
.quiz-question select {
    margin: 8px 0;
}

/* =========================================
   FOOTER
========================================= */

.app-footer {
    background: white;
    border-top: 1px solid var(--border);
    padding: 17px;
    text-align: center;
    color: var(--muted);
    font-size: 12px;
}

/* =========================================
   SIDEBAR COLLAPSE
========================================= */

.sidebar.collapsed {
    display: none;
}

/* =========================================
   MOBILE RESPONSIVE
========================================= */

@media (max-width: 900px) {
    .sidebar {
        width: 220px;
    }

    .stream-layout {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 650px) {
    .app-layout {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
        min-height: auto;
    }

    .sidebar-brand {
        padding: 15px;
    }

    .sidebar-nav {
        display: flex;
        overflow-x: auto;
        padding: 8px;
    }

    .nav-item {
        width: auto;
        white-space: nowrap;
    }

    .sidebar-section,
    .sidebar-bottom {
        display: none;
    }

    .topbar {
        padding: 14px;
    }

    .topbar h1 {
        font-size: 17px;
    }

    .content {
        padding: 15px;
    }

    .welcome-banner,
    .class-banner {
        padding: 23px;
    }

    .class-grid {
        grid-template-columns: 1fr;
    }

    .calendar-day {
        min-height: 60px;
        padding: 4px;
        font-size: 11px;
    }

    .calendar-event {
        font-size: 9px;
    }

    .app-dialog {
        padding: 20px;
    }
}
