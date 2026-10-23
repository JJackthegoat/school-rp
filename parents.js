
"use strict";

const CLASSROOM_KEY = "schoolRP_classroom_v1";
const STUDENTS_KEY = "riverside_ai_students_v1";
const SIMULATION_KEY = "riverside_simulation_v2";

let activeConversationId = null;
let conversations = [];
let replyTimer = null;

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveSimulation() {
  localStorage.setItem(SIMULATION_KEY, JSON.stringify(simulationData));
}

let simulationData = readJSON(SIMULATION_KEY, {
  submissions: {},
  missing: {},
  messages: [],
  activity: [],
  settings: { auto: true }
});

simulationData.submissions ??= {};
simulationData.missing ??= {};
simulationData.messages ??= [];
simulationData.activity ??= [];
simulationData.settings ??= { auto: true };

function makeId() {
  return "parent_" + Date.now().toString(36) +
    "_" + Math.random().toString(36).slice(2, 9);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getClasses() {
  const data = readJSON(CLASSROOM_KEY, { classes: [] });
  return Array.isArray(data) ? data :
    Array.isArray(data.classes) ? data.classes : [];
}

function getStudents() {
  const data = readJSON(STUDENTS_KEY, []);
  return Array.isArray(data) ? data :
    Array.isArray(data.students) ? data.students : [];
}

function getStudent(studentId) {
  for (const schoolClass of getClasses()) {
    const student = (schoolClass.students || []).find(item =>
      String(typeof item === "object" ? item.id : item) === String(studentId)
    );

    if (student && typeof student === "object") {
      return {
        ...student,
        className: schoolClass.name || "Class",
        classId: schoolClass.id
      };
    }
  }

  const student = getStudents().find(item =>
    String(item.id) === String(studentId)
  );

  return student || null;
}

function studentName(studentId) {
  const student = getStudent(studentId);
  return student?.name || student?.fullName || "Student";
}

function getConversationMessages(conversation) {
  if (!Array.isArray(conversation.replies)) {
    conversation.replies = [];
  }

  return conversation.replies;
}

function getConversationPreview(conversation) {
  const messages = getConversationMessages(conversation);
  const last = messages[messages.length - 1];

  return last?.text || conversation.text || "New conversation";
}

function normalizeMessages() {
  simulationData.messages = simulationData.messages.map(message => {
    const item = { ...message };

    item.id ||= makeId();
    item.studentId ??= "";
    item.parent ||= "Parent/Guardian";
    item.text ||= "";
    item.date ||= new Date().toISOString();
    item.replies = Array.isArray(item.replies) ? item.replies : [];

    return item;
  });

  conversations = simulationData.messages;
}

function showMessageAreaPlaceholder(title, description) {
  document.getElementById("messageArea").innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">✉</div>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </div>`;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderConversationList() {
  const list = document.getElementById("conversationList");

  if (!conversations.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No conversations yet.</p>
      </div>`;
    return;
  }

  list.innerHTML = conversations.map(conversation => {
    const active = conversation.id === activeConversationId;
    const name = conversation.parent || "Parent/Guardian";

    return `
      <button
        type="button"
        class="conversation-item ${active ? "active" : ""}"
        data-conversation-id="${escapeHTML(conversation.id)}">
        <span class="conversation-name">${escapeHTML(name)}</span>
        <span class="conversation-preview">
          ${escapeHTML(studentName(conversation.studentId))}
          · ${escapeHTML(getConversationPreview(conversation).slice(0, 85))}
        </span>
      </button>`;
  }).join("");

  list.querySelectorAll("[data-conversation-id]").forEach(button => {
    button.addEventListener("click", () => {
      activeConversationId = button.dataset.conversationId;
      renderAll();
    });
  });
}

function getStudentSummary(conversation) {
  const student = getStudent(conversation.studentId);

  if (!student) {
    return `
      <strong>Student:</strong> ${escapeHTML(studentName(conversation.studentId))}
      <br>Student information has not been linked to a classroom record yet.`;
  }

  const grades = [];
  const schoolClasses = getClasses();

  for (const schoolClass of schoolClasses) {
    for (const work of schoolClass.work || []) {
      const grade = work.grades?.[conversation.studentId];

      if (grade !== undefined && grade !== null && grade !== "") {
        grades.push({
          title: work.title || "Assignment",
          grade: typeof grade === "object"
            ? grade.score ?? grade.grade ?? "Recorded"
            : grade
        });
      }
    }
  }

  const recentGrades = grades.slice(-3).map(item =>
    `${escapeHTML(item.title)}: ${escapeHTML(item.grade)}`
  ).join(" · ");

  return `
    <strong>Student:</strong> ${escapeHTML(student.name || student.fullName || "Student")}
    ${student.grade ? ` · <strong>Grade:</strong> ${escapeHTML(student.grade)}` : ""}
    ${student.className ? ` · <strong>Class:</strong> ${escapeHTML(student.className)}` : ""}
    ${recentGrades ? `<br><strong>Recent recorded grades:</strong> ${recentGrades}` : ""}
  `;
}

function renderMessages() {
  const conversation = conversations.find(item =>
    item.id === activeConversationId
  );

  const title = document.getElementById("conversationTitle");
  const subtitle = document.getElementById("conversationSubtitle");
  const summary = document.getElementById("studentSummary");
  const area = document.getElementById("messageArea");
  const input = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");

  if (!conversation) {
    title.textContent = "Select a conversation";
    subtitle.textContent = "Choose a parent from the inbox to get started.";
    summary.textContent = "Select a conversation to view student information.";
    input.disabled = true;
    sendButton.disabled = true;

    showMessageAreaPlaceholder(
      "No conversation selected",
      "Choose a conversation or start a new one."
    );
    return;
  }

  input.disabled = false;
  sendButton.disabled = false;
  title.textContent = conversation.parent || "Parent/Guardian";
  subtitle.textContent = "Parent conversation · Simulated responses";
  summary.innerHTML = getStudentSummary(conversation);

  const messages = getConversationMessages(conversation);

  if (!messages.length) {
    showMessageAreaPlaceholder(
      "Conversation started",
      "Send a message to begin this conversation."
    );
    return;
  }

  area.innerHTML = messages.map(message => {
    const isTeacher = message.sender === "teacher";
    const label = isTeacher ? "Teacher" : "Parent/Guardian";

    return `
      <div class="message ${isTeacher ? "teacher" : "parent"}">
        <span class="message-label">${label}</span>
        <div class="message-bubble">${escapeHTML(message.text)}</div>
        <span class="message-time">${escapeHTML(formatDate(message.date))}</span>
      </div>`;
  }).join("");

  area.scrollTop = area.scrollHeight;
}

function renderAll() {
  renderConversationList();
  renderMessages();
}

function addConversation(studentId, parentName) {
  const conversation = {
    id: makeId(),
    studentId: String(studentId),
    parent: parentName.trim() || "Parent/Guardian",
    text: "",
    date: new Date().toISOString(),
    replies: []
  };

  conversations.unshift(conversation);
  activeConversationId = conversation.id;
  saveSimulation();
  renderAll();
}

function showNewConversationDialog() {
  const oldModal = document.getElementById("newConversationModal");
  if (oldModal) oldModal.remove();

  const students = getStudents();
  const classStudents = [];

  for (const schoolClass of getClasses()) {
    for (const student of schoolClass.students || []) {
      if (student && typeof student === "object") {
        classStudents.push(student);
      } else {
        classStudents.push({
          id: student,
          name: String(student)
        });
      }
    }
  }

  const combined = [...classStudents, ...students];
  const uniqueStudents = [];
  const seen = new Set();

  for (const student of combined) {
    if (student?.id == null) continue;
    const id = String(student.id);
    if (seen.has(id)) continue;
    seen.add(id);
    uniqueStudents.push(student);
  }

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "newConversationModal";

  const options = uniqueStudents.map(student => `
    <option value="${escapeHTML(student.id)}">
      ${escapeHTML(student.name || student.fullName || "Student")}
    </option>`).join("");

  backdrop.innerHTML = `
    <form class="modal" id="newConversationForm">
      <h2>New Parent Conversation</h2>
      <p class="muted">Create a conversation linked to a student.</p>

      <label for="newStudent">Student</label>
      <select id="newStudent" required>
        <option value="">Choose a student</option>
        ${options}
      </select>

      <label for="newParentName">Parent/guardian name</label>
      <input id="newParentName" placeholder="e.g. Jordan's parent" required>

      ${uniqueStudents.length ? "" : `
        <p class="muted">
          No student roster was found. Add students in your simulation or
          classroom first.
        </p>`}

      <div class="modal-actions">
        <button type="button" class="modal-cancel" id="cancelConversation">
          Cancel
        </button>
        <button type="submit" class="modal-submit"
          ${uniqueStudents.length ? "" : "disabled"}>
          Create Conversation
        </button>
      </div>
    </form>`;

  document.body.appendChild(backdrop);

  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) backdrop.remove();
  });

  document.getElementById("cancelConversation").addEventListener("click", () => {
    backdrop.remove();
  });

  document.getElementById("newConversationForm").addEventListener("submit", event => {
    event.preventDefault();

    const studentId = document.getElementById("newStudent").value;
    const parentName = document.getElementById("newParentName").value;

    if (!studentId || !parentName.trim()) return;

    addConversation(studentId, parentName);
    backdrop.remove();
  });
}

function classifyMessage(message) {
  const text = message.toLowerCase();

  const patterns = [
    {
      topic: "missing",
      match: /\b(missing|not turned in|not submitted|overdue|late assignment|incomplete assignment|incomplete work)\b/,
      replies: [
        "Thank you for letting me know. Which assignments are missing, and when should they be completed?",
        "I appreciate the update. I'll talk with my child about completing the work. Could you share the assignment names?",
        "Thank you for contacting me. Is there a way for my child to make up the missing work?"
      ]
    },
    {
      topic: "positive",
      match: /\b(great|excellent|wonderful|improv(ed|ing)|doing well|good progress|hard work|responsible|participat(e|es|ing)|commend|proud)\b/,
      replies: [
        "Thank you for sharing this positive update! I'm glad to hear my child is making progress.",
        "That's wonderful to hear. I appreciate you recognizing my child's effort.",
        "Thank you for letting me know. I'll encourage my child to keep up the good work."
      ]
    },
    {
      topic: "grades",
      match: /\b(low grade|grade|score|failing|failed|test result|quiz result|report card|below expectations|academic performance)\b/,
      replies: [
        "Thank you for reaching out. Could you explain which skills my child should work on and how they can improve?",
        "I appreciate the update. What steps can we take at home to help improve the grade?",
        "Could you tell me which assignments or assessments are affecting the grade?"
      ]
    },
    {
      topic: "behavior",
      match: /\b(behavior|behaviour|disruptive|disruption|arguing|argument|rude|disrespectful|classroom rules|not following directions|interrupted|disturbing class)\b/,
      replies: [
        "Thank you for informing me. Could you explain what happened and what was happening before the behavior?",
        "I appreciate you letting me know. I'll discuss expectations with my child. What would you recommend we reinforce at home?",
        "Could we work together on a plan to help my child make better choices in class?"
      ]
    },
    {
      topic: "attendance",
      match: /\b(absent|absence|attendance|tardy|late to school|late arrival|missed class|missed school)\b/,
      replies: [
        "Thank you for contacting me. I'll follow up about the attendance concern. Is there anything we need to submit?",
        "I appreciate the reminder. Could you tell me which date or dates you're referring to?",
        "Thank you for letting me know. I'll make sure we discuss the importance of attending class on time."
      ]
    },
    {
      topic: "help",
      match: /\b(help|support|struggling|difficulty|difficult|confused|tutoring|extra practice|extra help|doesn't understand|does not understand)\b/,
      replies: [
        "Thank you for letting me know. What can we practice at home to help my child understand the material?",
        "I appreciate your guidance. Are there any resources or extra-help opportunities you recommend?",
        "Could you share an example of what my child is finding difficult so we can work on it together?"
      ]
    },
    {
      topic: "meeting",
      match: /\b(meeting|conference|appointment|call me|phone call|discuss in person|schedule a time|talk with you)\b/,
      replies: [
        "Thank you for reaching out. What days and times would work for a meeting?",
        "I'd be happy to discuss this. Could you share a few possible times?",
        "Thank you. A conversation sounds helpful. Please let me know how we can arrange it."
      ]
    },
    {
      topic: "bullying",
      match: /\b(bully|bullying|bullied|harassment|threatened|threatening|picked on|being targeted)\b/,
      replies: [
        "Thank you for telling me. I take this seriously. Could you explain what was reported and what steps the school will take to address it?",
        "I'm concerned about this. Please let me know how the school can help ensure my child feels safe.",
        "Thank you for contacting me. I'd like to discuss this privately and understand what support is available."
      ]
    },
    {
      topic: "homework",
      match: /\b(homework|assignment|project|due date|due tomorrow|classwork|worksheet|study guide)\b/,
      replies: [
        "Thank you for the information. Could you confirm the due date and where my child can find the instructions?",
        "I appreciate the reminder. I'll check that my child understands what needs to be completed.",
        "Thanks for reaching out. Is there a rubric or checklist we can use to make sure the work is complete?"
      ]
    },
    {
      topic: "health",
      match: /\b(sick|illness|nurse|injury|hurt|medical|allerg(y|ies)|fever|not feeling well)\b/,
      replies: [
        "Thank you for letting me know. Please let me know what information the school needs from our family.",
        "I appreciate the update. If this needs immediate attention, please follow the school's health and safety procedures.",
        "Thank you for contacting me. Could you clarify what support my child needs during the school day?"
      ]
    },
    {
      topic: "thankyou",
      match: /\b(thank you|thanks|appreciate your|grateful)\b/,
      replies: [
        "You're welcome. Thank you for working with us to support your child.",
        "I appreciate your partnership. Please feel free to reach out if you have any other questions.",
        "Thank you for your support and communication."
      ]
    },
    {
      topic: "question",
      match: /\b(question|wondering|could you explain|please clarify|what happened|why did|can you tell me)\b/,
      replies: [
        "Thank you for explaining your concern. Could you share a little more detail so I can respond accurately?",
        "I understand you have a question. Let me know which part you'd like me to clarify.",
        "Thank you for asking. I'll do my best to provide the information you need."
      ]
    }
  ];

  return patterns.find(pattern => pattern.match.test(text)) || null;
}

function chooseParentReply(conversation, teacherMessage) {
  const classification = classifyMessage(teacherMessage);
  const history = getConversationMessages(conversation);
  const previousParentMessages = history.filter(message =>
    message.sender === "parent"
  );

  if (!classification) {
    if (previousParentMessages.length) {
      return "Thank you for following up. I want to make sure I understand correctly. Could you explain what you'd like us to do next or what information you need from our family?";
    }

    return "Thank you for contacting me about my child. Could you share a little more detail so I can understand the situation and how we can work together?";
  }

  const previousTopics = conversation.lastTopic || "";
  const choices = classification.replies.filter(reply =>
    reply !== conversation.lastReply
  );

  let reply = choices[Math.floor(Math.random() * choices.length)];

  if (previousTopics === classification.topic && conversation.lastReply) {
    reply = "Thank you for the additional information. " +
      "Could you clarify the next steps and how we can help at home?";
  }

  conversation.lastTopic = classification.topic;
  conversation.lastReply = reply;

  return reply;
}

function sendTeacherMessage(event) {
  event.preventDefault();

  const conversation = conversations.find(item =>
    item.id === activeConversationId
  );

  const input = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const text = input.value.trim();

  if (!conversation || !text) return;

  if (replyTimer) {
    clearTimeout(replyTimer);
    replyTimer = null;
  }

  getConversationMessages(conversation).push({
    id: makeId(),
    sender: "teacher",
    text,
    date: new Date().toISOString()
  });

  conversation.text = text;
  conversation.date = new Date().toISOString();

  input.value = "";
  saveSimulation();
  renderAll();

  sendButton.disabled = true;
  sendButton.textContent = "Parent is responding...";

  replyTimer = setTimeout(() => {
    const current = conversations.find(item =>
      item.id === activeConversationId
    );

    if (current && current.id === conversation.id) {
      const reply = chooseParentReply(current, text);

      getConversationMessages(current).push({
        id: makeId(),
        sender: "parent",
        text: reply,
        date: new Date().toISOString()
      });

      current.text = reply;
      current.date = new Date().toISOString();
      saveSimulation();
    } else {
      const reply = chooseParentReply(conversation, text);

      getConversationMessages(conversation).push({
        id: makeId(),
        sender: "parent",
        text: reply,
        date: new Date().toISOString()
      });

      conversation.text = reply;
      conversation.date = new Date().toISOString();
      saveSimulation();
    }

    replyTimer = null;
    sendButton.disabled = false;
    sendButton.textContent = "Send Message";
    renderAll();
  }, 1000);
}

function loadExistingConversations() {
  normalizeMessages();

  if (conversations.length) {
    activeConversationId = conversations[0].id;
  }

  renderAll();
}

document.getElementById("newConversationBtn")
  .addEventListener("click", showNewConversationDialog);

document.getElementById("messageForm")
  .addEventListener("submit", sendTeacherMessage);

window.addEventListener("storage", event => {
  if (event.key === SIMULATION_KEY) {
    simulationData = readJSON(SIMULATION_KEY, simulationData);
    simulationData.messages ??= [];
    normalizeMessages();
    renderAll();
  }
});

loadExistingConversations();
