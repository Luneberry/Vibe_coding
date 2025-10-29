# PRD v1.0 — AI 회의록 자동 생성 서비스

최종 수정일: 2025-10-19 (Asia/Seoul)  
오너: PM (당신), 협업: Eng, Design, QA, Marketing

---

## 1) 제품 개요

### 1.1 목적 (Problem & Value)

- **문제**: 회의 후 사람이 직접 회의록을 작성하면 평균 15–30분/회의가 소요되고, 누락·왜곡이 발생.
- **가치**: 음성→텍스트 변환과 자동 요약/상세 회의록을 통해 **회의록 작성 시간을 70% 이상 단축**하고, **일관된 포맷**과 **검색 가능한 기록**을 제공.

### 1.2 범위 (Scope)

- **플랫폼**: 웹 기반 (Next.js, SPA 우선)
- **초기 버전**: 단일 사용자(SSO/팀 기능 제외), 데스크톱/모바일 웹 대응
- **데이터 저장소**: 브라우저 로컬 우선(IndexedDB/LocalStorage) + 파일 내보내기 (Markdown/JSON)
- **지원 언어**: ko(기본) / en
- **AI 의존성**:
  - STT(음성→텍스트): AssemblyAI
  - 요약/회의록 생성: Gemini
- **연동**: Webhook(선언형 설정) 제공

### 1.3 대상 사용자 & 니즈

- **프로덕트/개발/디자인/세일즈/경영 기획자**: 메모/액션아이템 중심의 빠른 회의록
- **프리랜서/창업자**: 간단한 녹음→요약 자동화, 외부 툴(노션/슬랙/지라 등)로 전송
- **니즈**:
  - 클릭 1–2회로 녹음 시작/종료
  - 실시간 또는 회의 후 빠른 초안 생성
  - **메모(수동 입력) + 음성 인식 결과 병합**
  - 프롬프트 커스터마이즈(요약용, 상세 회의록용)
  - 쉬운 내보내기/웹훅 연동

---

## 2) 기능 명세 (Feature Specs)

### 2.1 음성 녹음 기능

**설명**: 브라우저에서 마이크로 녹음 → 조각 업로드(Chunk Upload) → AssemblyAI에 전송 → STT 결과 수신.

- **세부 요구사항**
  - 녹음 제어: 시작/일시정지/재개/종료
  - 녹음 품질: 16kHz mono, WAV/PCM
  - 네트워크 끊김 시 로컬 버퍼링 후 재전송
  - 실시간 캡션 옵션(초기 버전 선택: Off by default, 배치 변환 기본)
  - STT 메타데이터: 타임스탬프, 스피커 분리 옵션(가능 시 On/Off)
- **데이터 구조 (예시)**
  ```json
  {
    "meetingId": "uuid",
    "audio": {
      "chunks": [{ "idx": 0, "blobUrl": "blob:...", "durationMs": 120000 }]
    },
    "stt": {
      "status": "completed",
      "text": "...",
      "segments": [
        { "start": 1230, "end": 4560, "speaker": "A", "text": "..." }
      ]
    }
  }
  ```
- **성능/품질 지표 (MVP)**
  - 인식 지연: 파일 업로드 후 **60초 이내** 초안 텍스트
  - 실패율: STT 요청 대비 **<3%**
- **수용 기준 (Acceptance)**
  - 네트워크 중단 후 재시도로 전체 텍스트 생성 성공
  - 30분 회의(파일 30MB 내외) 처리 성공

### 2.2 메모 입력 기능

**설명**: 회의 중/후 사용자가 핵심 포인트를 텍스트로 입력. 태그/하이라이트 지원.

- **세부 요구사항**
  - 빠른 입력창(단축키 `/` 포커스)
  - 태그 `#Action`, `#Decision`, `#Risk` 자동 칩 변환
  - 타임스탬프 삽입(현재 녹음 시각 기반)
- **수용 기준**
  - 메모와 STT 결과를 **시간순으로 병합** 표시 가능
  - 메모 내 **마크다운(굵게/번호/체크박스)** 일부 지원

### 2.3 회의 데이터 관리 기능

