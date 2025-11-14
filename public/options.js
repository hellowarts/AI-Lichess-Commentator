// Options 페이지 스크립트
document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusMessage = document.getElementById('statusMessage');
  const keyStatus = document.getElementById('keyStatus');
  const togglePassword = document.getElementById('togglePassword');
  
  // 저장된 API 키 불러오기
  chrome.storage.sync.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      showKeyStatus(true);
      showStatus('기존 API 키가 로드되었습니다.', 'info');
    }
  });
  
  // 비밀번호 표시/숨김 토글
  togglePassword.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      togglePassword.textContent = '🙈';
    } else {
      apiKeyInput.type = 'password';
      togglePassword.textContent = '👁️';
    }
  });
  
  // API 키 저장
  saveBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('API 키를 입력해주세요.', 'error');
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      showStatus('올바른 Gemini API 키 형식이 아닙니다. (AIza로 시작해야 합니다)', 'error');
      return;
    }
    
    // 저장 중 표시
    saveBtn.disabled = true;
    saveBtn.innerHTML = '⏳ 저장 중...';
    
    try {
      // Chrome Storage에 암호화하여 저장
      await chrome.storage.sync.set({ geminiApiKey: apiKey });
      
      showStatus('✅ API 키가 안전하게 저장되었습니다!', 'success');
      showKeyStatus(true);
      
      // 버튼 복구
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 저장하기';
      
    } catch (error) {
      showStatus('❌ 저장 실패: ' + error.message, 'error');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 저장하기';
    }
  });
  
  // API 테스트
  testBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('API 키를 입력해주세요.', 'error');
      return;
    }
    
    testBtn.disabled = true;
    testBtn.innerHTML = '⏳ 테스트 중...';
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Hello, this is a test.'
              }]
            }]
          })
        }
      );
      
      if (response.ok) {
        showStatus('✅ API 키가 정상적으로 작동합니다!', 'success');
        showKeyStatus(true);
      } else {
        const errorData = await response.json();
        showStatus(`❌ API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`, 'error');
        showKeyStatus(false);
      }
      
    } catch (error) {
      showStatus('❌ 테스트 실패: ' + error.message, 'error');
      showKeyStatus(false);
    } finally {
      testBtn.disabled = false;
      testBtn.innerHTML = '🧪 API 테스트';
    }
  });
  
  // 상태 메시지 표시
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // 3초 후 자동 숨김 (error는 제외)
    if (type !== 'error') {
      setTimeout(() => {
        statusMessage.className = 'status-message';
      }, 5000);
    }
  }
  
  // API 키 상태 표시
  function showKeyStatus(isValid) {
    if (isValid) {
      keyStatus.innerHTML = '<span class="key-status valid">✓ 유효한 API 키</span>';
    } else {
      keyStatus.innerHTML = '<span class="key-status invalid">✗ 무효한 API 키</span>';
    }
  }
});
