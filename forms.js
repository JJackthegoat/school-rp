
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const STORAGE_KEY = "riverside_forms_v1";
  const CLASSROOM_KEY = "schoolRP_classroom_v1";

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const makeId = () =>
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString(36) +
        Math.random().toString(36).slice(2);

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  const params = new URLSearchParams(window.location.search);

  const requestedFormId = params.get("id");
  const classId = params.get("classId");

  let savedForms = readJSON(STORAGE_KEY, {});

  if (
    !savedForms ||
    typeof savedForms !== "object" ||
    Array.isArray(savedForms)
  ) {
    savedForms = {};
  }

  const formId = requestedFormId || makeId();

  let form = savedForms[formId] || {
    id: formId,
    title: "Untitled quiz",
    description: "",
    theme: "#673ab7",
    published: false,
    quizMode: true,
    collectNames: true,
    limitResponses: false,
    confirmationMessage: "Your response has been recorded.",
    questions: [],
    responses: []
  };

  form.questions ||= [];
  form.responses ||= [];

  let selectedQuestionId = null;
  let currentTab = "questions";
  let currentResponseTab = "summary";

  // ==========================================
  // SAVE FORM
  // ==========================================

  function save() {
    savedForms[formId] = form;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedForms)
      );

      $("saveStatus").textContent = "All changes saved";
      return true;
    } catch {
      $("saveStatus").textContent = "Unable to save";
      return false;
    }
  }

  function setChanged() {
    $("saveStatus").textContent = "Saving...";
    save();
  }

  // ==========================================
  // THEME
  // ==========================================

  function applyTheme() {
    const palettes = {
      "#673ab7": ["#512da8", "#ede7f6", "#f0ebf8"],
      "#1a73e8": ["#1558b0", "#e8f0fe", "#edf3fe"],
      "#188038": ["#137333", "#e6f4ea", "#edf7ef"],
      "#d93025": ["#b3261e", "#fce8e6", "#fceeed"],
      "#e8710a": ["#b85c00", "#fef3e4", "#fff5e9"]
    };

    const palette =
      palettes[form.theme] || palettes["#673ab7"];

    document.documentElement.style.setProperty(
      "--theme",
      form.theme
    );

    document.documentElement.style.setProperty(
      "--theme-dark",
      palette[0]
    );

    document.documentElement.style.setProperty(
      "--theme-light",
      palette[1]
    );

    document.documentElement.style.setProperty(
      "--page-bg",
      palette[2]
    );
  }

  // ==========================================
  // HEADER
  // ==========================================

  function updateHeader() {
    $("headerFormTitle").value = form.title;
    $("formTitle").value = form.title;
    $("formDescription").value = form.description;

    $("quizMode").checked = form.quizMode;
    $("collectNames").checked = form.collectNames;
    $("limitResponses").checked = form.limitResponses;

    $("confirmationMessage").value =
      form.confirmationMessage;

    $("responseCount").textContent =
      form.responses.length;

    $("responsesTotal").textContent =
      form.responses.length;

    $("publishForm").textContent =
      form.published ? "Published" : "Publish";

    document.title = `${form.title} | Riverside Forms`;
  }

  // ==========================================
  // TABS
  // ==========================================

  function showTab(tab) {
    currentTab = tab;

    $$(".form-tab").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.tab === tab
      );
    });

    $$(".form-view").forEach(view => {
      view.classList.toggle(
        "active",
        view.id === `${tab}View`
      );
    });

    if (tab === "questions") renderQuestions();
    if (tab === "responses") renderResponses();
  }

  // ==========================================
  // QUESTIONS
  // ==========================================

  function getQuestion(questionId) {
    return form.questions.find(
      question => question.id === questionId
    );
  }

  function newQuestion(type = "multiple") {
    const question = {
      id: makeId(),
      title: "",
      type,
      options: ["Option 1", "Option 2"],
      answer: [],
      points: 1,
      required: false
    };

    form.questions.push(question);
    selectedQuestionId = question.id;

    setChanged();
    renderQuestions();
  }

  function questionOptions(question) {
    if (
      !["multiple", "checkbox", "dropdown"]
        .includes(question.type)
    ) {
      const placeholder =
        question.type === "paragraph"
          ? "Long answer text"
          : "Short answer text";

      return `
        <div class="question-placeholder">
          ${placeholder}
        </div>
      `;
    }

    const symbol =
      question.type === "checkbox" ? "□" : "◯";

    return `
      <div class="question-options">

        ${question.options.map((option, index) => `
          <div class="question-option">

            <span class="option-symbol">
              ${symbol}
            </span>

            <input
              class="option-input"
              data-question="${escapeHTML(question.id)}"
              data-option-index="${index}"
              value="${escapeHTML(option)}"
              placeholder="Option ${index + 1}"
            >

            <button
              class="remove-option"
              data-remove-option="${escapeHTML(question.id)}"
              data-option-index="${index}"
              title="Remove option"
            >
              ×
            </button>

          </div>
        `).join("")}

        <button
          class="add-option-button"
          data-add-option="${escapeHTML(question.id)}"
        >
          + Add option
        </button>

      </div>
    `;
  }

  // ==========================================
  // ANSWER KEY
  // ==========================================

  function answerKey(question) {
    if (!form.quizMode) return "";

    if (
      !["multiple", "checkbox", "dropdown"]
        .includes(question.type)
    ) {
      return `
        <div class="answer-key-panel">
          <h4>Answer key</h4>
          <p>Written answers can be graded manually.</p>
        </div>
      `;
    }

    return `
      <div class="answer-key-panel">

        <h4>
          Answer key — Select correct answer(s)
        </h4>

        ${question.options.map((option, index) => `
          <label>

            <input
              type="${
                question.type === "checkbox"
                  ? "checkbox"
                  : "radio"
              }"
              name="answer-${escapeHTML(question.id)}"
              data-answer-question="${escapeHTML(question.id)}"
              value="${index}"
              ${
                question.answer.includes(index)
                  ? "checked"
                  : ""
              }
            >

            ${escapeHTML(option)}

          </label>
        `).join("")}

      </div>
    `;
  }

  // ==========================================
  // RENDER QUESTION EDITOR
  // ==========================================

  function renderQuestions() {
    $("emptyQuestions").hidden =
      form.questions.length > 0;

    $("questionsContainer").innerHTML =
      form.questions.map(question => `
        <article
          class="question-card ${
            question.id === selectedQuestionId
              ? "selected"
              : ""
          }"
          data-card="${escapeHTML(question.id)}"
        >

          <div class="question-card-top">

            <input
              class="question-title-input"
              data-question-title="${escapeHTML(question.id)}"
              value="${escapeHTML(question.title)}"
              placeholder="Question"
            >

            <select
              class="question-type-select"
              data-question-type="${escapeHTML(question.id)}"
            >

              <option
                value="multiple"
                ${
                  question.type === "multiple"
                    ? "selected"
                    : ""
                }
              >
                Multiple choice
              </option>

              <option
                value="checkbox"
                ${
                  question.type === "checkbox"
                    ? "selected"
                    : ""
                }
              >
                Checkboxes
              </option>

              <option
                value="dropdown"
                ${
                  question.type === "dropdown"
                    ? "selected"
                    : ""
                }
              >
                Dropdown
              </option>

              <option
                value="short"
                ${
                  question.type === "short"
                    ? "selected"
                    : ""
                }
              >
                Short answer
              </option>

              <option
                value="paragraph"
                ${
                  question.type === "paragraph"
                    ? "selected"
                    : ""
                }
              >
                Paragraph
              </option>

            </select>

          </div>

          ${questionOptions(question)}

          ${
            question.id === selectedQuestionId
              ? answerKey(question)
              : ""
          }

          <div class="question-footer">

            ${
              form.quizMode
                ? `
                  <span class="answer-key-button">
                    Answer key
                  </span>

                  <label>
                    Points

                    <input
                      class="question-points"
                      type="number"
                      min="0"
                      data-points="${escapeHTML(question.id)}"
                      value="${question.points}"
                    >
                  </label>
                `
                : ""
            }

            <button
              data-duplicate="${escapeHTML(question.id)}"
              title="Duplicate question"
            >
              ▣
            </button>

            <button
              data-delete="${escapeHTML(question.id)}"
              title="Delete question"
            >
              🗑
            </button>

            <label>
              Required

              <input
                type="checkbox"
                data-required="${escapeHTML(question.id)}"
                ${question.required ? "checked" : ""}
              >
            </label>

          </div>

        </article>
      `).join("");

    bindQuestionEvents();
  }

  // ==========================================
  // QUESTION EVENTS
  // ==========================================

  function bindQuestionEvents() {
    $$("[data-card]").forEach(card => {
      card.addEventListener("click", event => {
        if (selectedQuestionId === card.dataset.card) {
          return;
        }

        selectedQuestionId = card.dataset.card;
        renderQuestions();
      });
    });

    $$("[data-question-title]").forEach(input => {
      input.oninput = () => {
        const question = getQuestion(
          input.dataset.questionTitle
        );

        if (!question) return;

        question.title = input.value;
        setChanged();
      };
    });

    $$("[data-question-type]").forEach(select => {
      select.onchange = () => {
        const question = getQuestion(
          select.dataset.questionType
        );

        if (!question) return;

        question.type = select.value;
        question.answer = [];

        setChanged();
        renderQuestions();
      };
    });

    $$(".option-input[data-option-index]").forEach(input => {
      input.oninput = () => {
        const question = getQuestion(
          input.dataset.question
        );

        if (!question) return;

        question.options[
          Number(input.dataset.optionIndex)
        ] = input.value;

        setChanged();
      };
    });

    $$("[data-add-option]").forEach(button => {
      button.onclick = () => {
        const question = getQuestion(
          button.dataset.addOption
        );

        if (!question) return;

        question.options.push(
          `Option ${question.options.length + 1}`
        );

        setChanged();
        renderQuestions();
      };
    });

    $$("[data-remove-option]").forEach(button => {
      button.onclick = () => {
        const question = getQuestion(
          button.dataset.removeOption
        );

        if (!question) return;

        if (question.options.length <= 1) {
          alert("A question needs at least one option.");
          return;
        }

        const index = Number(
          button.dataset.optionIndex
        );

        question.options.splice(index, 1);

        question.answer = question.answer
          .filter(answer => answer !== index)
          .map(answer =>
            answer > index ? answer - 1 : answer
          );

        setChanged();
        renderQuestions();
      };
    });

    $$("[data-answer-question]").forEach(input => {
      input.onchange = () => {
        const question = getQuestion(
          input.dataset.answerQuestion
        );

        if (!question) return;

        const index = Number(input.value);

        if (question.type === "checkbox") {
          if (input.checked) {
            if (!question.answer.includes(index)) {
              question.answer.push(index);
            }
          } else {
            question.answer = question.answer.filter(
              answer => answer !== index
            );
          }
        } else {
          question.answer = [index];
        }

        setChanged();
      };
    });

    $$("[data-points]").forEach(input => {
      input.oninput = () => {
        const question = getQuestion(
          input.dataset.points
        );

        if (!question) return;

        question.points = Math.max(
          0,
          Number(input.value) || 0
        );

        setChanged();
      };
    });

    $$("[data-required]").forEach(input => {
      input.onchange = () => {
        const question = getQuestion(
          input.dataset.required
        );

        if (!question) return;

        question.required = input.checked;
        setChanged();
      };
    });

    $$("[data-duplicate]").forEach(button => {
      button.onclick = () => {
        const original = getQuestion(
          button.dataset.duplicate
        );

        if (!original) return;

        const copy = JSON.parse(
          JSON.stringify(original)
        );

        copy.id = makeId();

        const index = form.questions.indexOf(original);

        form.questions.splice(index + 1, 0, copy);

        selectedQuestionId = copy.id;

        setChanged();
        renderQuestions();
      };
    });

    $$("[data-delete]").forEach(button => {
      button.onclick = () => {
        form.questions = form.questions.filter(
          question =>
            question.id !== button.dataset.delete
        );

        selectedQuestionId =
          form.questions[0]?.id || null;

        setChanged();
        renderQuestions();
      };
    });
  }

  // ==========================================
  // PREVIEW
  // ==========================================

  function renderPreview() {
    $("previewContent").innerHTML = `
      <div class="form-title-card">
        <h1>${escapeHTML(form.title)}</h1>
        <p>${escapeHTML(form.description)}</p>
      </div>

      ${form.questions.map(question => `
        <div class="preview-question">

          <h3>
            ${escapeHTML(
              question.title || "Untitled question"
            )}

            ${
              question.required
                ? '<span style="color:red">*</span>'
                : ""
            }
          </h3>

          ${
            ["multiple", "checkbox", "dropdown"]
              .includes(question.type)
                ? question.options.map(option => `
                  <label>
                    <input
                      type="${
                        question.type === "checkbox"
                          ? "checkbox"
                          : "radio"
                      }"
                      name="preview-${escapeHTML(question.id)}"
                    >

                    ${escapeHTML(option)}
                  </label>
                `).join("")
                : question.type === "paragraph"
                  ? `
                    <textarea
                      placeholder="Your answer"
                    ></textarea>
                  `
                  : `
                    <input
                      type="text"
                      placeholder="Your answer"
                    >
                  `
          }

        </div>
      `).join("")}

      <p style="color:#5f6368">
        Preview mode — responses are not submitted.
      </p>
    `;
  }

  // ==========================================
  // RESPONSES
  // ==========================================

  function renderResponses() {
    $("responseCount").textContent =
      form.responses.length;

    $("responsesTotal").textContent =
      form.responses.length;

    if (!form.responses.length) {
      $("responsesContent").innerHTML = `
        <div class="empty-response-state">
          <h3>No responses yet</h3>

          <p>
            Student responses will appear here.
          </p>
        </div>
      `;

      return;
    }

    $("responsesContent").innerHTML =
      form.responses.map((response, index) => `
        <div class="preview-question">
          <h3>Response ${index + 1}</h3>

          <p>
            ${escapeHTML(response.name || "Student")}
          </p>

          <p>
            ${escapeHTML(response.date || "")}
          </p>
        </div>
      `).join("");
  }

  // ==========================================
  // PUBLISH TO CLASSROOM
  // ==========================================

  function publish() {
    if (!form.questions.length) {
      alert(
        "Add at least one question before publishing."
      );
      return;
    }

    const missingTitles = form.questions.some(
      question => !question.title.trim()
    );

    if (missingTitles) {
      alert(
        "Please give every question a title."
      );
      return;
    }

    form.published = true;

    if (!save()) {
      alert(
        "The quiz could not be saved. Please try again."
      );
      return;
    }

    updateHeader();

    if (!classId) {
      $("publishDialog").close();

      alert(
        "Quiz published! This form was not opened from Classroom, so it was not added to a class."
      );

      return;
    }

    const classroomData = readJSON(
      CLASSROOM_KEY,
      null
    );

    if (
      !classroomData ||
      !Array.isArray(classroomData.classes)
    ) {
      $("publishDialog").close();

      alert(
        "Quiz saved, but Classroom data could not be found."
      );

      return;
    }

    const targetClass = classroomData.classes.find(
      classroom => classroom.id === classId
    );

    if (!targetClass) {
      $("publishDialog").close();

      alert(
        "Quiz saved, but the original class could not be found."
      );

      return;
    }

    targetClass.work ||= [];

    const totalPoints = form.questions.reduce(
      (total, question) =>
        total + (Number(question.points) || 0),
      0
    );

    let assignment = targetClass.work.find(
      work => work.formId === form.id
    );

    if (!assignment) {
      assignment = {
        id: makeId(),
        formId: form.id,
        type: "quiz",
        grades: {},
        questions: [],
        attachments: []
      };

      targetClass.work.push(assignment);
    }

    Object.assign(assignment, {
      title: form.title.trim() || "Untitled quiz",
      instructions: form.description,
      points: totalPoints,
      dueDate: assignment.dueDate || "",
      topic: assignment.topic || "",
      type: "quiz",
      formId: form.id,
      status: "assigned",
      publishedAt: new Date().toISOString()
    });

    try {
      localStorage.setItem(
        CLASSROOM_KEY,
        JSON.stringify(classroomData)
      );
    } catch {
      $("publishDialog").close();

      alert(
        "Quiz saved, but adding it to Classroom failed."
      );

      return;
    }

    $("publishDialog").close();

    alert(
      `Quiz published to ${targetClass.name} — ${targetClass.section}!`
    );

    window.location.href = "classroom.html";
  }

  // ==========================================
  // FORM TITLE
  // ==========================================

  $("headerFormTitle").oninput = event => {
    form.title = event.target.value;

    $("formTitle").value = form.title;

    document.title =
      `${form.title} | Riverside Forms`;

    setChanged();
  };

  $("formTitle").oninput = event => {
    form.title = event.target.value;

    $("headerFormTitle").value = form.title;

    document.title =
      `${form.title} | Riverside Forms`;

    setChanged();
  };

  $("formDescription").oninput = event => {
    form.description = event.target.value;
    setChanged();
  };

  // ==========================================
  // TAB EVENTS
  // ==========================================

  $$(".form-tab").forEach(button => {
    button.onclick = () =>
      showTab(button.dataset.tab);
  });

  $$(".response-tab").forEach(button => {
    button.onclick = () => {
      currentResponseTab =
        button.dataset.responseTab;

      $$(".response-tab").forEach(tab => {
        tab.classList.toggle(
          "active",
          tab === button
        );
      });

      renderResponses();
    };
  });

  // ==========================================
  // QUESTION TOOLBAR
  // ==========================================

  $("addQuestionButton").onclick =
    () => newQuestion();

  $("firstQuestionButton").onclick =
    () => newQuestion();

  $("importQuestionButton").onclick = () =>
    alert(
      "Import questions will be added in a future update."
    );

  $("addTitleButton").onclick = () => {
    const title = prompt("Section heading:");

    if (!title) return;

    const question = {
      id: makeId(),
      title,
      type: "paragraph",
      options: [],
      answer: [],
      points: 0,
      required: false
    };

    form.questions.push(question);
    selectedQuestionId = question.id;

    setChanged();
    renderQuestions();
  };

  $("addImageButton").onclick = () =>
    alert("Image questions will be added later.");

  $("addVideoButton").onclick = () =>
    alert("Video questions will be added later.");

  $("addSectionButton").onclick = () =>
    alert("Multiple form sections will be added later.");

  // ==========================================
  // PREVIEW EVENTS
  // ==========================================

  $("previewForm").onclick = () => {
    renderPreview();
    $("previewDialog").showModal();
  };

  $("closePreview").onclick = () =>
    $("previewDialog").close();

  // ==========================================
  // THEME EVENTS
  // ==========================================

  $("themeButton").onclick = () =>
    $("themeDialog").showModal();

  $("closeTheme").onclick = () =>
    $("themeDialog").close();

  $$(".theme-color").forEach(button => {
    button.onclick = () => {
      form.theme = button.dataset.color;

      applyTheme();
      setChanged();

      $("themeDialog").close();
    };
  });

  // ==========================================
  // SETTINGS
  // ==========================================

  $("quizMode").onchange = event => {
    form.quizMode = event.target.checked;

    setChanged();
    renderQuestions();
  };

  $("collectNames").onchange = event => {
    form.collectNames = event.target.checked;
    setChanged();
  };

  $("limitResponses").onchange = event => {
    form.limitResponses = event.target.checked;
    setChanged();
  };

  $("confirmationMessage").oninput = event => {
    form.confirmationMessage = event.target.value;
    setChanged();
  };

  // ==========================================
  // PUBLISH EVENTS
  // ==========================================

  $("publishForm").onclick = () => {
    $("publishedLink").value =
      `${location.origin}${location.pathname}?id=${encodeURIComponent(formId)}`;

    $("publishDialog").showModal();
  };

  $("closePublish").onclick = () =>
    $("publishDialog").close();

  $("confirmPublish").onclick = publish;

  $("copyFormLink").onclick = async () => {
    const link = $("publishedLink").value;

    try {
      await navigator.clipboard.writeText(link);
      alert("Form link copied.");
    } catch {
      $("publishedLink").select();
      alert("Select and copy the link.");
    }
  };

  $("moreOptions").onclick = () =>
    alert("More form options are coming soon.");

  // ==========================================
  // START RIVERSIDE FORMS
  // ==========================================

  applyTheme();
  updateHeader();
  save();
  showTab("questions");
});
