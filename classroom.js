
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const KEY = 'schoolRP_classroom_v1';
  const PERIODS = [1, 2, 3, 4, 6, 7];
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const students = [
    ['10001', 'Alex Morgan'],
    ['10002', 'Jordan Lee'],
    ['10003', 'Taylor Brooks'],
    ['10004', 'Casey Rivera'],
    ['10005', 'Morgan Davis'],
    ['10006', 'Avery Wilson'],
    ['10007', 'Riley Parker'],
    ['10008', 'Cameron Smith'],
    ['10009', 'Jamie Thompson'],
    ['10010', 'Quinn Johnson'],
    ['10011', 'Dakota Brown'],
    ['10012', 'Reese Taylor']
  ].map(([id, name]) => ({ id, name, grade: 7 }));

  const esc = value => String(value ?? '').replace(
    /[&<>"']/g,
    ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch])
  );

  const id = () =>
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Date.now().toString(36) +
        Math.random().toString(36).slice(2);

  const profile = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('teacherProfile') || '{}'
      ) || {};
    } catch {
      return {};
    }
  })();

  const teacher =
    profile.name || profile.teacherName || 'Teacher';

  const subject =
    profile.subject ||
    profile.teacherSubject ||
    'General Studies';

  const grade =
    profile.grade || profile.teacherGrade || '7';

  let data;

  try {
    data = JSON.parse(localStorage.getItem(KEY));
  } catch {
    data = null;
  }

  if (!data || !Array.isArray(data.classes)) {
    data = { classes: [] };
  }

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      alert('Browser storage is full or unavailable.');
    }
  };

  let currentClassId = null;
  let editingWorkId = null;
  let editingType = 'assignment';
  let calendarDate = new Date();
  let collapsedTopics = new Set();

  const current = () =>
    data.classes.find(c => c.id === currentClassId);

  const getStudent = sid =>
    students.find(s => s.id === sid);

  const dateLabel = iso => {
    if (!iso) return 'No due date';

    const [y, m, d] = iso.split('-').map(Number);

    return new Date(y, m - 1, d).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  };

  // SET UP SIX TEACHING PERIODS

  let added = false;

  PERIODS.forEach(period => {
    const section = `Period ${period}`;

    const exists = data.classes.some(c =>
      String(c.section || '')
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
      room: '204',
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

  // TEACHER INFORMATION

  $('teacherDisplay').textContent = teacher;
  $('welcomeMessage').textContent =
    `Welcome, ${teacher}`;

  $('settingsTeacherName').textContent = teacher;
  $('settingsTeacherSubject').textContent = subject;
  $('settingsTeacherGrade').textContent = grade;

  document.querySelector('.teacher-avatar')
    .textContent = teacher.charAt(0).toUpperCase();

  // PAGE NAVIGATION

  function view(name) {
    $$('.view').forEach(el => {
      el.classList.toggle(
        'active',
        el.id === `${name}View`
      );
    });

    $$('.nav-item[data-view]').forEach(el => {
      el.classList.toggle(
        'active',
        el.dataset.view === name
      );
    });

    const titles = {
      home: 'Classroom',
      classes: 'Teaching',
      classDetail: current()?.name || 'Classroom',
      assignmentEditor: 'Classwork',
      calendar: 'Calendar',
      todo: 'To Review',
      settings: 'Settings'
    };

    $('pageTitle').textContent =
      titles[name] || 'Classroom';

    if (name === 'home' || name === 'classes') {
      renderClasses();
    }

    if (name === 'calendar') renderCalendar();
    if (name === 'todo') renderReview();
  }

  // CLASS CARDS

  function renderClasses() {
    const sorted = [...data.classes].sort((a, b) => {
      const period = c =>
        Number(
          String(c.section || '')
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
            Room ${esc(c.room || 'Not set')}
            · ${c.students.length} students
          </p>
        </div>

        <div class="class-card-footer">
          Open class →
        </div>
      </article>
    `).join('');

    $('homeClassGrid').innerHTML = cards;
    $('classGrid').innerHTML = cards;

    $('sidebarClassList').innerHTML =
      sorted.map(c => `
        <button
          class="sidebar-class"
          data-class-id="${esc(c.id)}"
        >
          ${esc(c.name)} — ${esc(c.section)}
        </button>
      `).join('');

    $$('[data-class-id]').forEach(el => {
      const open = () => openClass(el.dataset.classId);

      el.addEventListener('click', open);

      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  // OPEN CLASS

  function openClass(classId) {
    currentClassId = classId;

    const c = current();
    if (!c) return;

    $('classTitle').textContent = c.name;

    $('classSubtitle').textContent =
      `${c.section} · Room ${c.room || 'Not set'}`;

    $('classCodeDisplay').textContent =
      `Class code: ${c.code}`;

    view('classDetail');
    classTab('stream');
  }

  // CLASS TABS

  function classTab(tab) {
    $$('.class-tab').forEach(el => {
      el.classList.toggle(
        'active',
        el.dataset.classTab === tab
      );
    });

    $$('.class-panel').forEach(el => {
      el.classList.toggle(
        'active',
        el.id === `${tab}Panel`
      );
    });

    if (tab === 'stream') renderStream();
    if (tab === 'classwork') renderClasswork();
    if (tab === 'people') renderStudents();
    if (tab === 'grades') renderGrades();
  }

  // STREAM

  function renderStream() {
    const c = current();
    if (!c) return;

    $('streamPosts').innerHTML =
      c.announcements.length
        ? [...c.announcements].reverse().map(p => `
          <article class="stream-post">
            <h3>Announcement</h3>
            <small>${esc(p.date)}</small>
            <p style="white-space:pre-wrap">
              ${esc(p.text)}
            </p>
          </article>
        `).join('')
        : '<div class="empty-state">No announcements yet.</div>';

    const upcoming = c.work
      .filter(w => w.status !== 'draft' && w.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    $('upcomingWork').innerHTML =
      upcoming.length
        ? upcoming.map(w => `
          <p>
            <strong>${esc(w.title)}</strong>
            <br>
            <small>
              Due ${esc(dateLabel(w.dueDate))}
            </small>
          </p>
        `).join('')
        : '<p class="muted">No upcoming work.</p>';
  }

  // CLASSWORK TOPICS

  function allTopics(c) {
    if (!c) return [];

    return [...new Set([
      ...(c.topics || []),
      ...c.work.map(w => w.topic).filter(Boolean)
    ])];
  }

  // CLASSWORK LIST

  function renderClasswork() {
    const c = current();
    if (!c) return;

    const topics = allTopics(c);
    const filter = $('classworkTopicFilter');
    const previous = filter.value;

    filter.innerHTML =
      '<option value="all">All topics</option>' +
      topics.map(t => `
        <option value="${esc(t)}">
          ${esc(t)}
        </option>
      `).join('');

    filter.value =
      topics.includes(previous) ? previous : 'all';

    const shown =
      filter.value === 'all'
        ? c.work
        : c.work.filter(
            w => (w.topic || '') === filter.value
          );

    const workCard = w => `
      <article class="work-item">
        <h3>${esc(w.title || 'Untitled')}</h3>

        <p>
          ${esc(({
            assignment: 'Assignment',
            quiz: 'Quiz assignment',
            question: 'Question',
            material: 'Material'
          })[w.type] || w.type)}
          ·
          ${esc(
            w.status === 'draft'
              ? 'Draft'
              : 'Assigned'
          )}
          ·
          ${esc(dateLabel(w.dueDate))}
        </p>

        <p>${esc(w.instructions || '')}</p>

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

    let html = '';

    const groups =
      filter.value === 'all'
        ? topics
        : topics.filter(t => t === filter.value);

    groups.forEach(topic => {
      const works =
        shown.filter(w => w.topic === topic);

      html += `
        <section class="topic-section">

          <div class="topic-header">
            <h3>${esc(topic)}</h3>

            <button
              class="topic-toggle"
              data-toggle-topic="${esc(topic)}"
              aria-label="Expand or collapse topic"
            >
              ${collapsedTopics.has(topic) ? '⌄' : '⌃'}
            </button>
          </div>

          <div class="topic-items ${
            collapsedTopics.has(topic)
              ? 'collapsed'
              : ''
          }">

            ${
              works.length
                ? works.map(workCard).join('')
                : '<p class="muted">No work in this topic yet.</p>'
            }

          </div>

        </section>
      `;
    });

    const ungrouped =
      shown.filter(w => !w.topic);

    if (ungrouped.length) {
      html += `
        <section class="topic-section">
          <div class="topic-header">
            <h3>Without a topic</h3>
          </div>

          ${ungrouped.map(workCard).join('')}
        </section>
      `;
    }

    $('classworkList').innerHTML =
      html || `
        <div class="empty-state">
          <h3>No classwork yet</h3>
          <p>
            Click Create to add an assignment or topic.
          </p>
        </div>
      `;

    $$('[data-toggle-topic]').forEach(b => {
      b.onclick = () => {
        const t = b.dataset.toggleTopic;

        if (collapsedTopics.has(t)) {
          collapsedTopics.delete(t);
        } else {
          collapsedTopics.add(t);
        }

        renderClasswork();
      };
    });

    $$('[data-edit-work]').forEach(b => {
      b.onclick = () => {
        const work = current().work.find(
          w => w.id === b.dataset.editWork
        );

        openEditor(work);
      };
    });

    $$('[data-grade-work]').forEach(b => {
      b.onclick = () =>
        gradeAssignment(b.dataset.gradeWork);
    });
  }

  // ASSIGNMENT EDITOR OPTIONS

  function editorOptions() {
    $('editorAssignmentClass').innerHTML =
      data.classes.map(c => `
        <option value="${esc(c.id)}">
          ${esc(c.name)} — ${esc(c.section)}
        </option>
      `).join('');

    $('editorAssignmentClass').value =
      currentClassId;

    $('editorAssignmentTopic').innerHTML =
      '<option value="">No topic</option>' +
      allTopics(current()).map(t => `
        <option value="${esc(t)}">
          ${esc(t)}
        </option>
      `).join('');
  }

  // OPEN FULL-PAGE EDITOR

  function openEditor(work = null, type = 'assignment') {
    const c = current();
    if (!c) return;

    editingWorkId = work?.id || null;
    editingType = work?.type || type;

    editorOptions();

    const typeNames = {
      assignment: 'Assignment',
      quiz: 'Quiz assignment',
      question: 'Question',
      material: 'Material'
    };

    $('assignmentEditorHeading').textContent =
      typeNames[editingType] || 'Assignment';

    $('editorAssignmentTitle').value =
      work?.title || '';

    $('editorAssignmentInstructions').value =
      work?.instructions || '';

    $('editorAssignmentPoints').value =
      work?.points ??
      (editingType === 'material' ? 0 : 100);

    $('editorAssignmentDueDate').value =
      work?.dueDate || '';

    $('editorAssignmentTopic').value =
      work?.topic || '';

    $('editorAssignmentCategory').value =
      editingType;

    $('assignmentAttachments').innerHTML =
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
      `).join('');

    $('assignmentSaveStatus').textContent =
      work
        ? (
            work.status === 'draft'
              ? 'Draft'
              : 'Assigned'
          )
        : 'Unsaved changes';

    view('assignmentEditor');
  }

  // SAVE ASSIGNMENT

  function saveEditor(status) {
    const title =
      $('editorAssignmentTitle').value.trim();

    if (!title) {
      alert('Enter an assignment title.');
      $('editorAssignmentTitle').focus();
      return;
    }

    const source = current();
    if (!source) return;

    const target =
      data.classes.find(
        c => c.id === $('editorAssignmentClass').value
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
        $('editorAssignmentInstructions').value.trim(),
      points: Math.max(
        0,
        Number($('editorAssignmentPoints').value) || 0
      ),
      dueDate: $('editorAssignmentDueDate').value,
      topic: $('editorAssignmentTopic').value,
      type: $('editorAssignmentCategory').value,
      status
    });

    save();

    currentClassId = target.id;

    openClass(target.id);
    classTab('classwork');
  }

  // STUDENT ROSTER

  function renderStudents() {
    const c = current();
    if (!c) return;

    $('classStudentList').innerHTML =
      c.students.map(sid => {
        const s = getStudent(sid);
        if (!s) return '';

        return `
          <tr>
            <td>${esc(s.name)}</td>
            <td>${esc(s.id)}</td>
            <td>${s.grade}</td>
          </tr>
        `;
      }).join('') ||
      '<tr><td colspan="3">No students enrolled.</td></tr>';
  }

  // GRADES

  function renderGrades() {
    const c = current();
    if (!c) return;

    $('classGradesBody').innerHTML =
      c.students.map(sid => {
        const s = getStudent(sid);
        if (!s) return '';

        let earned = 0;
        let possible = 0;
        let count = 0;

        c.work
          .filter(w => w.status !== 'draft')
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
                    ) + '%'
                  : 'Not graded'
              }
            </td>
          </tr>
        `;
      }).join('') ||
      '<tr><td colspan="3">No students enrolled.</td></tr>';
  }

  // ENTER STUDENT GRADES

  function gradeAssignment(workId) {
    const c = current();

    const w = c?.work.find(
      w => w.id === workId
    );

    if (!w) return;

    if (!c.students.length) {
      alert('Add students to the class first.');
      return;
    }

    w.grades ||= {};

    for (const sid of c.students) {
      const s = getStudent(sid);
      if (!s) continue;

      const value = prompt(
        `${w.title}\n${s.name}\nScore out of ${w.points} (Cancel to stop):`,
        w.grades[sid] ?? ''
      );

      if (value === null) break;
      if (value.trim() === '') continue;

      const score = Number(value);

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > Number(w.points)
      ) {
        alert('Invalid score.');
        continue;
      }

      w.grades[sid] = score;
    }

    save();
    renderGrades();
  }

  // CALENDAR

  function renderCalendar() {
    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();

    $('calendarMonth').textContent =
      calendarDate.toLocaleDateString(
        'en-US',
        {
          month: 'long',
          year: 'numeric'
        }
      );

    let html = [
      'Sun', 'Mon', 'Tue', 'Wed',
      'Thu', 'Fri', 'Sat'
    ].map(day => `
      <div class="calendar-day">
        <strong>${day}</strong>
      </div>
    `).join('');

    html += '<div class="calendar-day"></div>'
      .repeat(new Date(y, m, 1).getDay());

    const daysInMonth =
      new Date(y, m + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const iso =
        `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const events = data.classes.flatMap(c =>
        c.work
          .filter(w =>
            w.status !== 'draft' &&
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
          isToday ? 'today' : ''
        }">
          <strong>${day}</strong>

          ${events.map(e => `
            <div class="calendar-event">
              ${esc(e)}
            </div>
          `).join('')}
        </div>
      `;
    }

    $('calendarGrid').innerHTML = html;
  }

  // TO REVIEW

  function renderReview() {
    const works = data.classes.flatMap(c =>
      c.work
        .filter(w => w.status !== 'draft')
        .map(w => ({ c, w }))
    );

    $('reviewList').innerHTML =
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
      `).join('') ||
      '<div class="empty-state">Nothing to review yet.</div>';
  }

  // NAVIGATION EVENTS

  $$('.nav-item[data-view]').forEach(b => {
    b.addEventListener(
      'click',
      () => view(b.dataset.view)
    );
  });

  $$('.class-tab').forEach(b => {
    b.addEventListener(
      'click',
      () => classTab(b.dataset.classTab)
    );
  });

  $('backToClasses').onclick =
    () => view('classes');

  $('menuToggle').onclick = () =>
    $('sidebar').classList.toggle('collapsed');

  // CREATE CLASS

  $('homeCreateClass').onclick =
    $('createClassButton').onclick =
      () => $('createClassDialog').showModal();

  $('cancelCreateClass').onclick =
    () => $('createClassDialog').close();

  $('createClassForm').onsubmit = e => {
    e.preventDefault();

    const c = {
      id: id(),
      code: Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase(),
      name: $('newClassName').value.trim(),
      section: $('newClassSection').value.trim(),
      room: $('newClassRoom').value.trim(),
      subject: $('newClassSubject').value,
      students: [],
      announcements: [],
      work: [],
      topics: []
    };

    if (!c.name) return;

    data.classes.push(c);
    save();

    $('createClassForm').reset();
    $('createClassDialog').close();

    openClass(c.id);
  };

  // POST ANNOUNCEMENTS

  $('postAnnouncement').onclick = () => {
    const text =
      $('announcementText').value.trim();

    if (!text || !current()) return;

    current().announcements.push({
      id: id(),
      text,
      date: new Date().toLocaleString()
    });

    save();

    $('announcementText').value = '';
    renderStream();
  };

  // CREATE DROPDOWN

  $('openCreateWork').onclick = () => {
    const menu = $('createWorkMenu');

    menu.hidden = !menu.hidden;

    $('openCreateWork').setAttribute(
      'aria-expanded',
      String(!menu.hidden)
    );
  };

  document.addEventListener('click', e => {
    if (!e.target.closest('.create-menu-container')) {
      $('createWorkMenu').hidden = true;

      $('openCreateWork').setAttribute(
        'aria-expanded',
        'false'
      );
    }
  });

  $$('[data-create-type]').forEach(b => {
    b.onclick = () => {
      $('createWorkMenu').hidden = true;

      $('openCreateWork').setAttribute(
        'aria-expanded',
        'false'
      );

      const type = b.dataset.createType;

      if (type === 'topic') {
        $('createTopicDialog').showModal();
        return;
      }

      if (type === 'reuse') {
        alert(
          'Reuse post will be added in a later update.'
        );
        return;
      }

      openEditor(null, type);
    };
  });

  // CREATE TOPIC

  $('createTopicForm').onsubmit = e => {
    e.preventDefault();

    const name = $('newTopicName').value.trim();
    const c = current();

    if (!name || !c) return;

    if (!allTopics(c).includes(name)) {
      c.topics.push(name);
    }

    save();

    $('createTopicForm').reset();
    $('createTopicDialog').close();

    renderClasswork();
  };

  $('cancelCreateTopic').onclick =
    () => $('createTopicDialog').close();

  $('classworkTopicFilter').onchange =
    renderClasswork;

  $('collapseTopics').onclick = () => {
    const topics = allTopics(current());

    collapsedTopics =
      collapsedTopics.size === topics.length
        ? new Set()
        : new Set(topics);

    renderClasswork();

    $('collapseTopics').textContent =
      collapsedTopics.size
        ? 'Expand all'
        : 'Collapse all';
  };

  // ASSIGNMENT EDITOR BUTTONS

  $('closeAssignmentEditor').onclick = () => {
    openClass(currentClassId);
    classTab('classwork');
  };

  $('saveAssignmentDraft').onclick =
    () => saveEditor('draft');

  $('publishAssignment').onclick =
    () => saveEditor('assigned');

  $('assignmentMoreOptions').onclick = () =>
    alert(
      'Use Save draft or Assign. Scheduling will be added later.'
    );

  $('editorAssignmentClass').onchange = () => {
    const c = data.classes.find(
      c => c.id === $('editorAssignmentClass').value
    );

    if (!c) return;

    $('editorAssignmentTopic').innerHTML =
      '<option value="">No topic</option>' +
      allTopics(c).map(t => `
        <option value="${esc(t)}">
          ${esc(t)}
        </option>
      `).join('');
  };

  [
    'editorAssignmentTitle',
    'editorAssignmentInstructions',
    'editorAssignmentPoints',
    'editorAssignmentDueDate',
    'editorAssignmentTopic'
  ].forEach(key => {
    $(key).addEventListener('input', () => {
      $('assignmentSaveStatus').textContent =
        'Unsaved changes';
    });
  });

  // ATTACHMENTS

  $('attachLink').onclick = () => {
    const url = prompt('Enter an https:// link:');

    if (!url) return;

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol !== 'https:' &&
        parsed.protocol !== 'http:'
      ) {
        throw Error();
      }

      $('assignmentAttachments').insertAdjacentHTML(
        'beforeend',
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
        'Link preview added. Saving attachments permanently will be added in a later update.'
      );
    } catch {
      alert('Please enter a valid web link.');
    }
  };

  $('attachFile').onclick = () =>
    alert(
      'File uploads need storage support. For now, add a link to a file.'
    );

  $('attachForm').onclick = () =>
    alert(
      'The full Riverside Forms editor is our next project.'
    );

  // ADD STUDENTS

  $('addStudentsButton').onclick = () => {
    const c = current();
    if (!c) return;

    $('availableStudents').innerHTML =
      students.map(s => `
        <label style="display:block;padding:10px">
          <input
            class="student-checkbox"
            type="checkbox"
            value="${esc(s.id)}"
            ${
              c.students.includes(s.id)
                ? 'checked'
                : ''
            }
          >

          ${esc(s.name)} (${esc(s.id)})
        </label>
      `).join('');

    $('addStudentsDialog').showModal();
  };

  $('closeAddStudents').onclick =
    () => $('addStudentsDialog').close();

  $('saveClassStudents').onclick = () => {
    const c = current();
    if (!c) return;

    c.students =
      $$('.student-checkbox:checked')
        .map(el => el.value);

    save();

    $('addStudentsDialog').close();

    renderStudents();
    renderGrades();
    renderClasses();
  };

  // CALENDAR BUTTONS

  $('previousMonth').onclick = () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() - 1,
      1
    );

    renderCalendar();
  };

  $('nextMonth').onclick = () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      1
    );

    renderCalendar();
  };

  // START CLASSROOM

  renderClasses();
  view('home');
});
