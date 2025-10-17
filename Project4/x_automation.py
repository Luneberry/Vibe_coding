# x_automation.py
# Windows 전용. A모드(무중단, 전용 user-data-dir) 기본.
# 최초 1회 로그인만 하면 이후 자동 로그인 유지.

import urllib.request, json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, WebDriverException
from selenium.webdriver.chrome.service import Service

import os, sys, time, json as json2, socket, subprocess, shutil, urllib.request
import winreg

# ========= 설정 =========
REMOTE_PORT = 9222
USE_MODE_A = True  # True: A모드(전용 user-data-dir, 기존 창 유지), False: B모드(기존 프로필 강제, 모든 크롬 종료 필요)

# A모드용 전용 user-data-dir (Default가 아닌 완전히 새로운 디렉토리)
AUTO_USER_DATA_DIR_NAME = "UserData_Automation"  # %LOCALAPPDATA%\Google\Chrome\{이_폴더}
AUTO_PROFILE_NAME = "Default"                    # 전용 디렉토리 내 기본 프로필

# B모드용 (기존 User Data + 프로필 이름)
BASE_PROFILE_NAME = "Default"  # "Profile 1" 등으로 교체 가능

# (선택) chromedriver 경로(지정하면 attach 속도 빨라짐)
CHROMEDRIVER_CANDIDATES = [
    os.environ.get("CHROMEDRIVER") or "",
    r"C:\WebDriver\bin\chromedriver.exe",
    r"C:\tools\chromedriver\chromedriver.exe",
    r"C:\Program Files\Google\Chrome\Application\chromedriver.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chromedriver.exe",
    "chromedriver",  # PATH
]

# ========= 유틸 =========
def get_local_appdata():
    return os.environ.get("LOCALAPPDATA") or os.path.join(os.path.expanduser("~"), "AppData", "Local")

def get_chrome_profile_root():
    return os.path.join(get_local_appdata(), "Google", "Chrome")

def get_default_user_data_dir():
    return os.path.join(get_chrome_profile_root(), "User Data")

def get_automation_user_data_dir():
    # A모드에서 *기존 User Data와 물리적으로 다른* 디렉토리 사용 → 싱글톤 포워딩 차단
    return os.path.join(get_chrome_profile_root(), AUTO_USER_DATA_DIR_NAME)

