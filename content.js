// AI Lichess Commentator - Content Script
// 기능별로 구분된 모듈화된 코드

// ============================================
// UTILS - FEN 추출
// ============================================

function getCurrentFEN() {
  try {
    const fenInput = document.querySelector('input.copyable');
    if (fenInput && fenInput.value) {
      const fen = fenInput.value.trim();
      if (fen && fen.includes('/')) {
        return fen;
      }
    }
  } catch (e) {}
  
  try {
    const fenElement = document.querySelector('[data-fen]');
    if (fenElement) {
      const fen = fenElement.getAttribute('data-fen');
      if (fen && fen.includes('/')) {
        return fen;
      }
    }
  } catch (e) {}
  
  try {
    if (window.lichess?.study?.vm?.node?.fen) {
      return window.lichess.study.vm.node.fen;
    }
  } catch (e) {}
  
  try {
    if (window.lichess?.analysis?.node) {
      return window.lichess.analysis.node().fen;
    }
  } catch (e) {}
  
  try {
    const urlMatch = window.location.pathname.match(/\/analysis\/(.+)/);
    if (urlMatch && urlMatch[1]) {
      const fenFromUrl = decodeURIComponent(urlMatch[1]).split('?')[0];
      if (fenFromUrl.includes('/') && fenFromUrl.split('/').length >= 6) {
        return fenFromUrl;
      }
    }
  } catch (e) {}
  
  try {
    if (window.lichess?.analysis?.vm?.node?.fen) {
      return window.lichess.analysis.vm.node.fen;
    }
  } catch (e) {}
  
  return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
}

// ============================================
// ANALYSIS - Lichess Stockfish 분석 추출
// ============================================

