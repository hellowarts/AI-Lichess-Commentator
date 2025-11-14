// Popup 스크립트
document.addEventListener('DOMContentLoaded', function() {
  const apiStatus = document.getElementById('apiStatus');
  const settingsBtn = document.getElementById('settingsBtn');
  const helpBtn = document.getElementById('helpBtn');
  
  // API 키 상태 확인
  chrome.storage.sync.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiStatus.textContent = '설정됨';
      apiStatus.className = 'badge success';
    } else {
      apiStatus.textContent = '미설정';
      apiStatus.className = 'badge error';
    }
  });
  
  // 설정 페이지 열기
  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // 도움말 표시
  helpBtn.addEventListener('click', function() {
    alert(`🎮 사용 방법

1. Lichess 분석 페이지 접속
   (https://lichess.org/analysis)

2. 우측 하단의 "🤖 AI 해설 보기" 버튼 클릭

3. Stockfish가 포지션을 분석합니다 (3-5초)

4. Gemini AI가 해설을 생성합니다

5. Alert 팝업으로 결과 확인!

💡 팁:
- API 키가 설정되지 않았다면 먼저 설정해주세요
- 콘솔(F12)에서 상세 로그를 확인할 수 있습니다`);
  });
});
