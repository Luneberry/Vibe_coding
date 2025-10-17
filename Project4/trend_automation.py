# post_trending_with_imports.py
# 기능:
# 1) download.get_trending_videos()로 인급동 50개 조회
# 2) posts_helper.generate_twitter_posts()로 "제목 + URL" 포맷 만들기
# 3) 기본 크롬 프로필로 X(트위터) 접속 → 1~10위 자동 게시 (각 3초 대기)
# Windows 전용

import os, sys, time, json, socket, subprocess, shutil
import urllib.request
from typing import Optional, List, Dict

# --- 외부 모듈에서 함수 import (파일명/함수명은 그대로 사용) ---
from download import get_trending_videos
from posts_helper import generate_twitter_posts  # import.py를 posts_helper.py로 이름 변경해 주세요

# --- Selenium ---
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, StaleElementReferenceException

REMOTE_PORT = 9222
REGION_CODE = "KR"
MAX_RESULTS = 50
POST_TOP_N = 10
POST_DELAY_SEC = 3

# -----------------------------
# 경로/도움 함수
# -----------------------------
def get_local_appdata():
    return os.environ.get("LOCALAPPDATA") or os.path.join(os.path.expanduser("~"), "AppData", "Local")

def get_chrome_profile_root():
    return os.path.join(get_local_appdata(), "Google", "Chrome")

def get_default_user_data_dir():
    return os.path.join(get_chrome_profile_root(), "User Data")

