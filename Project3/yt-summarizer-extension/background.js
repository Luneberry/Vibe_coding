
// background.js - MV3 Service Worker

async function getSettings() {
  const { webhookBase, apiKey } = await chrome.storage.sync.get(["webhookBase", "apiKey"]);
  return { webhookBase, apiKey };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function postJson(endpoint, body, { retries = 3, timeoutMs = 20000 } = {}) {
  const { webhookBase, apiKey } = await getSettings();
  if (!webhookBase) throw new Error("WEBHOOK_BASE_NOT_SET");
  const url = `${webhookBase.replace(/\/+$/,"")}${endpoint}`;
  let lastErr;
  for (let i=0;i<=retries;i++) {
    const controller = new AbortController();
    const t = setTimeout(()=>controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(t);
      console.log("[Webhook Response status]", res.status, "content-type:", res.headers.get("content-type"));

      const text = await res.text();

      // Retry on 429/5xx
      if (!res.ok) {
        if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
          lastErr = new Error(`HTTP_${res.status}`);
          await sleep(400 * Math.pow(2, i)); // backoff
          continue;
        }
        throw new Error(`HTTP_${res.status}`);
      }

      if (!text || !text.trim()) {
        if (i < retries) {
          await sleep(600 * Math.pow(2, i));
          continue;
        }
        throw new Error("EMPTY_RESPONSE_BODY");
      }

      try {
        let parsed = JSON.parse(text);
        // ✅ n8n Respond가 배열([ {...} ])로 반환하는 경우 대비
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) throw new Error("EMPTY_ARRAY_RESPONSE");
          parsed = parsed[0];
        }
        return parsed;
      } catch {
        throw new Error("INVALID_JSON_RESPONSE");
      }

    } catch (e) {
      clearTimeout(t);
      lastErr = e;
      // Retry only on abort/network
      if (i < retries) await sleep(400 * Math.pow(2, i));
    }
  }
  throw lastErr || new Error("REQUEST_FAILED");
}

function makeKey(prefix="summary") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async ()=>{
    try {
      if (msg?.type === "FETCH_SUMMARY") {
        const body = {
          ...msg.payload,
          options: { language_pref: "ko", include_timestamps: true, max_summary_tokens: 1200 },
          client: { ext_version: "1.0.0", platform: "chrome" }
        };
        const data = await postJson("/summarize", body,  { timeoutMs: 120000, retries: 4 });
        if (!data?.ok) throw new Error(data?.error?.code || "SUMMARY_FAILED");

        const key = makeKey("summary");
        await chrome.storage.local.set({ [key]: data });
        const pageUrl = chrome.runtime.getURL(`views/summary.html#${encodeURIComponent(key)}`);
        await chrome.windows.create({
          url: pageUrl,
          type: "popup",
          width: 780,
          height: 900,
          focused: true
        });
        sendResponse({ 
          ok: true, 
          data: {
            title: data.title ?? data?.data?.title ?? "",
            summary: data.summary ?? data?.data?.summary ?? ""
          }
        });
        return;
      }

      if (msg?.type === "FETCH_TRANSCRIPT") {
        const body = {
          ...msg.payload,
          options: { language_pref: "ko" },
          client: { ext_version: "1.0.0", platform: "chrome" }
        };
        const data = await postJson("/transcript", body, { timeoutMs: 30000 });
        if (!data?.ok) throw new Error(data?.error?.code || "TRANSCRIPT_FAILED");

        const tr = data.transcript || {};
        const title = (msg.payload?.title || "youtube").replace(/[\\/:*?"<>|]+/g, "_");
        const langPair = tr?.bilingual ? `${tr.primary_language || "en"}-ko` : (tr?.primary_language || "ko");
        const filename = tr?.file?.filename
          || `${title}__script__${langPair}__${new Date().toISOString().slice(0,16).replace(/[-:T]/g,"")}.txt`;

        if (tr?.file?.file_url) {
          await chrome.downloads.download({ url: tr.file.file_url, filename, saveAs: false });
        } else if (typeof tr?.content === "string") {
          const blob = new Blob([tr.content], { type: "text/plain;charset=utf-8" });
          const dl = URL.createObjectURL(blob);
          await chrome.downloads.download({ url: dl, filename, saveAs: false });
        } else {
          throw new Error("NO_FILE_CONTENT");
        }

        sendResponse({ ok: true });
        return;
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true; // keep channel open for async
});
