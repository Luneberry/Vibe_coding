# posts_helper.py
# YouTube API 응답(원본 items)을 받아 트위터 포스트 텍스트를 생성

import json

def load_json_data(filename='trending_videos.json'):
    """로컬 JSON에서 items 로드 (옵션)."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"오류: {filename} 파일을 찾을 수 없습니다.")
        return []
    except json.JSONDecodeError:
        print(f"오류: {filename} 파일의 JSON 형식이 올바르지 않습니다.")
        return []


def _extract_video_id(video: dict) -> str:
    """
    다양한 응답 형태에서 videoId 뽑기.
    - videos.list: id = "abc123"
    - search.list: id = {"videoId": "..."}
    - playlistItems.list: snippet.resourceId.videoId
    """
    if not isinstance(video, dict):
        return "unknown"

    # 1) 가장 흔한: videos.list 결과
    vid = video.get("id")
    if isinstance(vid, str) and vid:
        return vid
    if isinstance(vid, dict):
        # search.list 등
        if "videoId" in vid and isinstance(vid["videoId"], str):
            return vid["videoId"]

    # 2) playlistItems.list 등
    snip = video.get("snippet") or {}
    rid = snip.get("resourceId") or {}
    if isinstance(rid, dict) and isinstance(rid.get("videoId"), str):
        return rid["videoId"]

    return "unknown"


def _extract_title(video: dict) -> str:
    """
    다양한 응답 형태에서 title 뽑기.
    - 우선순위: snippet.title > localized.title > (fallback) '제목 없음'
    """
    if not isinstance(video, dict):
        return "제목 없음"

    snip = video.get("snippet") or {}
    title = snip.get("title")
    if isinstance(title, str) and title.strip():
        return title.strip()

    localized = snip.get("localized") or {}
    loc_title = localized.get("title")
    if isinstance(loc_title, str) and loc_title.strip():
        return loc_title.strip()

    # 혹시 사전에 단순화된 구조(title가 최상위에 있는 경우)
    top_title = video.get("title")
    if isinstance(top_title, str) and top_title.strip():
        return top_title.strip()

    return "제목 없음"


def generate_twitter_posts(videos, top_n: int | None = None, include_rank: bool = False):
    """
    각 영상에 대한 트위터 포스팅 형식 텍스트를 생성.
    - videos: YouTube API 원본 items(list[dict]) 그대로 넣어도 됨
    - top_n: 상위 N개만 생성(옵션)
    - include_rank: "1위: 제목" 같이 순위 프리픽스 포함(옵션)

    Returns: list[str]
    """
    if not isinstance(videos, list):
        return []

    items = videos[:top_n] if (isinstance(top_n, int) and top_n > 0) else videos

    posts = []
    for i, video in enumerate(items, start=1):
        vid = _extract_video_id(video)
        title = _extract_title(video)

        # URL 생성
        url = f"https://www.youtube.com/watch?v={vid}" if vid != "unknown" else "https://www.youtube.com/"

        if include_rank:
            post = f"{i}위: {title}\n{url}"
        else:
            post = f"{title}\n{url}"

        posts.append(post)

    return posts


# (옵션) CLI 테스트용
if __name__ == "__main__":
    data = load_json_data()
    posts = generate_twitter_posts(data, top_n=10, include_rank=True)
    for p in posts:
        print(p)
        print()