def find_chrome_exe() -> Optional[str]:
    env = os.environ.get("CHROME_EXE")
    if env and os.path.exists(env):
        return env
    candidates = [
        os.path.join(get_local_appdata(), "Google", "Chrome", "Application", "chrome.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    for name in ("chrome.exe", "chrome"):
        w = shutil.which(name)
        if w and os.path.exists(w):
            return w
    return None

def find_chromedriver_exe() -> str:
    for p in [
        os.environ.get("CHROMEDRIVER") or "",
        r"C:\WebDriver\bin\chromedriver.exe",
        r"C:\tools\chromedriver\chromedriver.exe",
        r"C:\Program Files\Google\Chrome\Application\chromedriver.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chromedriver.exe",
        "chromedriver",
    ]:
        if p and os.path.exists(p):
            return p
    return "chromedriver"

def fetch_json(url: str, timeout=0.6):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except Exception as e:
        return None, str(e)

def is_debug_port_ready(port: int, timeout_sec: float = 5.0) -> bool:
    hosts = ["127.0.0.1", "localhost", "::1"]
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        for h in hosts:
            try:
                fam = socket.AF_INET6 if ":" in h else socket.AF_INET
                with socket.socket(fam, socket.SOCK_STREAM) as s:
                    s.settimeout(0.25)
                    s.connect((h, port))
                    return True
            except Exception:
                pass
        for h in hosts:
            status, _ = fetch_json(f"http://{h}:{port}/json/version", timeout=0.6)
            if status == 200:
                return True
        time.sleep(0.2)
    return False

def attach_driver_quick(port: int) -> Optional[webdriver.Chrome]:
    os.environ.setdefault("SE_DISABLE_DRIVER_MANAGEMENT", "1")
    chosen = None
    for h in ["127.0.0.1", "localhost", "::1"]:
        status, _ = fetch_json(f"http://{h}:{port}/json/version", timeout=0.6)
        if status == 200:
            chosen = h
            break
    if not chosen:
        return None
    opts = Options()
    opts.add_experimental_option("debuggerAddress", f"{chosen}:{port}")
    drv_path = find_chromedriver_exe()
    try:
        service = Service(drv_path)
        return webdriver.Chrome(service=service, options=opts)
    except WebDriverException:
        try:
            return webdriver.Chrome(options=opts)
        except WebDriverException:
            return None

def kill_all_chrome(timeout=8) -> bool:
    subprocess.call("taskkill /F /IM chrome.exe /T >nul 2>&1", shell=True)
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            out = subprocess.check_output(['tasklist', '/FI', 'IMAGENAME eq chrome.exe'],
                                          encoding='cp949', errors='ignore')
            if 'chrome.exe' not in out.lower():
                return True
        except Exception:
            return True
        time.sleep(0.3)
    return False

def start_chrome_debug_with_default_profile(port: int) -> bool:
    chrome = find_chrome_exe()
    if not chrome or not os.path.exists(chrome):
        print("❌ Chrome 실행 파일을 찾을 수 없습니다. CHROME_EXE 환경변수를 설정하세요.")
        return False

    user_data_dir = get_default_user_data_dir()
    profile_name = "Default"

    # 기존 크롬 완전 종료(싱글톤 포워딩 방지)
    if not kill_all_chrome(timeout=8):
        print("❌ Chrome 종료 실패. 모든 창/트레이 종료 후 다시 실행하세요.")
        return False

    args = [
        chrome,
        f'--remote-debugging-port={port}',
        f'--user-data-dir={user_data_dir}',
        f'--profile-directory={profile_name}',
        '--new-window',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-session-crashed-bubble',
        '--hide-crash-restore-bubble',
        '--restore-on-startup=0',
        '--disable-restore-session-state',
        '--disable-background-mode',
        'https://x.com/home',
    ]
    try:
        subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, close_fds=False)
    except Exception as e:
        print("❌ Chrome 실행 실패:", e)
        return False

    if is_debug_port_ready(port, 6.0):
        return True
    drv = attach_driver_quick(port)
    if drv:
        drv.quit()
        return True
    return False

def ensure_driver_on_default_profile(port: int) -> Optional[webdriver.Chrome]:
    drv = attach_driver_quick(port)
    if drv:
        print("✅ 기존 디버그 세션에 연결됨")
        return drv
    print("🚀 기본 프로필로 Chrome(디버깅 모드) 실행 중...")
    if not start_chrome_debug_with_default_profile(port):
        print("❌ Chrome 실행/연결 실패")
        return None
    drv = attach_driver_quick(port)
    if drv:
        print("✅ Chrome 실행 및 연결 완료")
        return drv
    print("❌ Chrome 포트는 열린 듯하나 attach 실패")
    return None

# -----------------------------
# X(트위터) 입력/게시
# -----------------------------
def wait_ready_and_open_compose(driver, timeout=25):
    wait = WebDriverWait(driver, timeout)
    driver.get("https://x.com/compose/tweet")
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    return wait

def find_editor(driver, wait, timeout=25):
    editor = None
    for how, sel in [
        (By.CSS_SELECTOR, "div[data-testid='tweetTextarea_0']"),
        (By.CSS_SELECTOR, ".DraftEditor-root"),
    ]:
        try:
            editor = wait.until(EC.element_to_be_clickable((how, sel)))
            return editor
        except TimeoutException:
            continue
    return None

def insert_text_via_cdp(driver, editor, text: str):
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", editor)
        driver.execute_script("arguments[0].click();", editor)
    except StaleElementReferenceException:
        pass
    driver.execute_script("arguments[0].focus && arguments[0].focus();", editor)
    try:
        driver.execute_cdp_cmd("Input.insertText", {"text": text})
    except Exception:
        driver.execute_script("document.execCommand('insertText', false, arguments[0]);", text)

def _wait_enabled_tweet_button(driver, timeout=10):
    end = time.time() + timeout
    selectors = [
        "button[data-testid='tweetButtonInline'][aria-disabled='false']",
        "button[data-testid='tweetButton'][aria-disabled='false']",
        "div[data-testid='tweetButtonInline'][role='button'][aria-disabled='false']",
    ]
    while time.time() < end:
        for sel in selectors:
            btn = driver.execute_script("return document.querySelector(arguments[0])", sel)
            if btn:
                return sel
        time.sleep(0.15)
    return None

def robust_submit(driver, wait, timeout=12):
    sel = _wait_enabled_tweet_button(driver, timeout=max(2, timeout//2))
    if sel:
        btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, sel)))
        try:
            driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
            btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", btn)
        disabled = driver.execute_script("""
            const b=document.querySelector(arguments[0]);
            return b ? b.getAttribute('aria-disabled') : 'missing';
        """, sel)
        if disabled not in ("true", "missing"):
            driver.execute_script("""
                const r = arguments[0].getBoundingClientRect();
                const x = Math.floor(r.left + r.width/2);
                const y = Math.floor(r.top + r.height/2);
                const el = document.elementFromPoint(x,y);
                if (el) el.click();
            """, btn)
    else:
        # Ctrl+Enter 폴백
        try:
            driver.execute_cdp_cmd("Input.dispatchKeyEvent", {
                "type":"keyDown", "modifiers":2,
                "windowsVirtualKeyCode":13, "key":"Enter", "code":"Enter"
            })
            driver.execute_cdp_cmd("Input.dispatchKeyEvent", {
                "type":"keyUp", "modifiers":2,
                "windowsVirtualKeyCode":13, "key":"Enter", "code":"Enter"
            })
        except Exception:
            driver.execute_script("""
                const form = document.querySelector('form[method][action]') ||
                             document.querySelector('div[role=dialog] form') ||
                             document.querySelector('main form');
                if (form) form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
            """)

    def posted(d):
        exists = d.execute_script(
            "return !!document.querySelector('div[data-testid=\"tweetTextarea_0\"], .DraftEditor-root');"
        )
        toast  = d.execute_script(
            "return !!document.querySelector('div[role=\"alert\"], div[aria-live=\"polite\"]');"
        )
        disabled2 = d.execute_script("""
            const b=document.querySelector("button[data-testid='tweetButtonInline']")||
                     document.querySelector("button[data-testid='tweetButton']");
            return b? b.getAttribute('aria-disabled'): 'missing';
        """)
        return (not exists) or toast or (disabled2 == "true")

    WebDriverWait(driver, 10).until(posted)

