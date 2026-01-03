# Privacy Policy for Lazy AI

**Last Updated:** 03/01/2026

We believe privacy is a fundamental right, not a feature. Lazy AI is designed with a **"Zero-Knowledge"** architecture.

## 1. Data Collection
**We do not collect, store, or share your personal data.**
* We have no servers, no databases, and no analytics trackers.
* We do not know who you are, what you ask, or what websites you visit.

## 2. Where Your Data Lives
* **Chat History:** Stored exclusively in your browser's local storage (`chrome.storage.local`). This data never leaves your device unless you manually delete it or uninstall the extension.
* **API Requests:** Your questions are sent directly from your browser to *your own personal* Cloudflare Worker. They are then forwarded to Google's Gemini API for processing.

## 3. Third-Party Services
* **Google Gemini API:** Your prompts are processed by Google's API. Please refer to [Google's Generative AI Terms of Service](https://policies.google.com/terms) regarding how they handle API data (typically, API data is not used to train models in the same way as consumer ChatGPT/Gemini web chats).
* **Cloudflare Workers:** Your backend logic runs on Cloudflare's serverless platform. Cloudflare processes the request but does not persistently store the content of your chats.

## 4. Security
* **API Keys:** Your Google API keys are stored in your Cloudflare Worker's environment variables. They are **never** exposed to the browser client or the extension code.
* **Access Control:** The extension communicates with your Worker using a user-defined secret password.

## 5. Changes
Since this project is open source, you can inspect every line of code to verify these claims. If you fork or modify this project, you are responsible for your own privacy practices.