**설명**: 로컬에 회의 단위로 저장/검색/필터/정렬/내보내기.

- **세부 요구사항**
  - 엔티티: Meeting(메타), Transcript, Notes, Summaries
  - 저장: IndexedDB (meetingId 파티션)
  - 검색: 제목/날짜/태그/참석자 키워드
  - 내보내기: Markdown(.md), JSON(.json) 다운로드
- **수용 기준**
  - 페이지 새로고침 후에도 모든 데이터 유지
  - 100건의 회의 데이터에서 **<300ms** 검색 응답

### 2.4 AI 기반 회의록/요약 생성 기능

**설명**: STT+메모를 입력으로 요약(brief) & 상세 회의록(detailed) 생성.

- **세부 요구사항**
  - 프롬프트 템플릿 2종(요약, 상세) + 사용자 커스터마이즈
  - 구조화 출력:
    - 요약: 목적, 핵심결론(3–5개), 액션아이템(담당/기한), 리스크
    - 상세: Agenda별 결정사항/논의내용/근거/오픈이슈
  - 길이 제어 옵션: Short/Medium/Long
  - 한국어 기본, 영문 선택
- **수용 기준**
  - 동일 입력에 대해 프롬프트 변경 시 결과 차이가 명확
  - 액션아이템에서 **담당자/기한 추출률 80% 이상**(규칙 기반 보정 허용)

### 2.5 설정 관리 기능 (AI 프롬프트)

**설명**: 요약용/상세 회의록용 프롬프트 템플릿을 UI에서 편집/저장/복원.

- **세부 요구사항**
  - 기본 템플릿 제공 + “기본값 복원”
  - 변수 바인딩: {{language}}, {{tone}}, {{max_points}}, {{include_speakers}}
  - 미리보기(샘플 입력으로 300자 결과 미리보기)
- **수용 기준**
  - 저장된 템플릿은 새 세션에서도 유지
  - 템플릿 syntax 오류 검사(중괄호 매칭 등)

### 2.6 데이터 외부 연동 (웹훅)

**설명**: 요약/회의록 생성 완료 시 등록된 URL로 JSON POST.

- **세부 요구사항**
  - 헤더/메서드 고정: `POST`, `Content-Type: application/json`
  - 재시도 정책: 3회(지수 백오프 2s/4s/8s)
  - 서명 옵션: HMAC-SHA256 (secret 기반) 헤더 `X-Signature`
  - 테스트 발송 버튼 및 최근 로그(성공/실패) UI
- **수용 기준**
  - 타임아웃(10s) 발생 시 재시도 수행
  - 2xx 응답 시 성공 로그 기록

---

## 3) 비기능 요구사항 (NFR)

- **보안/프라이버시**
  - 마이크 권한 명시적 동의, 녹음 중 UI 인디케이터
  - API 키(AssemblyAI/Gemini) 서버사이드 프록시를 통해 호출 (클라이언트 노출 금지)
  - 데이터는 기본 **로컬 저장**이며, 서버 저장 없음(베타)
- **성능**
  - 초기 로드 **<2.5s** (4G, mid-range)
  - 주요 상호작용 응답 **<150ms**
- **가용성**
  - 네트워크 오프라인 모드에서 녹음/메모 가능, 온라인 시 동기화
- **접근성**
  - 키보드 내비게이션, ARIA 레이블, 콘트라스트 준수

---

## 4) UX/UI 디자인 고려사항

### 4.1 레이아웃 (와이어프레임 수준)

- **헤더**
  - 좌측: 로고/앱명
  - 중앙: 현재 회의 제목(인라인 편집)
  - 우측: 기록(히스토리), 설정(⚙), 내보내기, 웹훅 로그
- **메인 영역 — 3열 가변**
  1. **녹음 패널**
     - 큰 원형 녹음 버튼(상태: Idle/Rec/Paused)
     - 레벨 미터(시각화), 타이머
     - 업로드/처리 상태 표시
  2. **실시간/완료 텍스트 패널**
     - 탭: Transcript / Notes / Merge View
     - Transcript: 시간/화자 구분 리스트
     - Notes: 메모 입력 + 태그 Chips
     - Merge: 시간순 통합 타임라인
  3. **AI 결과 패널**
     - 탭: Summary / Detailed
     - 액션아이템은 체크박스 + 담당/기한 인라인 편집

