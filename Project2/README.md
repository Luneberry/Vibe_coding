# 📈 Project2: 네이버 주식 차트

Python으로 주식 데이터를 수집하고, Next.js로 캔들 차트를 시각화하는 프로젝트입니다.

---

## 1. request_to_json.py 🐍

네이버 증권 API(또는 다른 소스)로부터 주가 데이터를 가져와 `response_data.json` 파일로 저장하는 Python 스크립트입니다.

### 실행 방법

```bash
# 스크립트 실행 전, 필요한 라이브러리를 설치해주세요.
python request_to_json.py
```
*실행하면 `response_data.json` 파일이 생성되거나 업데이트됩니다.*

---

## 2. naver-stock-dual-api 💹

`response_data.json` 파일을 기반으로 주가 데이터를 캔들 차트로 예쁘게 보여주는 Next.js 웹 애플리케이션입니다.

### 실행 방법

```bash
# 폴더 이동
cd naver-stock-dual-api

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 주요 기술

*   Next.js
*   TypeScript
*   Tailwind CSS
