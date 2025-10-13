
// popup.js - UI logic and message passing to content/background
const $ = (s)=>document.querySelector(s);
const btnSummary = $("#btnSummary");
const btnTranscript = $("#btnTranscript");
const statusEl = $("#status");
const hintEl = $("#hint");
const inpWebhook = $("#inpWebhook");
const inpApiKey = $("#inpApiKey");
const btnSave = $("#btnSave");
const btnClear = $("#btnClear");

function setStatus(t) { statusEl.textContent = t || ""; }
function setBusy(b) { btnSummary.disabled = b; btnTranscript.disabled = b; }
function setHint(t) { hintEl.textContent = t || ""; }

function renderSummary(title, summary) {
  // 선택: 팝업에서 미리보기까지 보여주고 싶다면 여기에 DOM 업데이트 작성
  // 미리보기 영역이 없으면 아무것도 안 함
  const box = document.getElementById('preview');
  if (!box) return;
  box.innerHTML = `
    <h3 style="margin:8px 0;">${(title||'').replace(/</g,'&lt;')}</h3>
    <div style="white-space:pre-wrap;line-height:1.5">${(summary||'').replace(/</g,'&lt;')}</div>
  `;
}

function isYouTubeUrl(u){
  try {
    const url = new URL(u);
    return ["www.youtube.com","youtube.com","youtu.be","m.youtube.com"].includes(url.hostname);
  } catch(e){ return false; }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function getVideoInfoViaContent(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "GET_VIDEO_INFO" }, (resp) => {
      resolve(resp || {});
    });
  });
}

function sanitizeFilename(name){
  return (name || "youtube")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

async function init() {
  // Load settings
  const { webhookBase, apiKey } = await chrome.storage.sync.get(["webhookBase", "apiKey"]);
  if (webhookBase) inpWebhook.value = webhookBase;
  if (apiKey) inpApiKey.value = apiKey;

  const tab = await getActiveTab();
  if (!tab) { setHint("현재 탭을 찾을 수 없습니다."); setBusy(true); return; }
  const url = tab.url || "";
  if (!isYouTubeUrl(url)) {
    setHint("유튜브 동영상 페이지에서 동작합니다.");
    setBusy(true);
    return;
  }

  setHint("유튜브 페이지 감지됨.");
}

btnSave.addEventListener("click", async () => {
  await chrome.storage.sync.set({ webhookBase: inpWebhook.value.trim(), apiKey: inpApiKey.value.trim() });
  setStatus("✅ 설정 저장됨");
  setTimeout(()=>setStatus(""), 1500);
});

btnClear.addEventListener("click", async () => {
  await chrome.storage.sync.remove(["webhookBase","apiKey"]);
  inpWebhook.value = "";
  inpApiKey.value = "";
  setStatus("🧹 설정 초기화됨");
  setTimeout(()=>setStatus(""), 1500);
});

btnSummary.addEventListener("click", async () => {
  setBusy(true); setStatus("요약 생성 중...");
  try {
    const tab = await getActiveTab();
    const info = await getVideoInfoViaContent(tab.id);
    if (!info || !info.videoId) { setStatus("유튜브 동영상이 감지되지 않았습니다."); return; }

    const payload = { url: info.url, videoId: info.videoId, title: info.title };

    // ✅ 백그라운드에 처리 위임
    const resp = await chrome.runtime.sendMessage({ type: "FETCH_SUMMARY", payload });
    if (!resp || !resp.ok) throw new Error(resp?.error || "요약 실패");

    setStatus("✅ 요약 창을 열었습니다.");
    renderSummary(resp.data.title, resp.data.summary);
  } catch (e) {
    setStatus("오류: " + (e.message || e));
  } finally {
    setBusy(false);
  }
});

btnTranscript.addEventListener("click", async () => {
  setBusy(true); setStatus("스크립트 요청 중...");
  try {
    const tab = await getActiveTab();
    const info = await getVideoInfoViaContent(tab.id);
    if (!info || !info.videoId) { setStatus("유튜브 동영상이 감지되지 않았습니다."); return; }
    const payload = { url: info.url, videoId: info.videoId, title: sanitizeFilename(info.title) };
    const resp = await chrome.runtime.sendMessage({ type: "FETCH_TRANSCRIPT", payload });
    if (!resp || !resp.ok) { throw new Error(resp?.error || "스크립트 실패"); }
    setStatus("✅ 다운로드 시작");
  } catch (e) {
    setStatus("오류: " + (e.message || e));
  } finally {
    setBusy(false);
  }
});

document.addEventListener("DOMContentLoaded", init);