### 4.2 주요 UI 컴포넌트

- RecordButton, LevelMeter, Timer
- TranscriptList (SegmentItem)
- NotesEditor (태그 자동완성)
- MergeTimeline
- SummaryCard / DetailedDoc
- SettingsModal (프롬프트 탭, 언어/톤/길이)
- WebhookConfig & Logs
- ExportDropdown (.md, .json)
- Toast/Inline Error, Loading Skeleton

### 4.3 디자인 시스템

- **Tailwind CSS 기반 토큰화**
  - 색: primary(blue-600), success, warning, danger
  - 문단/제목 스케일, spacing scale, elevation(Shadow) 체계
- **상태 일관성**
  - 녹음 중 헤더 강조색, 버튼 애니메이션
  - 로딩/비활성 시 Skeleton/Disabled 명확화

---

## 5) 기술 스택 & 아키텍처

### 5.1 스택

- **프론트엔드**: Next.js (App Router), TypeScript, Tailwind CSS
- **오디오 처리**: WebAudio API(MediaRecorder), chunked upload
- **STT**: AssemblyAI (서버 프록시経由)
- **요약/회의록**: Google Gemini (서버 프록시経由)
- **저장**: IndexedDB (Dexie.js 권장) + LocalStorage(경량 설정)
- **웹훅**: 서버라우트 `/api/webhook/emit` (서명/재시도)
- **상태관리**: Zustand or Redux Toolkit (간단성 기준 Zustand 우선)
- **유틸**: zod(스키마), dayjs(tz), uuid, remark/markdown-it(내보내기)

### 5.2 간단 아키텍처 다이어그램 (텍스트)

```
[Browser]
  ├─ Record/Notes/Views
  ├─ IndexedDB (meetings/*)
  └─ calls → [Next.js API Routes]
                 ├─ /api/stt (AssemblyAI proxy)
                 ├─ /api/summarize (Gemini proxy)
                 └─ /api/webhook/emit (outbound)
```

### 5.3 API 계약 (초안)

**POST /api/stt**

- req: `{ meetingId, uploadUrl?, chunk?: base64 | blob, finalize?: boolean }`
- res: `{ status: "queued"|"processing"|"completed"|"error", text?, segments? }`

**POST /api/summarize**

- req: `{ meetingId, text, notes, promptSummary, promptDetailed, options:{language,tone,length} }`
- res: `{ summary:{...}, detailed:{...}, tokens:{input,output} }`

**POST /api/webhook/emit**

- req: `{ meetingId, event:"summary.completed"|"detailed.completed", payload:{...} }`
- res: `{ ok:true, deliveryId, attempts }`

### 5.4 디렉토리 구조 (제안)

```
/app
  /api/stt/route.ts
  /api/summarize/route.ts
  /api/webhook/emit/route.ts
/(components)
  RecordButton.tsx, TranscriptList.tsx, ...
/lib
  db.ts (Dexie), stt.ts, gemini.ts, webhook.ts, prompts.ts
/store
  meeting.ts (Zustand)
```

---

## 6) 프롬프트 템플릿 (초안)

**요약용 (ko)**

```
목표: 아래 회의 전사와 메모를 바탕으로 간결한 요약을 생성한다.
출력 형식:
- 목적(1문장)
- 핵심 결론 3–5개 (• 불릿)
- 액션아이템: [담당자] 할 일 — 기한(YYYY-MM-DD)
- 리스크/의사결정/차기 일정
제약: 불필요한 수식어 제거, 한국어, 400자 내외
입력:
{{transcript}}
메모:
{{notes}}
```

**상세 회의록용 (ko)**

```
목표: 회의 전체를 주제별로 구조화해 상세 회의록을 생성한다.
출력 섹션:
1) 개요(목적/참석자/일시)
2) 아젠다별 논의 요약(근거/대안/결정)
3) 액션아이템 테이블(담당/기한/상태)
4) 오픈 이슈 및 리스크
요구: 명확한 제목, 번호 매김, 중복 제거, 한국어
```

