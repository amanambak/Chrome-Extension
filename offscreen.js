// offscreen.js — Offscreen Document
// Phase 2: Audio capture pipeline + Deepgram integration.

let audioContext;
let mediaStream;
let source;
let workletNode;
let socket;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CAPTURE' && message.offscreen) {
    startCapture(message.streamId);
  } else if (message.type === 'STOP_CAPTURE' && message.offscreen) {
    stopCapture();
  }
});

async function startCapture(streamId) {
  try {
    console.log('[AudioAI Offscreen] Starting capture with streamId:', streamId);

    // 1. Get the media stream using the streamId
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    // 2. Create AudioContext (16kHz)
    audioContext = new AudioContext({
      sampleRate: 16000,
    });

    // 3. Create media stream source
    source = audioContext.createMediaStreamSource(mediaStream);

    // 4. Connect to destination (passthrough)
    source.connect(audioContext.destination);

    // 5. Setup Deepgram Connection
    openDeepgramConnection();

    // 6. Setup AudioWorklet
    await setupWorklet();

    console.log('[AudioAI Offscreen] Audio pipeline established');
  } catch (err) {
    console.error('[AudioAI Offscreen] Error starting capture:', err);
    chrome.runtime.sendMessage({
      type: 'API_ERROR',
      source: 'Offscreen',
      message: `Failed to start audio capture: ${err.message}`
    });
  }
}

async function stopCapture() {
  console.log('[AudioAI Offscreen] Stopping capture');

  if (socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'CloseStream' }));
    }
    socket.close();
    socket = null;
  }

  if (workletNode) {
    workletNode.disconnect();
    workletNode = null;
  }

  if (source) {
    source.disconnect();
    source = null;
  }

  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  console.log('[AudioAI Offscreen] Resources cleaned up');
}

async function setupWorklet() {
  try {
    await audioContext.audioWorklet.addModule('capture-worklet.js');
    workletNode = new AudioWorkletNode(audioContext, 'capture-worklet');

    workletNode.port.onmessage = (event) => {
      const pcmBuffer = event.data;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(pcmBuffer);
      }
    };

    source.connect(workletNode);
    console.log('[AudioAI Offscreen] AudioWorklet registered and connected');
  } catch (err) {
    console.error('[AudioAI Offscreen] Failed to setup AudioWorklet:', err);
  }
}

function openDeepgramConnection() {
  const params = new URLSearchParams(CONFIG.DEEPGRAM_PARAMS);
  // Add interim results for better responsiveness
  params.set('interim_results', 'true');
  const url = `${CONFIG.DEEPGRAM_WS_URL}?${params.toString()}`;

  console.log('[AudioAI Offscreen] Opening Deepgram connection:', url);

  // We use token sub-protocol to pass the API key
  socket = new WebSocket(url, ['token', CONFIG.DEEPGRAM_API_KEY]);

  socket.onopen = () => {
    console.log('[AudioAI Offscreen] Deepgram WebSocket opened');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // Handle transcript results
    if (data.channel && data.channel.alternatives && data.channel.alternatives[0].transcript) {
        const transcript = data.channel.alternatives[0].transcript;
        const isFinal = data.is_final;
        
        // Notify service worker of the transcript
        chrome.runtime.sendMessage({
            type: 'TRANSCRIPT_RECEIVED',
            transcript: transcript,
            isFinal: isFinal,
            metadata: {
                confidence: data.channel.alternatives[0].confidence,
                speech_final: data.speech_final
            }
        });
    }

    // Handle UtteranceEnd (segmentation boundary)
    if (data.type === 'UtteranceEnd') {
      console.log('[AudioAI Offscreen] UtteranceEnd received');
      chrome.runtime.sendMessage({ type: 'UTTERANCE_END' });
    }
  };

  socket.onerror = (error) => {
    console.error('[AudioAI Offscreen] Deepgram WebSocket error:', error);
    chrome.runtime.sendMessage({
      type: 'API_ERROR',
      source: 'Deepgram',
      message: 'A WebSocket error occurred. Please check your API key and network connection.'
    });
  };

  socket.onclose = (event) => {
    console.log('[AudioAI Offscreen] Deepgram WebSocket closed:', event.code, event.reason);
    if (event.code !== 1000 && event.code !== 1005) {
        chrome.runtime.sendMessage({
            type: 'API_ERROR',
            source: 'Deepgram',
            message: `WebSocket closed unexpectedly (${event.code}): ${event.reason || 'No reason provided'}`
        });
    }
  };
}

console.log('[AudioAI] Offscreen document loaded');
