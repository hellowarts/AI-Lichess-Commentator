# AI Lichess Commentator

Lichess 분석 페이지에서 AI 기반 체스 해설을 제공하는 Chrome 확장 프로그램입니다.

## 개요

이 확장 프로그램은 Lichess 분석 페이지에 AI 해설 버튼을 추가합니다. 버튼을 클릭하면 현재 보드 포지션을 추출하고, Lichess의 Stockfish 엔진으로 분석한 후, Google Gemini 2.0 Flash 모델을 사용하여 전문가 수준의 해설을 생성합니다.

## 주요 기능

- Lichess Stockfish를 활용한 실시간 포지션 분석
- 그랜드마스터 수준의 AI 해설 생성 (한국어)
- 수의 질 평가 (좋은 수, 부정확한 수, 실수, 블런더)
- Stockfish 최선수 제안

## 설치 방법

1. 이 저장소를 클론합니다
2. Chrome에서 `chrome://extensions/` 접속
3. 우측 상단의 "개발자 모드" 활성화
4. "압축해제된 확장 프로그램을 로드합니다" 클릭 후 프로젝트 폴더 선택
5. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 Gemini API 키 발급
6. 확장 프로그램 아이콘 클릭하여 API 키 설정

## 프로젝트 구조

```
Chess_Project/
├── manifest.json      # Chrome 확장 프로그램 설정
├── content.js         # 메인 콘텐츠 스크립트 (모든 기능 포함)
├── public/
│   ├── popup.html     # 확장 프로그램 팝업 UI
│   ├── popup.js       # 팝업 로직
│   ├── options.html   # API 키 설정 페이지
│   ├── options.js     # 설정 페이지 로직
│   └── icon128.svg    # 확장 프로그램 아이콘
└── README.md
```

## 동작 원리

확장 프로그램은 다음과 같이 동작합니다:

1. Lichess DOM에서 FEN 표기법 추출 (여러 방법으로 시도)
2. XPath를 통해 Lichess 분석 인터페이스에서 Stockfish 평가 데이터 읽기
3. 포지션 점수 변화를 바탕으로 수의 질 평가
4. 컨텍스트를 고려한 Gemini AI 프롬프트 생성
5. 플로팅 채팅 창에 전문 해설 표시

`content.js` 파일 내부는 기능별로 구분되어 있습니다:
- UTILS: 다양한 DOM 소스에서 FEN 추출
- ANALYSIS: Stockfish 데이터 추출, 수 평가, 포지션 분석
- AI: 프롬프트 생성 및 Gemini API 연동
- UI: 채팅 인터페이스 및 해설 버튼

## 기술 세부사항

- Lichess의 기존 Stockfish 분석 사용 (별도 엔진 불필요)
- XPath를 통한 평가 점수, 최선수, 수 기록 추출
- Lichess 수 평가 기준 적용 (정확/부정확/실수/블런더)
- Gemini API 설정: temperature 0.3, 800 tokens, topP 0.8, topK 20
- 체스 규칙 위반 방지를 위한 엄격한 프롬프트 설계

## API 설정

Google Gemini API 키가 필요하며, 두 가지 방법으로 설정할 수 있습니다:

1. 옵션 페이지에서 설정 (확장 프로그램 아이콘 클릭 → 설정)
2. 개발용: `content.js` 파일의 `TEST_API_KEY` 변수에 직접 입력 (약 433번째 줄)

API 키는 Chrome Storage Sync API를 통해 안전하게 저장됩니다.

## 개발

확장 프로그램을 수정하려면:

1. 핵심 기능 수정: `content.js` 편집
2. UI 변경: `public/` 폴더 내 파일 편집
3. `chrome://extensions/`에서 확장 프로그램 새로고침
4. Lichess 분석 페이지에서 테스트

별도의 빌드 과정 없이 표준 JavaScript를 사용하여 Chrome 콘텐츠 스크립트 환경과의 최대 호환성을 보장합니다.

## 라이선스

MIT License