function getLichessAnalysis(fen) {
  let score = null;
  let bestMove = null;
  let lastMove = null;
  let previousScore = null;
  
  const fenParts = fen.split(' ');
  const currentTurn = fenParts[1];
  
  extractLastMove();
  extractScore();
  extractBestMove();
  
  if (score !== null) {
    return { 
      score: Math.round(score), 
      previousScore: previousScore,
      bestMove: bestMove?.trim() || null,
      lastMove: lastMove?.trim() || null,
      source: 'Lichess Stockfish' 
    };
  }
  
  return null;
  
  function extractLastMove() {
    try {
      const activeMove = document.querySelector('move.active');
      
      if (activeMove) {
        let activeMoveText = activeMove.textContent || activeMove.innerText;
        const movePattern = /^([A-Za-z0-9x=+#]+?)([+-]\d+\.?\d*)$/;
        const match = activeMoveText.match(movePattern);
        
        if (match) {
          activeMoveText = match[1];
        }
        
        if (currentTurn === 'w') {
          lastMove = activeMoveText;
          
          const prevMove = activeMove.previousElementSibling;
          if (prevMove && prevMove.tagName.toLowerCase() === 'move') {
            let prevMoveText = prevMove.textContent || prevMove.innerText;
            const prevMatch = prevMoveText.match(movePattern);
            if (prevMatch) {
              previousScore = parseFloat(prevMatch[2]);
            }
          }
        } else {
          const prevMove = activeMove.previousElementSibling;
          if (prevMove && prevMove.tagName.toLowerCase() === 'move') {
            let prevMoveText = prevMove.textContent || prevMove.innerText;
            
            const prevMatch = prevMoveText.match(movePattern);
            if (prevMatch) {
              prevMoveText = prevMatch[1];
              previousScore = parseFloat(prevMatch[2]);
            }
            
            lastMove = prevMoveText;
          }
        }
      } else {
        const allMoves = document.querySelectorAll('move.mainline');
        if (allMoves.length > 0) {
          let lastMoveText = allMoves[allMoves.length - 1].textContent;
          
          const movePattern = /^([A-Za-z0-9x=+#]+?)([+-]\d+\.?\d*)$/;
          const match = lastMoveText.match(movePattern);
          if (match) {
            lastMoveText = match[1];
            previousScore = parseFloat(match[2]);
          }
          
          lastMove = lastMoveText;
        }
      }
    } catch (e) {}
  }
  
  function extractScore() {
    try {
      const pearlElement = document.evaluate(
        '/html/body/div[1]/main/div[3]/div[1]/pearl',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      
      if (pearlElement) {
        parseEvaluationText(pearlElement.textContent || pearlElement.innerText);
      }
    } catch (e) {}
    
    if (score === null) {
      try {
        const pearlElement = document.querySelector('pearl');
        if (pearlElement) {
          parseEvaluationText(pearlElement.textContent || pearlElement.innerText);
        }
      } catch (e) {}
    }
  }
  
  function parseEvaluationText(evalText) {
    if (evalText.includes('M') || evalText.includes('#')) {
      const mateMatch = evalText.match(/[M#]([+-]?\d+)/);
      if (mateMatch) {
        const mateIn = parseInt(mateMatch[1]);
        score = mateIn > 0 ? 10000 : -10000;
      }
    } else {
      const match = evalText.match(/([+-]?\d+\.?\d*)/);
      if (match) {
        score = parseFloat(match[1]) * 100;
      }
    }
  }
  
  function extractBestMove() {
    try {
      const moveElement = document.evaluate(
        '/html/body/div[1]/main/div[3]/div[2]/div/span[3]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      
      if (moveElement) {
        bestMove = moveElement.textContent || moveElement.innerText;
      }
    } catch (e) {}
  }
}

// ============================================
// ANALYSIS - 수의 질 평가
// ============================================

function evaluateMoveQuality(currentScore, previousScore, currentTurn) {
  if (previousScore === null || previousScore === undefined) {
    return { quality: '정보 없음', icon: '❓', description: '이전 수 평가 정보 없음' };
  }
  
  let scoreDiff;
  
  if (currentTurn === 'w') {
    scoreDiff = previousScore - currentScore;
  } else {
    scoreDiff = currentScore - previousScore;
  }
  
  if (scoreDiff >= -0.3) {
    return { 
      quality: '좋은 수', 
      icon: '✅', 
      description: '정확한 수',
      scoreDiff: scoreDiff 
    };
  } else if (scoreDiff >= -1.0) {
    return { 
      quality: '부정확한 수', 
      icon: '⚠️', 
      description: '약간의 부정확함',
      scoreDiff: scoreDiff 
    };
  } else if (scoreDiff >= -3.0) {
    return { 
      quality: '실수', 
      icon: '❌', 
      description: '명백한 실수',
      scoreDiff: scoreDiff 
    };
  } else {
    return { 
      quality: '블런더', 
      icon: '💥', 
      description: '치명적인 실수',
      scoreDiff: scoreDiff 
    };
  }
}

// ============================================
// ANALYSIS - 포지션 분석 통합
// ============================================

function analyzePosition(fen) {
  return new Promise((resolve) => {
    const lichessAnalysis = getLichessAnalysis(fen);
    
    let score;
    let bestMove;
    let lastMove;
    let previousScore;
    let moveQuality;
    let evalSource;
    
    if (lichessAnalysis) {
      score = lichessAnalysis.score;
      bestMove = lichessAnalysis.bestMove;
      lastMove = lichessAnalysis.lastMove;
      previousScore = lichessAnalysis.previousScore;
      evalSource = 'Lichess Stockfish';
      
      const fenParts = fen.split(' ');
      const currentTurn = fenParts[1];
      
      moveQuality = evaluateMoveQuality(score / 100, previousScore, currentTurn);
    } else {
      throw new Error('Lichess Stockfish 평가를 찾을 수 없습니다.\n\n분석 페이지에서 컴퓨터 분석 버튼(⚡)을 클릭하여 Stockfish를 활성화해주세요.');
    }
    
    const currentAnalysis = { score, bestMove, lastMove, previousScore, moveQuality, evalSource };
    
    setTimeout(() => {
      resolve(currentAnalysis);
    }, 300);
  });
}

// ============================================
// AI - 프롬프트 생성
// ============================================

function generatePrompt(fen, analysis) {
  const score = analysis.score;
  const absScore = Math.abs(score) / 100;
  
  const fenParts = fen.split(' ');
  const turn = fenParts[1];
  const moveNumber = fenParts[5] || '1';
  const turnText = turn === 'w' ? '백(White)' : '흑(Black)';
  const currentPlayer = turn === 'w' ? '백' : '흑';
  const opponent = turn === 'w' ? '흑' : '백';
  
  const { scoreDescription, advantage } = getScoreDescription(score, absScore);
  const bestMoveInfo = analysis.bestMove ? `\n- Stockfish 추천 최선수: ${analysis.bestMove}` : '';
  const lastMoveInfo = analysis.lastMove ? `\n- ${opponent}의 마지막 수: ${analysis.lastMove}` : '';
  const moveQualityInfo = getMoveQualityInfo(analysis);
  
  return `당신은 FIDE 그랜드마스터이자 체스 해설 전문가입니다. 반드시 체스 규칙을 정확히 준수하며 현재 보드 상태만을 분석하세요.

[절대 규칙]
금지사항:
1. FEN에 없는 기물이나 위치를 언급하지 마세요
2. 보드에 실제로 존재하지 않는 전술 패턴을 지어내지 마세요
3. 불가능한 수나 불법적인 수를 제안하지 마세요
4. 체스 표기법을 임의로 추측하거나 상상하지 마세요
5. Stockfish가 제공하지 않은 변화를 만들어내지 마세요

필수사항:
1. FEN 표기법을 정확히 해석하여 실제 보드 상태만 언급
2. 제공된 Stockfish 평가와 추천 수만 신뢰
3. 확실하지 않으면 일반적인 전략 원칙으로 설명
4. 체스 용어와 표기법을 정확하게 사용

[포지션 분석 데이터]
기본 정보:
- FEN 표기: ${fen}
- 현재 차례: ${turnText} (${moveNumber}수 진행)
- Stockfish 평가: ${scoreDescription}
- 전체 상황: ${advantage}${lastMoveInfo}${moveQualityInfo}${bestMoveInfo}

맥락:
${moveNumber > 1 && analysis.lastMove ? `- 방금 ${opponent}이 ${analysis.lastMove}을(를) 두었습니다${analysis.moveQuality ? ` (${analysis.moveQuality.quality})` : ''}` : '- 게임 시작 포지션입니다'}
- 이제 ${currentPlayer}이 응수를 생각해야 합니다

[해설 작성 가이드]
${getCommentaryGuide(moveNumber, analysis, opponent, scoreDescription, advantage, currentPlayer)}

[작성 규칙]
- 길이: 4-6문장
- 시작: "${currentPlayer}의 차례입니다."로 시작
- 어조: 전문적이고 신중하게
- 확실한 것만 언급, 추측하지 말 것
- Stockfish 평가와 제공된 수 정보만 신뢰

[전문 해설]:`;

  function getScoreDescription(score, absScore) {
    let scoreDescription;
    let advantage;
    
    if (Math.abs(score) < 50) {
      scoreDescription = '거의 균형';
      advantage = '양쪽 모두 비슷한 기회';
    } else if (score > 0) {
      if (absScore > 5) {
        scoreDescription = `백 크게 유리 (+${absScore.toFixed(1)})`;
        advantage = '백이 압도적 우위';
      } else if (absScore > 2) {
        scoreDescription = `백 유리 (+${absScore.toFixed(1)})`;
        advantage = '백이 명확한 이점';
      } else {
        scoreDescription = `백 약간 유리 (+${absScore.toFixed(1)})`;
        advantage = '백이 미세한 우세';
      }
    } else {
      if (absScore > 5) {
        scoreDescription = `흑 크게 유리 (-${absScore.toFixed(1)})`;
        advantage = '흑이 압도적 우위';
      } else if (absScore > 2) {
        scoreDescription = `흑 유리 (-${absScore.toFixed(1)})`;
        advantage = '흑이 명확한 이점';
      } else {
        scoreDescription = `흑 약간 유리 (-${absScore.toFixed(1)})`;
        advantage = '흑이 미세한 우세';
      }
    }
    
    return { scoreDescription, advantage };
  }

  function getMoveQualityInfo(analysis) {
    if (!analysis.moveQuality) return '';
    
    const scoreDiffText = analysis.moveQuality.scoreDiff !== undefined 
      ? ` - 평가 변화: ${analysis.moveQuality.scoreDiff.toFixed(2)}` 
      : '';
    
    return `\n- 마지막 수 평가: ${analysis.moveQuality.quality} (${analysis.moveQuality.description})${scoreDiffText}`;
  }

  function getCommentaryGuide(moveNumber, analysis, opponent, scoreDescription, advantage, currentPlayer) {
    const lastMoveAnalysis = moveNumber > 1 && analysis.lastMove ? `
1. 마지막 수 분석:
   - ${opponent}이 방금 둔 ${analysis.lastMove}에 대한 평가
   ${analysis.moveQuality ? `
   - 수 평가: ${analysis.moveQuality.quality}
   - 평가 변화: ${analysis.previousScore !== null && analysis.previousScore !== undefined ? `${analysis.previousScore.toFixed(2)} → ${(analysis.score/100).toFixed(2)}` : '정보 없음'}
   ${analysis.moveQuality.quality === '블런더' || analysis.moveQuality.quality === '실수' ? `   - 이 수로 인해 평가가 ${Math.abs(analysis.moveQuality.scoreDiff).toFixed(2)}점 악화되었습니다` : ''}
   ${analysis.moveQuality.quality === '좋은 수' ? '   - 정확한 선택으로 우위를 유지했습니다' : ''}
   ` : ''}
   - 일반적인 전략적 의미 설명
` : '';

    return `${lastMoveAnalysis}

2. 현재 포지션 평가:
   - 현재 평가: ${scoreDescription}
   - 의미: ${advantage}
   - 양쪽의 일반적인 전략 방향

3. Stockfish 추천 수:
   ${analysis.bestMove ? `
   - Stockfish 추천: ${analysis.bestMove}
   - 이 수의 일반적인 전략적 목적 설명
   ` : '- 여러 가능한 수가 있습니다'}

4. 다음 계획:
   - ${currentPlayer}이 고려해야 할 전략적 테마
   - 주의해야 할 일반적인 위험 요소`;
  }
}

// ============================================
// AI - Gemini API 클라이언트
// ============================================

const API_CONFIG = {
  endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
  temperature: 0.3,
  maxOutputTokens: 800,
  topP: 0.8,
  topK: 20
};

async function generateCommentary(fen, analysis) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.\n\n확장 프로그램 아이콘을 클릭하여 API 키를 설정해주세요.');
  }
  
  const prompt = generatePrompt(fen, analysis);
  const response = await callGeminiAPI(apiKey, prompt);
  
  return parseResponse(response);
}

function getApiKey() {
  const TEST_API_KEY = 'YOUR_API_KEY_HERE';
  
  return new Promise((resolve) => {
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
      const apiKey = TEST_API_KEY !== 'YOUR_API_KEY_HERE' ? TEST_API_KEY : result.geminiApiKey;
      resolve(apiKey);
    });
  });
}

async function callGeminiAPI(apiKey, prompt) {
  const apiUrl = `${API_CONFIG.endpoint}?key=${apiKey}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: API_CONFIG.temperature,
        maxOutputTokens: API_CONFIG.maxOutputTokens,
        topP: API_CONFIG.topP,
        topK: API_CONFIG.topK
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Gemini API 오류: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

function parseResponse(data) {
  if (data.candidates && data.candidates.length > 0) {
    const content = data.candidates[0].content;
    if (content && content.parts && content.parts.length > 0) {
      return content.parts[0].text;
    }
  }
  
  throw new Error('Gemini API 응답 형식이 올바르지 않습니다.');
}

// ============================================
// UI - 채팅 UI 관리
// ============================================

function createChatUI() {
  const existingChat = document.getElementById('ai-chess-chat');
  if (existingChat) {
    existingChat.style.display = 'flex';
    return;
  }
  
  const chatContainer = createChatContainer();
  const header = createHeader();
  const messagesContainer = createMessagesContainer();
  
  chatContainer.appendChild(header);
  chatContainer.appendChild(messagesContainer);
  document.body.appendChild(chatContainer);
  
  setupCloseButton();
}

function createChatContainer() {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'ai-chess-chat';
  chatContainer.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 400px;
    height: 600px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  return chatContainer;
}

function createHeader() {
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 15px 15px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <div>
      <div style="font-weight: bold; font-size: 16px;">🤖 AI 체스 해설가</div>
      <div style="font-size: 12px; opacity: 0.9;">Stockfish + Gemini AI</div>
    </div>
    <button id="close-chat" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 18px;">×</button>
  `;
  return header;
}

function createMessagesContainer() {
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'chat-messages';
  messagesContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 0 0 15px 15px;
  `;
  return messagesContainer;
}

function setupCloseButton() {
  document.getElementById('close-chat').addEventListener('click', () => {
    const chatContainer = document.getElementById('ai-chess-chat');
    if (chatContainer) {
      chatContainer.style.display = 'none';
    }
  });
}

function addChatMessage(text, sender) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 15px;
    display: flex;
    ${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
  `;
  
  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 15px;
    ${sender === 'user' 
      ? 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' 
      : 'background: white; color: #333; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'}
    word-wrap: break-word;
    white-space: pre-wrap;
    font-size: 14px;
    line-height: 1.5;
  `;
  bubble.textContent = text;
  
  messageDiv.appendChild(bubble);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function clearChatMessages() {
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }
}

// ============================================
// UI - 해설 버튼
// ============================================

function createCommentaryButton() {
  const existingButton = document.getElementById('ai-commentary-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  const button = createButton();
  setupButtonStyles(button);
  setupButtonEvents(button);
  
  document.body.appendChild(button);
}

function createButton() {
  const button = document.createElement('button');
  button.id = 'ai-commentary-button';
  button.textContent = '🤖 AI 해설 보기';
  return button;
}

function setupButtonStyles(button) {
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '12px 24px';
  button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '25px';
  button.style.fontSize = '16px';
  button.style.fontWeight = 'bold';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
  button.style.transition = 'all 0.3s ease';
}

function setupButtonEvents(button) {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
  });
  
  button.addEventListener('click', async () => {
    await handleButtonClick(button);
  });
}

async function handleButtonClick(button) {
  try {
    button.disabled = true;
    button.textContent = '⏳ 분석 중...';
    
    const fen = getCurrentFEN();
    const analysis = await analyzePosition(fen);
    
    button.textContent = '🤖 AI 해설 생성 중...';
    let commentary = '';
    
    try {
      commentary = await generateCommentary(fen, analysis);
    } catch (error) {
      commentary = `⚠️ AI 해설 생성 실패\n${error.message}\n\n기본 분석 결과만 표시합니다.`;
    }
    
    createChatUI();
    clearChatMessages();
    
    const message = formatAnalysisMessage(commentary, analysis);
    addChatMessage(message, 'ai');
    
  } catch (error) {
    alert(`❌ 오류가 발생했습니다.\n\n${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = '🤖 AI 해설 보기';
  }
}

function formatAnalysisMessage(commentary, analysis) {
  const moveQualityText = analysis.moveQuality ? `\n수 평가: ${analysis.moveQuality.quality}` : '';
  const scoreText = `평가: ${analysis.score > 0 ? '+' : ''}${(analysis.score/100).toFixed(2)}`;
  const bestMoveText = analysis.bestMove ? `\n최선의 수: ${analysis.bestMove}` : '';
  const lastMoveText = analysis.lastMove ? `\n마지막 수: ${analysis.lastMove}` : '';
  
  return `${commentary}\n\n${scoreText}${moveQualityText}${bestMoveText}${lastMoveText}`;
}

// ============================================
// MAIN - 초기화
// ============================================

async function initialize() {
  createCommentaryButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
