let overlay = null;
let isTyping = false;
let isPinned = false;
let isHistoryMode = false;
let searchHistory = [];
let historyIndex = -1;
const WORKER_PASSWORD = "example_access_password"; //example access password

chrome.storage.local.get({ lazyHistory: [] }, (result) => {
  searchHistory = result.lazyHistory.map((item) => item.question);
});

function createOverlay() {
  overlay = document.createElement("div");
  overlay.id = "lazy-ai-overlay";
  overlay.innerHTML = `
    <div class="ai-box">
      <div class="ai-header">
        <span class="ai-icon">✨</span>
        <div class="input-container">
          <textarea id="ai-input" placeholder="Ask lazily..." rows="1"></textarea>
          <button id="btn-clear" title="Clear">✕</button>
        </div>
        <div class="right-controls">
          <button id="btn-history" class="icon-btn" title="History">↺</button>
          <button id="btn-pin" class="icon-btn" title="Pin">📌</button>
        </div>
      </div>
      <div id="ai-content-area">
        <div id="ai-result"></div>
        <div id="ai-history-list" style="display:none;"></div>
      </div>
      <div class="ai-footer">
        <span><b>Enter</b> to ask • <b>Esc</b> to close</span>
        <button id="btn-clear-history" style="display:none;">🗑️ Clear All</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#ai-input");
  const resultDiv = overlay.querySelector("#ai-result");
  const historyListDiv = overlay.querySelector("#ai-history-list");
  const clearBtn = overlay.querySelector("#btn-clear");
  const pinBtn = overlay.querySelector("#btn-pin");
  const historyBtn = overlay.querySelector("#btn-history");
  const clearHistBtn = overlay.querySelector("#btn-clear-history");

  const handleInput = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 150) + "px";
    if (input.value.trim().length > 0) clearBtn.classList.add("visible");
    else clearBtn.classList.remove("visible");
  };
  input.addEventListener("input", handleInput);

  clearBtn.addEventListener("click", () => {
    input.value = "";
    input.focus();
    handleInput();
  });

  function toggleHistoryView() {
    isHistoryMode = !isHistoryMode;
    if (isHistoryMode) {
      resultDiv.style.display = "none";
      historyListDiv.style.display = "block";
      clearHistBtn.style.display = "block";
      historyBtn.style.color = "#60a5fa";

      chrome.storage.local.get({ lazyHistory: [] }, (result) => {
        const history = result.lazyHistory;
        if (history.length === 0) {
          historyListDiv.innerHTML = `<div class="empty-state">No history yet.</div>`;
          return;
        }
        historyListDiv.innerHTML = history
          .map(
            (item) => `
          <div class="history-item" data-id="${item.id}">
            <div class="h-question">${item.question}</div>
            <div class="h-preview">${item.answer
              .replace(/<[^>]*>?/gm, "")
              .substring(0, 80)}...</div>
          </div>
        `
          )
          .join("");

        document.querySelectorAll(".history-item").forEach((el) => {
          el.addEventListener("click", () => {
            const item = history.find((h) => h.id == el.dataset.id);
            loadOldChat(item);
          });
        });
      });
    } else {
      resultDiv.style.display = "block";
      historyListDiv.style.display = "none";
      clearHistBtn.style.display = "none";
      historyBtn.style.color = "#71717a";
    }
  }

  function loadOldChat(item) {
    toggleHistoryView();
    input.value = item.question;
    handleInput();
    renderResult(item.answer);
  }

  historyBtn.addEventListener("click", toggleHistoryView);
  clearHistBtn.addEventListener("click", () => {
    if (confirm("Delete all history?")) {
      chrome.storage.local.set({ lazyHistory: [] });
      toggleHistoryView();
    }
  });

  pinBtn.addEventListener("click", () => {
    isPinned = !isPinned;
    pinBtn.style.color = isPinned ? "#60a5fa" : "#71717a";
    pinBtn.style.transform = isPinned ? "rotate(-45deg)" : "rotate(0deg)";
  });

  function renderResult(markdownText) {
    resultDiv.innerHTML = "";

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "result-actions";
    const copyAllBtn = document.createElement("button");
    copyAllBtn.className = "btn-copy-all";
    copyAllBtn.innerHTML = "📋 Copy Answer";
    copyAllBtn.addEventListener("click", () => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = formatMarkdown(markdownText);
      navigator.clipboard.writeText(tempDiv.innerText);
      copyAllBtn.innerHTML = "✓ Copied!";
      setTimeout(() => (copyAllBtn.innerHTML = "📋 Copy Answer"), 2000);
    });
    actionsDiv.appendChild(copyAllBtn);
    resultDiv.appendChild(actionsDiv);

    const content = document.createElement("div");
    content.className = "result-content";
    content.innerHTML = formatMarkdown(markdownText);
    resultDiv.appendChild(content);

    const blocks = content.querySelectorAll(".code-wrapper");
    blocks.forEach((wrapper) => {
      const btn = document.createElement("button");
      btn.className = "btn-copy-code";
      btn.innerText = "Copy";
      btn.addEventListener("click", () => {
        const code = wrapper.querySelector("pre").innerText;
        navigator.clipboard.writeText(code);
        btn.innerText = "Copied!";
        setTimeout(() => (btn.innerText = "Copy"), 2000);
      });
      wrapper.appendChild(btn);
    });
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();

    if (e.key === "ArrowUp" && searchHistory.length > 0) {
      e.preventDefault();
      historyIndex = Math.min(historyIndex + 1, searchHistory.length - 1);
      input.value = searchHistory[historyIndex];
      handleInput();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      historyIndex--;
      if (historyIndex >= 0) input.value = searchHistory[historyIndex];
      else input.value = "";
      handleInput();
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const question = input.value.trim();
      if (!question || isTyping) return;

      if (isHistoryMode) toggleHistoryView();
      if (searchHistory[0] !== question) searchHistory.unshift(question);
      historyIndex = -1;

      isTyping = true;
      resultDiv.innerHTML = `
        <div class="skeleton-loader">
          <div class="sk-line"></div>
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>`;

      input.value = "";
      handleInput();

      chrome.runtime.sendMessage(
        {
          action: "askAI",
          question: question,
          accessCode: WORKER_PASSWORD,
        },
        (response) => {
          isTyping = false;
          if (response && response.answer) {
            chrome.storage.local.get({ lazyHistory: [] }, (res) => {
              const newHist = [
                {
                  id: Date.now(),
                  question,
                  answer: response.answer,
                  date: new Date().toLocaleDateString(),
                },
                ...res.lazyHistory,
              ].slice(0, 50);
              chrome.storage.local.set({ lazyHistory: newHist });
            });
            renderResult(response.answer);
          } else {
            resultDiv.innerHTML = `<div class="error">Error: ${
              response?.error || "Failed"
            }</div>`;
          }
        }
      );
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay && !isPinned) close();
  });
}

function close() {
  if (!overlay) return;
  overlay.classList.remove("visible");
  setTimeout(() => {
    overlay.style.display = "none";
  }, 200);
}

function formatMarkdown(text) {
  const codeBlocks = [];
  text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
    codeBlocks.push(code.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  text = text
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h3>$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
    .replace(/^[\*-] (.*$)/gm, "<li>$1</li>")
    .replace(/\n/g, "<br>");

  text = text.replace(
    /(<li>.*<\/li><br>)+/g,
    (match) => `<ul>${match.replace(/<br>/g, "")}</ul>`
  );

  text = text.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
    return `<div class="code-wrapper"><pre>${codeBlocks[index]}</pre></div>`;
  });

  return text;
}

function toggleOverlay() {
  if (!overlay) createOverlay();
  const isVisible = overlay.style.display === "flex";
  if (isVisible) close();
  else {
    overlay.style.display = "flex";
    setTimeout(() => {
      overlay.classList.add("visible");
      overlay.querySelector("#ai-input").focus();
    }, 10);
  }
}

chrome.runtime.onMessage.addListener((req) => {
  if (req.action === "toggle") toggleOverlay();
});
