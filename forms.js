
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const STORAGE_KEY = "riverside_forms_v1";
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const makeId = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));

  const params = new URLSearchParams(location.search);
  const requestedFormId = params.get("id");

  let savedForms = {};

  try {
    savedForms = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
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

  function save() {
    savedForms[formId] = form;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedForms)
      );

      $("saveStatus").textContent = "All changes saved";
    } catch {
      $("saveStatus").textContent = "Unable to save";
    }
  }

  function setChanged() {
    $("saveStatus").textContent = "Saving...";
    save();
  }

  function applyTheme() {
    document.documentElement.style.setProperty(
      "--theme",
      form.theme
    );

    const colors = {
      "#673ab7": ["#512da8", "#ede7f6", "#f0ebf8"],
      "#1a73e8": ["#1558b0", "#e8f0fe", "#edf3fe"],
      "#188038": ["#137333", "#e6f4ea", "#edf7ef"],
      "#d93025": ["#b3261e", "#fce8e6", "#fceeed"],
      "#e8710a": ["#b85c00", "#fef3e4", "#fff5e9"]
    };

    const palette = colors[form.theme] || colors["#673ab7"];

    document.documentElement.style.setProperty(
      "--theme-dark", palette[0]
    );

    document.documentElement.style.setProperty(
      "--theme-light", palette[1]
    );

    document.documentElement.style.setProperty(
      "--page-bg", palette[2]
    );
  }

  function updateHeader() {
    $("headerFormTitle").value = form.title;
    $("formTitle").value = form.title;
    $("formDescription").value = form.description;
    $("quizMode").checked = form.quizMode;
    $("collectNames").checked = form.collectNames;
    $("limitResponses").checked = form.limitResponses;

    $("confirmationMessage").value =
      form.confirmationMessage;

    $("responseCount").textContent = form.responses.length;
    $("responsesTotal").textContent = form.responses.length;

    $("publishForm").textContent =
      form.published ? "Published" : "Publish";

    document.title = `${form.title} | Riverside Forms`;
  }

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

    if (tab === "responses") renderResponses();
    if (tab === "questions") renderQuestions();
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

  function getQuestion(id) {
    return form.questions.find(q => q.id === id);
  }

  function questionOptions(q) {
    if (!["multiple", "checkbox", "dropdown"].includes(q.type)) {
      if (q.type === "paragraph") {
        return '<div class="question-placeholder">Long answer text</div>';
      }

      if (q.type === "short") {
        return '<div class="question-placeholder">Short answer text</div>';
      }

      return '<div class="question-placeholder">Response</div>';
    }

    const symbol = q.type === "checkbox" ? "□" : "◯";

    return `
      <div class="question-options">
        ${q.options.map((option, index) => `
          <div class="question-option">
            <span class="option-symbol">${symbol}</span>

            <input
              class="option-input"
              data-question="${escapeHTML(q.id)}"
              data-option-index="${index}"
              value="${escapeHTML(option)}"
              placeholder="Option ${index + 1}"
            >

            <button
              class="remove-option"
              data-remove-option="${escapeHTML(q.id)}"
              data-option-index="${index}"
              title="Remove option"
            >
              ×
            </button>
          </div>
        `).join("")}

        <button
          class="add-option-button"
          data-add-option="${escapeHTML(q.id)}"
        >
          + Add option
        </button>
      </div>
    `;
  }

  function answerKey(q) {
    if (!form.quizMode) return "";

    if (!["multiple", "checkbox", "dropdown"].includes(q.type)) {
      return `
        <div class="answer-key-panel">
          <h4>Answer key</h4>
          <p>Written answers can be reviewed manually.</p>
        </div>
      `;
    }

    return `
      <div class="answer-key-panel">
        <h4>Answer key — Select correct answer(s)</h4>

        ${q.options.map((option, index) => `
          <label>
            <input
              type="${q.type === "checkbox" ? "checkbox" : "radio"}"
              name="answer-${escapeHTML(q.id)}"
              data-answer-question="${escapeHTML(q.id)}"
              value="${index}"
              ${q.answer.includes(index) ? "checked" : ""}
            >
            ${escapeHTML(option)}
          </label>
        `).join("")}
      </div>
    `;
  }

  function renderQuestions() {
    $("emptyQuestions").hidden = form.questions.length > 0;

    $("questionsContainer").innerHTML =
      form.questions.map(q => `
        <article
          class="question-card ${
            q.id === selectedQuestionId ? "selected" : ""
          }"
          data-card="${escapeHTML(q.id)}"
        >

          <div class="question-card-top">

            <input
              class="question-title-input"
              data-question-title="${escapeHTML(q.id)}"
              value="${escapeHTML(q.title)}"
              placeholder="Question"
            >

            <select
              class="question-type-select"
              data-question-type="${escapeHTML(q.id)}"
            >
              <option value="multiple" ${q.type === "multiple" ? "selected" : ""}>
                Multiple choice
              </option>

              <option value="checkbox" ${q.type === "checkbox" ? "selected" : ""}>
                Checkboxes
              </option>

              <option value="dropdown" ${q.type === "dropdown" ? "selected" : ""}>
                Dropdown
              </option>

              <option value="short" ${q.type === "short" ? "selected" : ""}>
                Short answer
              </option>

              <option value="paragraph" ${q.type === "paragraph" ? "selected" : ""}>
                Paragraph
              </option>
            </select>

          </div>

          ${questionOptions(q)}

          ${q.id === selectedQuestionId ? answerKey(q) : ""}

          <div class="question-footer">

            ${form.quizMode ? `
              <span class="answer-key-button">
                Answer key
              </span>

              <label>
                Points
                <input
                  class="question-points"
                  type="number"
                  min="0"
                  data-points="${escapeHTML(q.id)}"
                  value="${q.points}"
                >
              </label>
            ` : ""}

            <button
              data-duplicate="${escapeHTML(q.id)}"
              title="Duplicate question"
            >
              ▣
            </button>

            <button
              data-delete="${escapeHTML(q.id)}"
              title="Delete question"
            >
              🗑
            </button>

            <label>
              Required
              <input
                type="checkbox"
                data-required="${escapeHTML(q.id)}"
                ${q.required ? "checked" : ""}
              >
            </label>

          </div>

        </article>
      `).join("");

    bindQuestionEvents();
  }

  function bindQuestionEvents() {
    $$("[data-card]").forEach(card => {
      card.addEventListener("click", event => {
        if (selectedQuestionId === card.dataset.card) return;

        selectedQuestionId = card.dataset.card;
        renderQuestions();
      });
    });

    $$("[data-question-title]").forEach(input => {
      input.addEventListener("input", () => {
        getQuestion(input.dataset.questionTitle).title = input.value;
        setChanged();
      });
    });

    $$("[data-question-type]").forEach(select => {
      select.addEventListener("change", () => {
        const q = getQuestion(select.dataset.questionType);
        q.type = select.value;
        q.answer = [];

        setChanged();
        renderQuestions();
      });
    });

    $$("[data-option-index].option-input").forEach(input => {
      input.addEventListener("input", () => {
        const q = getQuestion(input.dataset.question);
        q.options[Number(input.dataset.optionIndex)] = input.value;
        setChanged();
      });
    });

    $$("[data-add-option]").forEach(button => {
      button.onclick = () => {
        const q = getQuestion(button.dataset.addOption);
        q.options.push(`Option ${q.options.length + 1}`);
        setChanged();
        renderQuestions();
      };
    });

    $$("[data-remove-option]").forEach(button => {
      button.onclick = () => {
        const q = getQuestion(button.dataset.removeOption);
        const index = Number(button.dataset.optionIndex);

        if (q.options.length <= 1) {
          alert("A question needs at least one option.");
          return;
        }

        q.options.splice(index, 1);

        q.answer = q.answer
          .filter(a => a !== index)
          .map(a => a > index ? a - 1 : a);

        setChanged();
        renderQuestions();
      };
    });

    $$("[data-answer-question]").forEach(input => {
      input.onchange = () => {
        const q = getQuestion(input.dataset.answerQuestion);
        const index = Number(input.value);

        if (q.type === "checkbox") {
          if (input.checked) {
            if (!q.answer.includes(index)) q.answer.push(index);
          } else {
            q.answer = q.answer.filter(a => a !== index);
          }
        } else {
          q.answer = [index];
        }

        setChanged();
      };
    });

    $$("[data-points]").forEach(input => {
      input.oninput = () => {
        const q = getQuestion(input.dataset.points);
        q.points = Math.max(0, Number(input.value) || 0);
        setChanged();
      };
    });

    $$("[data-required]").forEach(input => {
      input.onchange = () => {
        getQuestion(input.dataset.required).required = input.checked;
        setChanged();
      };
    });

    $$("[data-duplicate]").forEach(button => {
      button.onclick = () => {
        const original = getQuestion(button.dataset.duplicate);
        const copy = structuredClone(original);
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
          q => q.id !== button.dataset.delete
        );

        selectedQuestionId = form.questions[0]?.id || null;

        setChanged();
        renderQuestions();
      };
    });
  }

  function renderPreview() {
    $("previewContent").innerHTML = `
      <div class="form-title-card">
        <h1>${escapeHTML(form.title)}</h1>
        <p>${escapeHTML(form.description)}</p>
      </div>

      ${form.questions.map(q => `
        <div class="preview-question">
          <h3>
            ${escapeHTML(q.title || "Untitled question")}
            ${q.required ? '<span style="color:red">*</span>' : ""}
          </h3>

          ${
            ["multiple", "checkbox", "dropdown"].includes(q.type)
              ? q.options.map(option => `
                <label>
                  <input
                    type="${q.type === "checkbox" ? "checkbox" : "radio"}"
                    name="preview-${escapeHTML(q.id)}"
                  >
                  ${escapeHTML(option)}
                </label>
              `).join("")
              : q.type === "paragraph"
                ? '<textarea placeholder="Your answer"></textarea>'
                : '<input type="text" placeholder="Your answer">'
          }
        </div>
      `).join("")}

      <p style="color:#5f6368">
        Preview mode — responses are not submitted.
      </p>
    `;
  }

  function renderResponses() {
    $("responseCount").textContent = form.responses.length;
    $("responsesTotal").textContent = form.responses.length;

    if (!form.responses.length) {
      $("responsesContent").innerHTML = `
        <div class="empty-response-state">
          <h3>No responses yet</h3>
          <p>Student responses will appear here.</p>
        </div>
      `;
      return;
    }

    $("responsesContent").innerHTML =
      form.responses.map((response, index) => `
        <div class="preview-question">
          <h3>Response ${index + 1}</h3>
          <p>${escapeHTML(response.name || "Student")}</p>
          <p>${escapeHTML(response.date || "")}</p>
        </div>
      `).join("");
  }

  function publish() {
    if (!form.questions.length) {
      alert("Add at least one question before publishing.");
      return;
    }

    form.published = true;
    setChanged();
    updateHeader();

    $("publishDialog").close();

    alert("Your Riverside Forms quiz is published!");
  }

  // TITLE AND DESCRIPTION

  $("headerFormTitle").oninput = event => {
    form.title = event.target.value;
    $("formTitle").value = form.title;
    document.title = `${form.title} | Riverside Forms`;
    setChanged();
  };

  $("formTitle").oninput = event => {
    form.title = event.target.value;
    $("headerFormTitle").value = form.title;
    document.title = `${form.title} | Riverside Forms`;
    setChanged();
  };

  $("formDescription").oninput = event => {
    form.description = event.target.value;
    setChanged();
  };

  // TABS

  $$(".form-tab").forEach(button => {
    button.onclick = () => showTab(button.dataset.tab);
  });

  $$(".response-tab").forEach(button => {
    button.onclick = () => {
      currentResponseTab = button.dataset.responseTab;

      $$(".response-tab").forEach(tab => {
        tab.classList.toggle(
          "active",
          tab === button
        );
      });

      renderResponses();
    };
  });

  // QUESTION TOOLBAR

  $("addQuestionButton").onclick = () => newQuestion();
  $("firstQuestionButton").onclick = () => newQuestion();

  $("importQuestionButton").onclick = () =>
    alert("Import questions will be added in a future update.");

  $("addTitleButton").onclick = () => {
    const title = prompt("Section heading:");

    if (title) {
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
    }
  };

  $("addImageButton").onclick = () =>
    alert("Image questions will be added later.");

  $("addVideoButton").onclick = () =>
    alert("Video questions will be added later.");

  $("addSectionButton").onclick = () =>
    alert("Multiple form sections will be added later.");

  // PREVIEW

  $("previewForm").onclick = () => {
    renderPreview();
    $("previewDialog").showModal();
  };

  $("closePreview").onclick = () =>
    $("previewDialog").close();

  // THEME

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

  // SETTINGS

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

  // PUBLISH

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

  // START

  applyTheme();
  updateHeader();
  save();
  showTab("questions");
});
