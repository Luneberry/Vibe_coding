# AI 회의록 메모 시스템

회의 중 실시간 음성 인식과 자유로운 메모 작성을 지원하는 AI 기반 웹 애플리케이션입니다.

## 🚀 주요 기능

### 🎤 실시간 음성 인식

- **AssemblyAI 연동**: 고품질 실시간 음성-텍스트 변환
- **실시간 전사**: 말하는 즉시 텍스트로 변환
- **오디오 웨이브폼**: 시각적 음성 레벨 표시
- **자동 메모 입력**: 음성 인식 결과를 메모로 자동 추가

### 📝 메모 작성 기능

- **실시간 메모 입력**: 회의 중 빠른 메모 작성
- **텍스트 포맷팅**: 굵게, 기울임, 밑줄 스타일링
- **다양한 메모 타입**: 일반 텍스트, 목록, 체크박스, 태그
- **자동 태그 변환**: `#Action`, `#Decision`, `#Risk` 등 자동 인식
- **타임스탬프**: 각 메모에 시간 기록

### 🎨 사용자 인터페이스

- **다크/라이트 모드**: 사용자 선호에 따른 테마 전환
- **반응형 디자인**: 데스크톱과 모바일 모두 지원
- **직관적인 UI**: 클릭 한 번으로 메모 추가 및 관리
- **키보드 단축키**: 효율적인 메모 작성 지원

### 💾 데이터 관리

- **로컬 저장**: 브라우저에 안전하게 저장
- **JSON 내보내기**: 메모 데이터 백업 및 공유
- **실시간 통계**: 메모 수, 태그 수 등 실시간 표시

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useRef)
- **음성 인식**: AssemblyAI API
- **오디오 처리**: Web Audio API, MediaRecorder API
- **Storage**: LocalStorage (향후 IndexedDB로 확장 예정)

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

AssemblyAI API 키를 설정해야 음성 인식 기능을 사용할 수 있습니다.

자세한 설정 방법은 [ENV_SETUP.md](./ENV_SETUP.md) 파일을 참조하세요.

```bash
# .env.local 파일 생성
echo "ASSEMBLYAI_API_KEY=your_api_key_here" > .env.local
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 브라우저에서 확인

```
http://localhost:3000
```

## 🎯 사용 방법

### 음성 인식 사용

1. **마이크 권한 허용**: 브라우저에서 마이크 접근 권한 허용
2. **녹음 시작**: "녹음 시작" 버튼 클릭
3. **음성 입력**: 말하는 내용이 실시간으로 텍스트로 변환
4. **자동 메모 추가**: 인식된 텍스트가 메모 입력창에 자동 추가
5. **녹음 중지**: "녹음 중지" 버튼으로 음성 인식 종료

### 메모 작성

1. **텍스트 입력**: 메인 입력창에 회의 내용 작성
2. **Enter 키**: 메모 추가
3. **Ctrl + /**: 입력창에 포커스

### 포맷팅 도구

- **굵게**: 텍스트를 강조할 때 사용
- **기울임**: 중요한 내용 표시
- **밑줄**: 특별히 주목할 내용
- **목록**: 순서 없는 리스트 작성
- **체크박스**: 할 일 목록 작성
- **태그**: 카테고리별 분류

### 태그 사용법

- `#Action`: 액션 아이템
- `#Decision`: 결정 사항
- `#Risk`: 리스크 요소
- `#Important`: 중요한 내용
- `#FollowUp`: 후속 조치

### 키보드 단축키

- `Enter`: 메모 추가
- `Ctrl + /`: 입력창 포커스
- `Ctrl + B`: 굵게 (예정)
- `Ctrl + I`: 기울임 (예정)
- `Ctrl + U`: 밑줄 (예정)

## 🎨 디자인 특징

### 색상 대비

- **라이트 모드**: 밝은 배경에 어두운 텍스트
- **다크 모드**: 어두운 배경에 밝은 텍스트
- **강조 색상**: 파란색 계열로 중요한 요소 강조

### 반응형 레이아웃

- **데스크톱**: 3열 레이아웃 (메모 섹션 + 사이드바)
- **태블릿**: 2열 레이아웃
- **모바일**: 1열 레이아웃

### 접근성

- **키보드 네비게이션**: 모든 기능 키보드로 접근 가능
- **시각적 피드백**: 호버, 포커스 상태 명확히 표시
- **색상 대비**: WCAG 가이드라인 준수

## 📁 프로젝트 구조

```
├── app/
│   ├── globals.css          # 전역 스타일
│   ├── layout.tsx           # 루트 레이아웃
│   └── page.tsx             # 메인 페이지
├── components/
│   └── MemoSection.tsx      # 메모 섹션 컴포넌트
├── package.json             # 의존성 정의
├── tailwind.config.js       # Tailwind CSS 설정
├── tsconfig.json           # TypeScript 설정
└── README.md               # 프로젝트 문서
```

## 🔮 향후 계획

### 단기 목표

- [x] 실시간 STT 연동 (AssemblyAI)
- [ ] AI 자동 요약 기능
- [ ] 메모 검색 및 필터링
- [ ] 메모 템플릿 기능
- [ ] 다국어 음성 인식 지원

### 장기 목표

- [ ] 팀 협업 기능
- [ ] 클라우드 동기화
- [ ] 음성 녹음 파일 저장
- [ ] 외부 도구 연동 (Slack, Notion 등)
- [ ] 회의록 자동 생성

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 질문이나 제안이 있으시면 이슈를 생성해 주세요.

---

**Made with ❤️ for better meeting experiences**
