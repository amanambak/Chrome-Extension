// test-gemini.js — Test script for Gemini 2.0 Flash Streaming
// Run with: node test-gemini.js

const fs = require('fs');
const path = require('path');

// Mock CONFIG if not in browser environment
let CONFIG;
try {
    const configContent = fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8');
    // Extract CONFIG object from config.js (matches "const CONFIG = { ... };")
    const match = configContent.match(/const\s*CONFIG\s*=\s*({[\s\S]*?});/);
    if (match) {
        // Evaluate the object string directly
        CONFIG = eval('(' + match[1] + ')');
    }
} catch (e) {
    console.error('Failed to read config.js. Ensure you have run node generate-config.js');
    process.exit(1);
}

if (!CONFIG) {
    console.error('ERROR: Could not parse CONFIG from config.js. Ensure the file contains "const CONFIG = { ... };"');
    process.exit(1);
}

const model = CONFIG.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

const apiKey = CONFIG.GEMINI_API_KEY;

if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error('ERROR: Invalid GEMINI_API_KEY in config.js');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

const systemPrompt = "Classify user utterance as QUESTION or STATEMENT. If QUESTION: Provide concise answer. If STATEMENT: Provide 2-3 short suggestions. Prefix with [ANSWER] or [SUGGESTION].";
const testUtterance = "What is the capital of France?";

async function runTest() {
    console.log(`[Test] Starting Gemini Stream Test...`);
    console.log(`[Test] Model: ${model}`);
    console.log(`[Test] URL: ${url.replace(apiKey, 'REDACTED')}`);
    console.log(`[Test] Utterance: "${testUtterance}"`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nUtterance: ${testUtterance}` }] }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorBody}`);
        }

        console.log(`[Test] Stream opened. Receiving chunks...`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data: ')) continue;
                
                try {
                    const json = JSON.parse(trimmed.slice(6));
                    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
                        const chunkText = json.candidates[0].content.parts[0].text;
                        fullResponse += chunkText;
                        process.stdout.write(chunkText); // Stream to console
                    }
                } catch (e) {
                    console.error('\n[Test] JSON Parse Error:', e.message, 'on line:', trimmed);
                }
            }
        }
        console.log(`\n[Test] Stream closed successfully.`);
        console.log(`[Test] Full Result:`, fullResponse);
        
        if (fullResponse.includes('[ANSWER]') || fullResponse.includes('[SUGGESTION]')) {
            console.log(`[Test] SUCCESS: Classification prefix found.`);
        } else {
            console.warn(`[Test] WARNING: Classification prefix missing.`);
        }

    } catch (err) {
        console.error(`[Test] FATAL ERROR:`, err.message);
    }
}

runTest();
