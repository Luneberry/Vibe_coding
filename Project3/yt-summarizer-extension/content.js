
// content.js - Extract current YouTube video info and respond to popup requests

function getVideoIdFromUrl(u) {
  try {
    const url = new URL(u);
    if (url.hostname === "youtu.be") {
      const seg = url.pathname.split("/")[1];
      return seg || null;
    }
    if (url.pathname.startsWith("/shorts/")) {
      const seg = url.pathname.split("/")[2];
      return seg || null;
    }
    return url.searchParams.get("v");
  } catch (e) {
    return null;
  }
}

function extractVideoInfo() {
  const url = location.href;
  const videoId = getVideoIdFromUrl(url);
  const title = (document.title || "").replace(/\s*- YouTube\s*$/i, "");
  return { url, videoId, title };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "GET_VIDEO_INFO") {
    sendResponse(extractVideoInfo());
    return true;
  }
});
