// sidepanel.js — Native Side Panel Logic

let currentCard = null;
const aiCards = new Map();
const container = document.getElementById('transcript-container');
const toggleBtn = document.getElementById('toggle-btn');
const clearBtn = document.getElementById('clear-btn');
const dot = document.getElementById('dot');

// Initialize UI status
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
  if (response) updateCaptureUI(response.active);
});

toggleBtn.addEventListener('click', () => {
  console.log('[AudioAI Panel] Toggle button clicked');
  chrome.runtime.sendMessage({ type: 'TOGGLE_CAPTURE' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[AudioAI Panel] Message error:', chrome.runtime.lastError);
      return;
    }
    console.log('[AudioAI Panel] Toggle response:', response);
    if (response) updateCaptureUI(response.active);
  });
});

clearBtn.addEventListener('click', () => {
  console.log('[AudioAI Panel] Clear clicked');
  container.innerHTML = '';
  currentCard = null;
  aiCards.clear();
});

function updateCaptureUI(isActive) {
  console.log('[AudioAI Panel] Updating UI, active:', isActive);
  if (isActive) {
    toggleBtn.textContent = 'Stop Capture';
    toggleBtn.classList.add('active');
    dot.classList.add('active');
  } else {
    toggleBtn.textContent = 'Start Capture';
    toggleBtn.classList.remove('active');
    dot.classList.remove('active');
  }
}

// Listen for updates from background
chrome.runtime.onMessage.addListener((message) => {
  console.log('[AudioAI Panel] Message received:', message.type);
  if (message.type === 'TRANSCRIPT_UPDATE') {
    const { transcript, isFinal, metadata } = message;
    
    if (!currentCard && transcript.trim()) {
      const utteranceId = `u-${Date.now()}`;
      currentCard = createUtteranceCard(utteranceId);
      container.appendChild(currentCard.element);
    }

    if (currentCard) {
      if (isFinal) {
        appendFinalToCard(currentCard, transcript);
        if (metadata && metadata.speech_final) {
            finalizeCard(currentCard);
            currentCard = null;
        }
      } else {
        updateInterimInCard(currentCard, transcript);
      }
      scrollToBottom();
    }
  }

  if (message.type === 'AI_RESPONSE_CHUNK') {
    const { utteranceId, text, isDone } = message;
    let aiCard = aiCards.get(utteranceId);
    
    if (!aiCard) {
      aiCard = createAiResponseCard(utteranceId);
      aiCards.set(utteranceId, aiCard);
      container.appendChild(aiCard.element);
    }

    if (text) {
      appendChunkToAiCard(aiCard, text);
    }

    if (isDone) {
      finalizeAiCard(aiCard);
    }
    scrollToBottom();
  }

  if (message.type === 'CAPTURE_STATUS_CHANGED') {
    updateCaptureUI(message.active);
  }

  if (message.type === 'UTTERANCE_END') {
    console.log('[AudioAI Panel] Utterance end received');
    if (currentCard) {
      finalizeCard(currentCard);
      currentCard = null;
    }
  }

  if (message.type === 'API_ERROR') {
    addErrorToContainer(message.message, message.source);
  }
});

function scrollToBottom() {
  container.scrollTop = container.scrollHeight;
}

// --- Card Creators ---

function createUtteranceCard(id) {
  const el = document.createElement('div');
  el.className = 'utterance-card';
  const stable = document.createElement('span');
  const interim = document.createElement('span');
  interim.style.color = '#888';
  el.appendChild(stable);
  el.appendChild(interim);
  return { element: el, stable, interim, id };
}

function updateInterimInCard(card, text) {
  card.interim.textContent = text ? ` ${text}` : '';
}

function appendFinalToCard(card, text) {
  if (!text) return;
  const current = card.stable.textContent;
  if (current && !current.endsWith(' ') && !text.startsWith(' ')) {
    card.stable.textContent += ' ';
  }
  card.stable.textContent += text;
  card.interim.textContent = '';
}

function finalizeCard(card) {
  card.element.classList.add('finalized');
  card.interim.textContent = '';
  
  const text = card.stable.textContent.trim();
  if (text.length > 3) {
    chrome.runtime.sendMessage({
      type: 'PROCESS_UTTERANCE',
      text: text,
      utteranceId: card.id
    });
  }
}

function createAiResponseCard(id) {
  const el = document.createElement('div');
  el.className = 'ai-response-card';
  
  const badge = document.createElement('span');
  badge.className = 'ai-badge loading';
  badge.textContent = 'Thinking...';

  const summary = document.createElement('div');
  summary.className = 'query-summary';
  summary.style.display = 'none';
  
  const content = document.createElement('div');
  el.appendChild(badge);
  el.appendChild(summary);
  el.appendChild(content);
  
  return { element: el, badge, summary, content, id, fullText: '', typeDetected: false };
}

function appendChunkToAiCard(card, text) {
  card.fullText += text;

  // Handle Summary
  const hasSummaryMarker = card.fullText.includes('[SUMMARY]');
  if (hasSummaryMarker) {
    const start = card.fullText.indexOf('[SUMMARY]') + 9;
    let end = card.fullText.indexOf('[ANSWER]');
    if (end === -1) end = card.fullText.indexOf('[SUGGESTION]');
    
    if (end !== -1) {
      card.summary.textContent = `Topic: ${card.fullText.substring(start, end).trim()}`;
    } else {
      card.summary.textContent = `Topic: ${card.fullText.substring(start).trim()}`;
    }
    card.summary.style.display = 'block';
  }

  // Handle Badge and Content
  if (!card.typeDetected) {
    if (card.fullText.includes('[ANSWER]')) {
      card.typeDetected = true;
      card.badge.className = 'ai-badge answer';
      card.badge.textContent = 'Answer';
    } else if (card.fullText.includes('[SUGGESTION]')) {
      card.typeDetected = true;
      card.badge.className = 'ai-badge suggestion';
      card.badge.textContent = 'Suggestion';
    }
  }

  if (card.typeDetected) {
    const marker = card.badge.textContent === 'Answer' ? '[ANSWER]' : '[SUGGESTION]';
    const parts = card.fullText.split(marker);
    if (parts.length > 1) {
      card.content.textContent = parts[1].trim();
    }
  } else if (!hasSummaryMarker) {
    card.content.textContent = card.fullText;
  } else {
    card.content.textContent = '';
  }
}

function finalizeAiCard(card) {
  if (!card.copyBtn) {
    const btn = document.createElement('button');
    btn.className = 'copy-button';
    btn.textContent = 'Copy';
    btn.onclick = () => {
      navigator.clipboard.writeText(card.content.textContent);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    };
    card.element.appendChild(btn);
    card.copyBtn = btn;
  }
}

function addErrorToContainer(msg, source) {
  const el = document.createElement('div');
  el.style.cssText = 'background:#3a1e1e; border:1px solid #ff6b6b; padding:12px; border-radius:8px; color:#ff6b6b; font-size:0.9rem;';
  el.textContent = `[${source}] Error: ${msg}`;
  container.appendChild(el);
  scrollToBottom();
}
