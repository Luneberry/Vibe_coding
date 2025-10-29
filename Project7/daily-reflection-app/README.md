# 🧭 Daily Reflection Automator

하루 동안 있었던 일이나 생각을 메신저처럼 입력하면, 매일 지정된 시간에 자동으로 내용을 요약하여 Notion에 업로드하는 시스템입니다.

## 📋 기능

- **메신저형 인터페이스**: 자유롭게 하루 기록을 작성
- **자동 로컬 저장**: 브라우저 localStorage에 안전하게 저장
- **다크모드 지원**: 시스템 설정에 따라 자동 전환
- **반응형 디자인**: 모바일, 태블릿, 데스크탑 모두 지원
- **n8n 연동 준비**: webhook 인터페이스 구현 (실제 연동은 n8n에서 설정)

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 2. 환경 변수 설정 (선택사항)

`.env.local` 파일을 생성하고 n8n webhook URL을 설정하세요:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
```

### 3. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어주세요.

## 📁 프로젝트 구조

```
daily-reflection-app/
├── app/                    # Next.js 앱 라우터
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지 (리다이렉트)
│   ├── setup/             # 초기 설정 페이지
│   └── chat/              # 메신저 인터페이스
├── components/            # React 컴포넌트
│   ├── setup/
│   │   └── SetupForm.tsx # 설정 입력 폼
│   └── chat/
│       ├── ChatContainer.tsx  # 채팅 컨테이너
│       ├── MessageBubble.tsx  # 메시지 말풍선
│       ├── DateDivider.tsx    # 날짜 구분선
│       └── InputBar.tsx       # 입력창
├── lib/                   # 유틸리티 함수
│   ├── storage.ts        # localStorage 관리
│   ├── api.ts            # n8n API 인터페이스
│   └── utils.ts          # 공통 유틸리티
├── types/                 # TypeScript 타입 정의
│   ├── config.ts         # 설정 타입
│   └── message.ts        # 메시지 타입
└── public/                # 정적 파일
```

## 🎯 사용 방법

### 1단계: 초기 설정

첫 방문 시 `/setup` 페이지에서 다음 정보를 입력하세요:

- **이름**: 사용자 이름
- **Notion API Key**: Notion Integration에서 발급받은 키
- **Notion Database ID**: Notion 데이터베이스 ID
- **요약 시간**: 매일 자동 요약이 실행될 시간 (예: 22:00)

### 2단계: 일상 기록

`/chat` 페이지에서 하루 동안 있었던 일이나 생각을 자유롭게 작성하세요:

- 텍스트 입력창에 내용 작성
- Enter로 전송, Shift+Enter로 줄바꿈
- 모든 메시지는 자동으로 브라우저에 저장됩니다

### 3단계: 자동 요약 (n8n 필요)

n8n 워크플로우를 설정하면:

1. 매일 지정된 시간에 자동으로 하루 기록을 요약
2. AI로 카테고리별 정리
3. Notion 데이터베이스에 자동 업로드
4. 완료 링크를 채팅에 표시

## 🔧 n8n 연동

이 프로젝트는 n8n과 연동하기 위한 인터페이스를 제공합니다:

### API 엔드포인트

1. **사용자 등록** (`/webhook/register-user`)
   - 설정 완료 시 호출
   - 사용자 정보를 n8n에 전달

2. **로그 업로드** (`/webhook/upload-log`)
   - 날짜별 메시지 로그 업로드
   - n8n에서 저장 및 처리

3. **요약 요청** (`/webhook/trigger-summary`)
   - 수동 요약 요청 시 호출
   - Notion URL 반환

자세한 n8n 설정 방법은 [PRD 문서](../Daily_Reflection_Automator_PRD.md)를 참고하세요.

## 🎨 커스터마이징

### 색상 변경

`tailwind.config.ts`에서 색상 팔레트를 수정할 수 있습니다:

```typescript
theme: {
  extend: {
    colors: {
      // 커스텀 색상 추가
    },
  },
}
```

### 폰트 변경

`app/layout.tsx`와 `tailwind.config.ts`에서 폰트를 변경할 수 있습니다.

## 📦 빌드

프로덕션 빌드:

```bash
npm run build
npm start
```

## 🛠 기술 스택

- **Next.js 15**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **localStorage**: 클라이언트 데이터 저장

## 📝 라이선스

MIT License

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

## 📧 문의

문제가 있거나 질문이 있으시면 이슈를 등록해주세요.
