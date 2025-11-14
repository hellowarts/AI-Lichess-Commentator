# AI Lichess Commentator

Lichess 체스 분석 페이지에서 AI 기반 실시간 포지션 해설을 제공하는 Chrome 확장 프로그램입니다.

## 📁 프로젝트 구조

```
Chess_Project/
├── manifest.json          # Chrome 확장 프로그램 설정
├── README.md             # 프로젝트 문서
├── .gitignore           # Git 제외 파일 목록
│
├── public/              # 공개 UI 리소스
│   ├── popup.html       # 확장 프로그램 팝업 UI
│   ├── popup.js         # 팝업 로직
│   ├── options.html     # API 키 설정 페이지
│   ├── options.js       # 설정 페이지 로직
│   └── icon128.svg      # 확장 프로그램 아이콘
│
└── src/                 # 소스 코드
    ├── content.js       # 메인 진입점
    │
    ├── utils/           # 유틸리티 함수
    │   └── fenExtractor.js      # FEN 표기법 추출
    │
    ├── analysis/        # 체스 분석 모듈
    │   ├── lichessAnalyzer.js   # Lichess Stockfish 데이터 추출
    │   ├── moveEvaluator.js     # 수의 질 평가
    │   └── positionAnalyzer.js  # 통합 포지션 분석
    │
    ├── ai/              # AI 해설 생성
    │   ├── geminiClient.js      # Gemini API 클라이언트
    │   └── promptGenerator.js   # AI 프롬프트 생성
    │
    └── ui/              # 사용자 인터페이스
        ├── commentaryButton.js  # 해설 버튼 컴포넌트
        └── chatUI.js           # 채팅 인터페이스
```

## 🏗️ 아키텍처

### 모듈 설명

#### **utils/** - 유틸리티
- `fenExtractor.js`: Lichess DOM에서 FEN 표기법 추출

#### **analysis/** - 체스 분석
- `lichessAnalyzer.js`: Lichess Stockfish 평가, 최선수, 마지막 수 추출
- `moveEvaluator.js`: 수의 질 평가 (좋은 수, 부정확, 실수, 블런더)
- `positionAnalyzer.js`: 전체 포지션 분석 통합

#### **ai/** - AI 해설
- `geminiClient.js`: Google Gemini API 통신
- `promptGenerator.js`: 체스 전문 AI 프롬프트 생성

#### **ui/** - 사용자 인터페이스
- `commentaryButton.js`: 메인 버튼 및 이벤트 처리
- `chatUI.js`: 채팅 창 UI 관리

## 🚀 기능

1. **FEN 추출** (`utils/fenExtractor.js`)
   - Lichess DOM에서 여러 방법으로 FEN 표기법 추출
   - 분석 페이지, 스터디, URL 등 다양한 소스 지원

2. **Lichess Stockfish 분석** (`analysis/lichessAnalyzer.js`)
   - XPath를 사용한 정확한 평가 점수 추출
   - 메이트 표기 지원
   - 최선의 수 추출
   - 마지막 수와 이전 평가 추출

3. **수의 질 평가** (`analysis/moveEvaluator.js`)
   - Lichess 기준 평가 (좋은 수, 부정확, 실수, 블런더)
   - 턴 기반 정확한 평가 차이 계산

4. **AI 해설 생성** (`ai/`)
   - Google Gemini 2.0 Flash API 사용
   - 체스 규칙 준수 강화 프롬프트
   - 전문 그랜드마스터 스타일 해설

5. **UI** (`ui/`)
   - 플로팅 해설 버튼
   - 채팅 스타일 인터페이스
   - 반응형 디자인

## 🛠️ 개발

### 설치
```bash
# Chrome 확장 프로그램 로드
1. Chrome에서 chrome://extensions/ 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. Chess_Project 폴더 선택
```

### 수정 후 테스트
```bash
# 확장 프로그램 새로고침
chrome://extensions/ 에서 새로고침 버튼 클릭
```

### 코드 스타일
- ES6 모듈 사용 (`import/export`)
- 단일 책임 원칙 (SRP) 준수
- 명확한 함수명과 주석
- 에러 처리 포함

## 📝 주요 API

### FEN 추출
```javascript
import { getCurrentFEN } from './utils/fenExtractor.js';
const fen = getCurrentFEN();
```

### 포지션 분석
```javascript
import { analyzePosition } from './analysis/positionAnalyzer.js';
const analysis = await analyzePosition(fen);
```

### AI 해설 생성
```javascript
import { generateCommentary } from './ai/geminiClient.js';
const commentary = await generateCommentary(fen, analysis);
```

## 🔧 설정

### API 키 설정
1. 확장 프로그램 아이콘 클릭
2. "API 키 설정" 버튼 클릭
3. Google Gemini API 키 입력
4. "저장하기" 클릭

### 테스트 모드
`src/ai/geminiClient.js`에서 `TEST_API_KEY` 변수에 API 키를 직접 입력 가능 (개발용)

## 📦 배포

### 빌드 전 체크리스트
- [ ] API 키 제거 확인
- [ ] 디버그 로그 제거 확인
- [ ] manifest.json 버전 업데이트
- [ ] README.md 업데이트
- [ ] 모든 파일 테스트

### Chrome 웹 스토어 배포
```bash
# 프로젝트 압축
zip -r chess-commentator.zip Chess_Project/ -x "*.git*" -x "*.backup"
```

## 🐛 디버깅

### Chrome DevTools
```javascript
// F12 콘솔에서 확인
// 각 모듈이 독립적으로 동작하므로 개별 테스트 가능
```

## 📄 라이선스

MIT License

## 🤝 기여

Issues와 Pull Requests를 환영합니다!