# -----------------------------
# 메인
# -----------------------------
def main():
    # (1) 인급동 50개 즉시 조회
    api_key = ""
    if not api_key:
        print("❌ 환경변수 YOUTUBE_API_KEY 를 설정하세요.")
        sys.exit(1)

    items = get_trending_videos(api_key, region_code=REGION_CODE, max_results=MAX_RESULTS)
    print(items)
    simple_items = []
    for v in items:
        simple_items.append({
            "id": v.get("id"),
            "title": v["snippet"]["title"]
        })

    # (선택) posts_helper의 포맷 함수 재활용
    # generate_twitter_posts()는 title + URL 형태 문자열 리스트를 반환
    # 여기서는 상위 10개만 사용
    posts_all = generate_twitter_posts(items)  # items는 id/title을 포함
    posts = posts_all[:POST_TOP_N]

    # (2) 기본 프로필로 X 접속
    driver = ensure_driver_on_default_profile(REMOTE_PORT)
    if not driver:
        sys.exit(1)

    # (3) 1~10위 반복 게시(+3초 대기)
    for idx, text in enumerate(posts, start=1):
        print(f"\n[#{idx}] 포스팅: {text[:80]}{'...' if len(text)>80 else ''}")
        wait = wait_ready_and_open_compose(driver, timeout=25)

        editor = find_editor(driver, wait)
        if not editor:
            raise RuntimeError("트윗 에디터를 찾지 못했습니다. (로그인 필요?)")

        insert_text_via_cdp(driver, editor, text)
        try:
            robust_submit(driver, wait, timeout=12)
            print(f"✅ #{idx} 전송 완료")
        except Exception as e:
            print(f"❌ #{idx} 전송 실패: {e}")

        time.sleep(POST_DELAY_SEC)

    print("\n🎉 작업 완료!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n중단됨")
        sys.exit(0)
