import React, { useState, useEffect } from 'react';

const ApiDebugStatus: React.FC = () => {
    const [status, setStatus] = useState<string>('Checking...');
    const [keyStatus, setKeyStatus] = useState<string>('Checking...');
    const [details, setDetails] = useState<string>('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        // Check API Key existence (masked)
        const key = (import.meta as any).env.VITE_GROQ_API_KEY;
        if (!key) {
            setKeyStatus('MISSING (Restart server?)');
            setStatus('Cannot connect without key');
            return;
        } else if (key.includes('your_actual')) {
            setKeyStatus('PLACEHOLDER DETECTED');
            setStatus('Please update .env');
            return;
        } else {
            setKeyStatus(`Present (${key.slice(0, 5)}...${key.slice(-4)})`);
        }

        try {
            // Test 1: GET Models
            setStatus('Test 1: Pinging Models (GET)...');
            const res = await fetch('https://api.groq.com/openai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const txt = await res.text();
                setStatus(`GET FAILED: ${res.status}`);
                setDetails(txt.slice(0, 100));
                return;
            }

            // Test 2: POST Chat Completion
            setStatus('Test 2: Chat Completion (POST)...');
            const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: 'Say hello' }]
                })
            });

            if (chatRes.ok) {
                const data = await chatRes.json();
                const reply = data.choices?.[0]?.message?.content || 'No content';
                setStatus('SUCCESS! System operational.');
                setDetails(`Reply: "${reply.slice(0, 40)}..."`);
            } else {
                const txt = await chatRes.text();
                console.error('Groq POST Error:', txt);
                setStatus(`POST FAILED: ${chatRes.status}`);
                setDetails(txt.slice(0, 150));
            }

        } catch (e: any) {
            setStatus('NETWORK ERROR');
            setDetails(e.message);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-black/95 text-white rounded-lg shadow-xl border border-red-500 max-w-sm text-xs font-mono">
            <h3 className="font-bold text-red-400 mb-2">DEBUG STATUS</h3>
            <div className="mb-1">API Key: <span className="text-yellow-300">{keyStatus}</span></div>
            <div className="mb-2">
                Status: <span className={status.includes('SUCCESS') ? 'text-green-400' : 'text-red-400'}>{status}</span>
            </div>
            {details && (
                <div className="mb-2 p-2 bg-gray-800 rounded break-all text-gray-300 text-[10px]">
                    {details}
                </div>
            )}
            <button onClick={checkConnection} className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 w-full">Retry Connection</button>
        </div>
    );
};

export default ApiDebugStatus;
