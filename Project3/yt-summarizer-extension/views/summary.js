// ---------- 유틸 ----------
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (m)=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
}
function sectionToHtml(sec){
  const title = escapeHtml(sec.title || "");
  const content = escapeHtml(sec.content || "");
  return `
    <div class="card">
      ${title ? `<div class="section-title">${title}</div>` : ""}
      <pre>${content}</pre>
    </div>`;
}
// 다양한 응답 스키마를 정규화(전/후호환)
function normalizePayload(raw) {
  if (typeof raw?.summary === "string" || typeof raw?.title === "string") {
    return { title: raw.title || "", summaryText: raw.summary || "", sections: [], video: raw.video || null };
  }
  if (raw?.data && (typeof raw.data.summary === "string" || typeof raw.data.title === "string")) {
    return { title: raw.data.title || "", summaryText: raw.data.summary || "", sections: [], video: raw.video || null };
  }
  const sections = Array.isArray(raw?.summary?.sections) ? raw.summary.sections : [];
  if (sections.length) {
    return { title: raw?.video?.title || raw?.title || "요약", summaryText: "", sections, video: raw.video || null };
  }
  return {
    title: raw?.title || "요약",
    summaryText: typeof raw?.summary === "string" ? raw.summary : JSON.stringify(raw, null, 2),
    sections: [],
    video: raw?.video || null,
  };
}

// ---------- 글자 크기 저장/복원 ----------
const PREF_KEY_FZ = "summary_font_size";
function setRootFontSize(px){
  document.documentElement.style.setProperty("--fz", `${px}px`);
}
async function loadFontPref(){
  const got = await chrome.storage.local.get([PREF_KEY_FZ]);
  const px = Number(got[PREF_KEY_FZ]);
  if (px && px >= 14 && px <= 26) setRootFontSize(px);
}
async function saveFontPref(px){
  await chrome.storage.local.set({ [PREF_KEY_FZ]: px });
}

// ---------- 메인 ----------
async function load() {
  await loadFontPref();

  const key = decodeURIComponent(location.hash.slice(1));
  if (!key) { document.body.innerHTML = "<div class='page'><div class='card'><pre>요약 데이터를 찾지 못했습니다.(no key)</pre></div></div>"; return; }

  const got = await chrome.storage.local.get([key]);
  const raw = got[key];
  if (!raw) { document.body.innerHTML = "<div class='page'><div class='card'><pre>요약 데이터가 만료되었거나 없습니다.(no raw)</pre></div></div>"; return; }

  const norm = normalizePayload(raw);

  // 제목/메타
  const h1 = document.getElementById("title");
  h1.textContent = norm.title ? `요약: ${norm.title}` : "요약";

  const meta = document.getElementById("meta");
  const v = norm.video || {};
  const duration = v.duration_sec ? `(${Math.floor(v.duration_sec/60)}분 ${v.duration_sec%60}초)` : "";
  meta.innerHTML = [
    v.channel ? `채널: ${escapeHtml(v.channel)}` : null,
    v.videoId ? `영상: <a target="_blank" href="https://youtu.be/${encodeURIComponent(v.videoId)}">열기</a>` : null,
    duration || null
  ].filter(Boolean).join(" · ");

  // 본문
  const c = document.getElementById("container");
  c.innerHTML = "";
  if (norm.sections.length) {
    norm.sections.forEach(sec => c.insertAdjacentHTML("beforeend", sectionToHtml(sec)));
  } else {
    c.insertAdjacentHTML("beforeend", `
      <div class="card">
        <pre>${escapeHtml(norm.summaryText || "[요약 없음]")}</pre>
      </div>
    `);
  }

  // 버튼들
  const btnCopy   = document.getElementById("btnCopy");
  const btnClose  = document.getElementById("btnClose");
  const btnPlus   = document.getElementById("btnBigger");
  const btnMinus  = document.getElementById("btnSmaller");

  btnCopy.addEventListener("click", async ()=>{
    try {
      let text;
      if (norm.sections.length) {
        text = norm.sections.map(s => `## ${s.title || ""}\n${s.content || ""}`).join("\n\n");
      } else {
        text = norm.summaryText || "";
      }
      await navigator.clipboard.writeText(text || "[요약 없음]");
      btnCopy.textContent = "복사됨";
      setTimeout(()=>btnCopy.textContent = "요약 복사", 1000);
    } catch(e) {
      btnCopy.textContent = "복사 실패";
      setTimeout(()=>btnCopy.textContent = "요약 복사", 1000);
    }
  });
  btnClose.addEventListener("click", async ()=>{
    await chrome.storage.local.remove([key]);
    window.close();
  });

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function currentFz(){
    const v = getComputedStyle(document.documentElement).getPropertyValue("--fz").trim();
    const px = Number(v.replace("px","")) || 18;
    return clamp(px, 12, 28);
  }
  btnPlus.addEventListener("click", async ()=>{
    const next = clamp(currentFz()+2, 14, 26);
    setRootFontSize(next);
    await saveFontPref(next);
  });
  btnMinus.addEventListener("click", async ()=>{
    const next = clamp(currentFz()-2, 14, 26);
    setRootFontSize(next);
    await saveFontPref(next);
  });

  // 키보드 단축키: Ctrl/Cmd + +/-
  window.addEventListener("keydown", async (e)=>{
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === "+" || e.key === "=") { e.preventDefault(); btnPlus.click(); }
    if (e.key === "-")                  { e.preventDefault(); btnMinus.click(); }
  });
}

document.addEventListener("DOMContentLoaded", load);
