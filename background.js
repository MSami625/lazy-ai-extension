const WORKER_URL = "https://ai-extension.workers.dev"; //example worker URL

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.tabs.sendMessage(tab.id, { action: "toggle" }).catch(() => {});
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-ai") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: "toggle" }).catch(() => {});
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "askAI") {
    fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        question: request.question,
        accessCode: request.accessCode
      })
    })
    .then(res => res.json())
    .then(data => sendResponse(data))
    .catch(err => sendResponse({ error: "Network Error" }));
    return true; 
  }
});