# Privacy Policy & Terms of Use

**Last Updated:** January 2026

Lazy AI operates on a **"Zero-Knowledge"** architecture. We believe your data belongs to you.

## 1. No Data Collection
**We do not collect, store, or share your personal data.**
* **No Servers:** We do not operate a database or analytics server.
* **No Tracking:** We do not track your IP address, browsing history, or usage patterns.

## 2. Where Your Data Lives
* **Chat History:** Stored exclusively in your browser's local storage (`chrome.storage.local`). This data never leaves your device unless you manually delete it or uninstall the extension.
* **API Keys:** Stored in your personal Cloudflare Worker (encrypted by Cloudflare). They are never exposed to the client-side code.

## 3. Third-Party Data Processing
* **Google Gemini API:** Your prompts are sent to Google's API for processing. Please refer to [Google's Generative AI Terms](https://policies.google.com/terms) regarding how API data is handled.
* **Cloudflare:** Your requests pass through Cloudflare Workers. Cloudflare acts as a secure tunnel and does not persist your chat data.

## 4. Security Warning
* **Local Storage:** Your history is stored unencrypted on your local hard drive. While it is isolated from other websites by Chrome's security sandbox, it is accessible to anyone with physical access to your unlocked computer.
* **Self-Hosting:** You are responsible for keeping your Cloudflare Worker URL and password secret.

## 5. User Responsibility & Compliance
This software is a client-side interface provided for educational and productivity purposes.
* **API Usage:** Users are strictly responsible for adhering to Google's Terms of Service regarding API quotas and usage policies.
* **Liability:** The developer of this software assumes no liability for API bans, account suspensions, or costs incurred due to misuse of the load-balancing features.

**By using this software, you agree to these terms.**