def find_chrome_exe():
    # 0) 환경변수
    env = os.environ.get("CHROME_EXE")
    if env and os.path.exists(env):
        return env

    # 1) 레지스트리 App Paths\chrome.exe
    for hive, subkey in [
        (winreg.HKEY_CURRENT_USER,  r"Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"),
        (winreg.HKEY_LOCAL_MACHINE, r"Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"),
    ]:
        try:
            with winreg.OpenKey(hive, subkey) as k:
                val, _ = winreg.QueryValueEx(k, None)
                if val and os.path.exists(val):
                    return val
        except OSError:
            pass

    # 2) 흔한 설치 경로
    candidates = [
        os.path.join(get_local_appdata(), "Google", "Chrome", "Application", "chrome.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.join(get_local_appdata(), "Google", "Chrome SxS", "Application", "chrome.exe"),  # Canary
    ]
    for p in candidates:
        if os.path.exists(p):
            return p

    # 3) PATH
    for name in ("chrome.exe", "chrome"):
        w = shutil.which(name)
        if w and os.path.exists(w):
            return w

    return None

def find_chromedriver_exe():
    for p in CHROMEDRIVER_CANDIDATES:
        if p and os.path.exists(p):
            return p
    return "chromedriver"

def ensure_dir(p):
    os.makedirs(p, exist_ok=True)

def fetch_json(url: str, timeout=0.6):
    """URL을 GET해서 (status, text) 반환. 실패 시 (None, 오류문자열)."""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            body = r.read()
            return r.status, body.decode("utf-8", "ignore")
    except Exception as e:
        return None, str(e)

def mark_profile_clean(user_data_dir: str, profile_name: str):
    # 복구 버블 예방용 플래그
    prefs = os.path.join(user_data_dir, profile_name, "Preferences")
    local_state = os.path.join(user_data_dir, "Local State")

    def _upd(path):
        if not os.path.exists(path):
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.loads(f.read() or "{}")
            data.setdefault("profile", {})
            data["profile"]["exit_type"] = "Normal"
            data["profile"]["exited_cleanly"] = True
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    _upd(prefs)
    _upd(local_state)

def is_debug_port_ready(port: int, timeout_sec: float = 5.0) -> tuple[bool, str]:
    """
    IPv4/IPv6 소켓 연결 + /json/version HTTP 프로브로 디버그 포트 준비 여부 확인.
    항상 (ready_bool, debug_log_str) 튜플을 반환합니다.
    """
    hosts = ["127.0.0.1", "localhost", "::1"]
    deadline = time.time() + timeout_sec
    log_lines = []

    while time.time() < deadline:
        # 1) 소켓 체크
        for h in hosts:
            try:
                fam = socket.AF_INET6 if ":" in h else socket.AF_INET
                with socket.socket(fam, socket.SOCK_STREAM) as s:
                    s.settimeout(0.25)
                    s.connect((h, port))
                    log_lines.append(f"socket OK {h}:{port}")
                    return True, "\n".join(log_lines)
            except Exception as e:
                log_lines.append(f"socket fail {h}:{port} ({e})")

        # 2) HTTP /json/version 체크
        for h in hosts:
            status, resp = fetch_json(f"http://{h}:{port}/json/version", timeout=0.6)
            if status == 200:
                try:
                    jd = json.loads(resp)
                    prod = jd.get("Browser", "?")
                    ua = jd.get("User-Agent", "?")
                    log_lines.append(f"http OK {h}:{port} product={prod} ua={ua[:50]}")
                except Exception:
                    log_lines.append(f"http OK {h}:{port} raw={resp[:120]}")
                return True, "\n".join(log_lines)
            else:
                log_lines.append(f"http fail {h}:{port} ({resp})")

        time.sleep(0.2)

    return False, "\n".join(log_lines)

def http_json(url, timeout=0.8):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            if r.status == 200:
                return json.loads(r.read().decode("utf-8"))
    except Exception:
        return None
    return None

def attach_driver_quick(port: int):
    # Selenium Manager 자동 관리 비활성화 → 느린 네트워크 조회 방지
    os.environ.setdefault("SE_DISABLE_DRIVER_MANAGEMENT", "1")

    # 살아있는 호스트만 선택
    chosen = None
    for h in ["127.0.0.1", "localhost", "::1"]:
        info = http_json(f"http://{h}:{port}/json/version", timeout=0.6)
        if info:
            chosen = h
            print(f"[DBG] /json/version ok on {h}:{port} → {info.get('Browser')}")
            break
    if not chosen:
        print(f"[DBG] /json/version not reachable on port {port}")
        return None

    opts = Options()
    opts.add_experimental_option("debuggerAddress", f"{chosen}:{port}")

    drv_path = find_chromedriver_exe()
    print(f"[DBG] chromedriver path candidate: {drv_path}")

    try:
        service = Service(drv_path)
        driver = webdriver.Chrome(service=service, options=opts)
        print("[DBG] attach via Service(...) success")
        return driver
    except WebDriverException as e:
        print(f"[DBG] attach via Service failed: {e.__class__.__name__}: {e}")
        try:
            driver = webdriver.Chrome(options=opts)
            print("[DBG] attach via Selenium Manager fallback success")
            return driver
        except WebDriverException as e2:
            print(f"[DBG] attach via Selenium Manager failed: {e2.__class__.__name__}: {e2}")
            return None

# ========= Chrome 실행 =========
def start_chrome_debug(user_data_dir: str, profile_name: str, port: int) -> bool:
    chrome = find_chrome_exe()
    print(f"[DBG] chrome exe = {chrome}")
    if not chrome or not os.path.exists(chrome):
        print("❌ chrome.exe 경로를 찾지 못했습니다. CHROME_EXE 환경변수를 지정하세요.")
        return False

    os.makedirs(user_data_dir, exist_ok=True)
    mark_profile_clean(user_data_dir, profile_name)

    # ❗ 리스트로 줄 땐 chrome 경로에 절대 따옴표 넣지 마세요.
    args = [
        chrome,  # NO quotes here
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

    print("[DBG] launching Chrome with args:")
    for a in args:
        print("     ", a)

    try:
        # close_fds=False: Windows에서 FD 상속 관련 PermissionError 회피에 도움될 때가 있음
        subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, close_fds=False)
    except PermissionError as e:
        print(f"[DBG] PermissionError on Popen(list): {e}")
        # ⚠️ 일부 환경에서는 shell=True + 전체 커맨드 문자열이 더 잘 동작
        cmd = " ".join(
            [f'"{args[0]}"'] + [ (a if " " not in a else f'"{a}"') for a in args[1:] ]
        )
        print("[DBG] fallback with shell=True cmd:")
        print("     ", cmd)
        subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    except FileNotFoundError as e:
        print(f"[DBG] FileNotFoundError: {e}")
        return False

    # 디버그 포트 확인
    ready, log = is_debug_port_ready(port, 6.0)
    print("[DBG] port readiness check:\n" + log)
    if ready:
        return True

    # attach로 재확인
    drv = attach_driver_quick(port)
    if drv:
        drv.quit()
        return True
    return False

def ensure_chrome_and_attach_A_mode() -> webdriver.Chrome | None:
    """
    A모드: 기존 Chrome을 건드리지 않고, 완전히 분리된 user-data-dir로 디버그 모드 실행 후 attach
    """
    user_data_dir = get_automation_user_data_dir()
    profile_name = AUTO_PROFILE_NAME

    print(f"[DBG] MODE=A (no-kill, isolated user-data-dir)")
    print(f"[DBG] user_data_dir = {user_data_dir}")
    print(f"[DBG] profile_name  = {profile_name}")
    print(f"[DBG] port          = {REMOTE_PORT}")

    # 0) 이미 떠 있으면 바로 attach 시도
    driver = attach_driver_quick(REMOTE_PORT)
    if driver:
        print("✅ 기존 디버그 세션에 attach 성공")
        return driver

    # 1) 디버그 모드로 새 실행
    started = start_chrome_debug(user_data_dir, profile_name, REMOTE_PORT)
    if not started:
        # 그래도 한 번 더 attach 시도 (타이밍 이슈 방지)
        driver = attach_driver_quick(REMOTE_PORT)
        if driver:
            print("✅ Chrome 실행 확인(attach 성공)")
            return driver
        print("❌ Chrome 실행/연결 실패 (attach 불가)")
        return None

    # 2) attach
    driver = attach_driver_quick(REMOTE_PORT)
    if driver:
        print("✅ Chrome 실행 및 연결 완료")
        return driver

    print("❌ Chrome 포트는 열린 듯하나 attach 실패")
    return None

# ========= 게시(트윗) 버튼 클릭 유틸(튼튼 버전) =========
def _wait_enabled_tweet_button(driver, timeout=10):
    """
    aria-disabled='false' 인 트윗 버튼을 찾아 CSS 셀렉터 문자열로 반환.
    다양한 셀렉터를 돌며 활성 상태를 기다린다.
    """
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

def _click_tweet_button_robust(driver, wait, timeout=12):
    """
    1) 활성 버튼을 기다려 클릭(일반/JS/elementFromPoint 보강)
    2) 그래도 안 되면 Ctrl+Enter 단축키로 전송
    3) 전송 완료 신호 대기
    """
    sel = _wait_enabled_tweet_button(driver, timeout=max(2, timeout//2))
    if sel:
        btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, sel)))
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
        time.sleep(0.1)
        try:
            btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", btn)

        # 클릭 후 즉시 비활성/소실 확인
        disabled = driver.execute_script("""
            const b=document.querySelector(arguments[0]);
            return b ? b.getAttribute('aria-disabled') : 'missing';
        """, sel)
        if disabled not in ("true", "missing"):
            # 화면 겹침 가능 → 중앙 좌표 elementFromPoint로 최후 보강 클릭
            driver.execute_script("""
                const r = arguments[0].getBoundingClientRect();
                const x = Math.floor(r.left + r.width/2);
                const y = Math.floor(r.top + r.height/2);
                const el = document.elementFromPoint(x,y);
                if (el) el.click();
            """, btn)
    else:
        # 버튼이 끝내 활성화 안 됨 → 단축키로 전송 시도
        try:
            # Ctrl+Enter (Windows/Linux)
            driver.execute_cdp_cmd("Input.dispatchKeyEvent", {
                "type":"keyDown", "modifiers":2,
                "windowsVirtualKeyCode":13, "key":"Enter", "code":"Enter"
            })
            driver.execute_cdp_cmd("Input.dispatchKeyEvent", {
                "type":"keyUp", "modifiers":2,
                "windowsVirtualKeyCode":13, "key":"Enter", "code":"Enter"
            })
        except Exception:
            # 키 이벤트 막히면 submit 유사 이벤트
            driver.execute_script("""
                const form = document.querySelector('form[method][action]') ||
                             document.querySelector('div[role=dialog] form') ||
                             document.querySelector('main form');
                if (form) form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
            """)

    # 전송 완료 신호 대기 (컴포저 닫힘/토스트/버튼 재비활성)
    def posted(d):
        exists = d.execute_script(
            "return !!document.querySelector('div[data-testid=\"tweetTextarea_0\"], .DraftEditor-root');"
        )
        toast  = d.execute_script(
            "return !!document.querySelector('div[role=\"alert\"], div[aria-live=\"polite\"]');"
        )
        disabled = d.execute_script("""
            const b=document.querySelector("button[data-testid='tweetButtonInline']")||
                     document.querySelector("button[data-testid='tweetButton']");
            return b? b.getAttribute('aria-disabled'): 'missing';
        """)
        return (not exists) or toast or (disabled == "true")

    try:
        WebDriverWait(driver, 10).until(posted)
    except TimeoutException:
        aria = driver.execute_script("""
            const b=document.querySelector("button[data-testid='tweetButtonInline']")||
                     document.querySelector("button[data-testid='tweetButton']");
            return b? b.getAttribute('aria-disabled'): 'missing';
        """)
        raise TimeoutException(f"게시 클릭/단축키 후 확인 타임아웃 (aria-disabled={aria}).")