---

## 7) 품질 보증 (QA) & 테스트 케이스

### 7.1 기능 테스트 (발췌)

- **녹음/중단/재개**: 각 상태에서 UI/타이머/레벨미터 정확 표시
- **네트워크 오프라인**: 녹음/메모 가능, 온라인 전환 시 STT 요청
- **긴 오디오(>30분)**: 분할 업로드 & STT 완료
- **프롬프트 변경**: 결과 요약 포맷 차이 확인
- **웹훅 실패**: 500 응답 시 3회 재시도, 로그에 남김

### 7.2 측정 가능 지표

- 평균 회의록 생성 시간(업로드 완료→초안)
- 액션아이템 추출 정확도(샘플 세트 수동 라벨 대비)
- 웹훅 성공률 / 평균 재시도 횟수
- 클라이언트 오류율(Console+API)

---

## 8) 분석/로깅

- **이벤트 (예시)**
  - `record_start`, `record_stop`, `stt_requested`, `stt_completed`,  
    `summary_requested`, `summary_completed`, `webhook_success`, `webhook_retry`, `export_md`
- **메타**
  - duration, text_length, token_usage, latency_ms
- **프라이버시**
  - PII 최소화(참석자 이름은 로컬 DB에만)

---

## 9) 릴리즈 계획

### 9.1 MVP (2–3주 가정)

- 녹음 → STT(배치) → 요약/상세 생성 → 로컬 저장 → 내보내기 → 웹훅
- 프롬프트 편집/저장, 기본 로그 뷰

### 9.2 MLP(확장)

- 실시간 캡션
- 스피커 분리(화자 추정) 옵션
- 간단한 역할/기한 추출 보정 규칙
- 팀 공유(서버 저장/멀티 유저)

---

## 10) 리스크 & 대안

- **브라우저 권한/호환성**: Safari 녹음 제약 → 폴백 안내
- **대형 파일 업로드 실패**: 청크+재시도, 압축 옵션
- **LLM 비용/지연**: 길이 제어, 요약 2단계(추출→생성)

---

## 11) 수용 기준 총정리 (Checklist)

- [ ] 1클릭 녹음/종료 가능, 녹음 상태 명확
- [ ] 30분 오디오 처리 완료, STT 실패율 <3%
- [ ] 요약/상세 각각 규정된 포맷으로 생성
- [ ] 메모와 전사 Merge View 제공
- [ ] 프롬프트 편집/저장/미리보기 정상 동작
- [ ] 웹훅 3회 재시도 + 로그 기록
- [ ] .md/.json 내보내기 정상
- [ ] IndexedDB 영속성 보장, 100건 검색 <300ms

---

## 12) 구현 가이드 (발췌 코드 스니펫)

### 12.1 MediaRecorder 초기화

```ts
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
const chunks: Blob[] = [];
rec.ondataavailable = (e) => chunks.push(e.data);
rec.onstop = async () => {
  const blob = new Blob(chunks, { type: "audio/webm" });
  // chunked upload or direct upload
};
```

### 12.2 Zustand 스토어 (회의 상태)

```ts
type MeetingState = {
  currentId: string | null;
  transcripts: Segment[];
  notes: Note[];
  setNotes: (n: Note[]) => void;
  // ...
};
```

### 12.3 프록시 라우트 (요약)

```ts
// POST /api/summarize
export async function POST(req: Request) {
  const body = await req.json();
  // server-side: call Gemini with API key
  // return structured summary/detailed
}
```

### 12.4 웹훅 서명

```ts
import crypto from "crypto";
function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
```

---

## 13) 이해관계자 검토 & 버전 관리

- **검토 단계**: Eng(아키/보안), Design(컴포넌트/플로우), QA(시나리오), Marketing(메시지)
- **버전 관리**: `docs/prd/meeting-notes/PRD_v1.0.md` → 변경 시 Changelog 유지
- **변경 예시**: `v1.1` — 실시간 캡션 추가, 스피커 분리 옵션 추가
