// background.js — Service Worker (MV3)
// Support for Native Side Panel API + Automation Shortcuts.

importScripts('config.js');

let isCapturing = false;
let targetTabId = null;

// Handle clicking the extension icon: Open panel AND Start Capture immediately
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[AudioAI] Action icon clicked, opening panel and starting capture...');
  
  // 1. Open the side panel (requires user gesture, which this click provides)
  await chrome.sidePanel.open({ tabId: tab.id });
  
  // 2. Start the capture process
  startCapture();
});

// Handle Keyboard Shortcut (Alt+S)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-capture") {
    console.log('[AudioAI] Keyboard command received:', command);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        await chrome.sidePanel.open({ tabId: tab.id });
        handleToggleCapture();
    }
  }
});

// Initialize state from storage
chrome.storage.local.get(['isCapturing'], (result) => {
  isCapturing = result.isCapturing || false;
});

// Reset state on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isCapturing: false });
  isCapturing = false;
  
  // Create context menu for invocation
  chrome.contextMenus.create({
    id: "start-capture-context",
    title: "Start Audio AI Capture",
    contexts: ["page", "video", "audio"]
  });
  console.log('[AudioAI] Extension installed, state reset, context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "start-capture-context") {
    console.log('[AudioAI] Context menu clicked, starting capture...');
    startCapture();
  }
});

// Handle messages from side panel or offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({ active: isCapturing });
    return true;
  }

  if (message.type === 'TOGGLE_CAPTURE') {
    handleToggleCapture().then((active) => {
      sendResponse({ active });
    });
    return true; 
  }

  if (message.type === 'TRANSCRIPT_RECEIVED') {
    // Broadcast to extension components (like side panel)
    chrome.runtime.sendMessage({
        type: 'TRANSCRIPT_UPDATE',
        transcript: message.transcript,
        isFinal: message.isFinal,
        metadata: message.metadata
    }).catch(() => {});
  }

  if (message.type === 'UTTERANCE_END') {
    chrome.runtime.sendMessage({ type: 'UTTERANCE_END' }).catch(() => {});
  }

  if (message.type === 'API_ERROR') {
    chrome.runtime.sendMessage({
        type: 'API_ERROR',
        source: message.source,
        message: message.message
    }).catch(() => {});
  }

  if (message.type === 'PROCESS_UTTERANCE') {
    const { text, utteranceId } = message;
    streamGeminiResponse(text, utteranceId);
    return true;
  }
});

async function streamGeminiResponse(text, utteranceId) {
  const model = CONFIG.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
  // const model = CONFIG.GEMINI_MODEL || 'gemini-1.5
  const apiKey = CONFIG.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const systemPrompt = "Classify user utterance as QUESTION or STATEMENT. Provide a very brief (max 5 words) summary of the utterance. If QUESTION: Provide concise answer. If STATEMENT: Provide 2-3 short suggestions. You MUST respond in Hinglish (a natural mix of Hindi and English using Roman script). Format: [SUMMARY] summary text [ANSWER] answer text OR [SUMMARY] summary text [SUGGESTION] suggestion text.";

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUtterance: ${text}` }] }]
      })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop();

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
            const chunkText = json.candidates[0].content.parts[0].text;
            chrome.runtime.sendMessage({ type: 'AI_RESPONSE_CHUNK', utteranceId, text: chunkText }).catch(() => {});
          }
        } catch (e) {}
      }
    }
    chrome.runtime.sendMessage({ type: 'AI_RESPONSE_CHUNK', utteranceId, isDone: true }).catch(() => {});
  } catch (err) {
    chrome.runtime.sendMessage({ type: 'AI_RESPONSE_ERROR', utteranceId, error: err.message }).catch(() => {});
  }
}

async function handleToggleCapture() {
  if (isCapturing) {
    await stopCapture();
  } else {
    await startCapture();
  }
  return isCapturing;
}
async function startCapture() {
  console.log('[AudioAI] startCapture requested');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.error('[AudioAI] No active tab found');
      return;
    }
    targetTabId = tab.id;
    console.log('[AudioAI] Targeting tab:', targetTabId, tab.url);

    await ensureContentScriptInjected(targetTabId);
    console.log('[AudioAI] Content script check complete');

    console.log('[AudioAI] Requesting streamId...');
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId });
    console.log('[AudioAI] Obtained streamId:', streamId);

    const existingContexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existingContexts.length === 0) {
      console.log('[AudioAI] Creating offscreen document...');
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Capture tab audio'
      });
      console.log('[AudioAI] Offscreen document created');
    } else {
      console.log('[AudioAI] Offscreen document already exists');
    }

    // Give the offscreen doc a moment to initialize listeners
    setTimeout(() => {
        console.log('[AudioAI] Sending START_CAPTURE to offscreen');
        chrome.runtime.sendMessage({ type: 'START_CAPTURE', streamId, offscreen: true });
    }, 500);

    isCapturing = true;
    await chrome.storage.local.set({ isCapturing: true });
    chrome.runtime.sendMessage({ type: 'CAPTURE_STATUS_CHANGED', active: true }).catch(() => {});
    console.log('[AudioAI] Capture state marked as ACTIVE');
  } catch (err) {
    console.error('[AudioAI] FATAL error in startCapture:', err);
    isCapturing = false;
    await chrome.storage.local.set({ isCapturing: false });
    chrome.runtime.sendMessage({ type: 'CAPTURE_STATUS_CHANGED', active: false }).catch(() => {});
  }
}

async function stopCapture() {
  try {
    chrome.runtime.sendMessage({ type: 'STOP_CAPTURE', offscreen: true });
    const existingContexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existingContexts.length > 0) await chrome.offscreen.closeDocument();

    isCapturing = false;
    targetTabId = null;
    await chrome.storage.local.set({ isCapturing: false });
    chrome.runtime.sendMessage({ type: 'CAPTURE_STATUS_CHANGED', active: false }).catch(() => {});
  } catch (err) {}
}

async function ensureContentScriptInjected(tabId) {
  try {
    const pingPromise = chrome.tabs.sendMessage(tabId, { type: 'PING' });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100));
    await Promise.race([pingPromise, timeoutPromise]);
  } catch (err) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) return;
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  }
}