# ========= 트윗 플로우 =========
def tweet_flow(driver, text="자동화 테스트: 안녕하세요 👋", timeout=25):
    wait = WebDriverWait(driver, timeout)
    print("[DBG] opening compose page...")
    driver.get("https://x.com/compose/tweet")

    print("[DBG] waiting for document.readyState=='complete' ...")
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")

    print("[DBG] locating editor...")
    editor = None
    for how, sel in [
        (By.CSS_SELECTOR, "div[data-testid='tweetTextarea_0']"),
        (By.CSS_SELECTOR, ".DraftEditor-root"),
    ]:
        try:
            editor = wait.until(EC.element_to_be_clickable((how, sel)))
            print(f"[DBG] editor found by {sel}")
            break
        except TimeoutException:
            pass
    if not editor:
        if "login" in driver.current_url:
            raise RuntimeError("로그인 페이지로 이동됨. 한 번 로그인 후 재시도하세요.")
        raise TimeoutException("트윗 에디터를 찾을 수 없습니다.")

    print("[DBG] clicking editor...")
    # 오버레이/포커스 문제 방지용 JS 클릭
    try:
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", editor)
        driver.execute_script("arguments[0].click();", editor)
    except StaleElementReferenceException:
        editor = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div[data-testid='tweetTextarea_0']")))
        driver.execute_script("arguments[0].click();", editor)

    time.sleep(1)

    # === 이 부분이 핵심: send_keys 대신 CDP로 이모지 포함 텍스트 입력 ===
    print(f"[DBG] typing text via CDP: {repr(text)}")
    try:
        driver.execute_script("arguments[0].focus && arguments[0].focus();", editor)
        driver.execute_cdp_cmd("Input.insertText", {"text": text})
    except Exception as e:
        print(f"[DBG] CDP insertText failed: {e}. Fallback to execCommand('insertText').")
        driver.execute_script("document.execCommand('insertText', false, arguments[0]);", text)

    time.sleep(1)

    # 🔽 게시 시도 (튼튼 버전)
    print("[DBG] trying to submit (button or Ctrl+Enter fallback)...")
    _click_tweet_button_robust(driver, wait, timeout=12)

    print("✅ 트윗 전송 완료")

# ========= 메인 =========
def main():
    print(f"[DBG] Python: {sys.version.split()[0]}, Selenium version: try/see runtime, Port={REMOTE_PORT}")
    if USE_MODE_A:
        print("🟢 MODE A: 전용 user-data-dir 사용 (기존 창 유지, 최초 1회 로그인 필요)")
        driver = ensure_chrome_and_attach_A_mode()
    else:
        print("🔴 MODE B: 기존 User Data + 프로필 사용 (모든 크롬 종료 필요)")
        print("    ※ 본 스크립트는 A모드용으로 최적화되어 있습니다. B모드는 별도 구현을 권장합니다.")
        return

    if not driver:
        print("❌ 실행/연결 실패: attach 불가")
        sys.exit(1)

    print("🔗 Selenium 연결됨 → tweet_flow 실행")
    tweet_flow(driver, "트위터 자동화 테스트 👋")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n중단됨")
        sys.exit(0)
