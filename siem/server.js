require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/ask-ai', async (req, res) => {
    try {
        const { messages } = req.body;

        let fetchFn;
        if (typeof fetch !== 'undefined') {
            fetchFn = fetch;
        } else {
            fetchFn = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        }

        const groqRes = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY || 'gsk_YOUR_API_KEY_HERE'}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                max_tokens: 500
            })
        });

        const groqData = await groqRes.json();
        res.json(groqData);
    } catch (e) {
        console.error("AI Error:", e);
        res.status(500).json({ error: { message: e.message } });
    }
});

app.listen(PORT, () => {
    console.log(`SOC Dashboard running on http://localhost:${PORT}`);
    console.log(`Monitoring vulnerable server at http://localhost:3000`);
});
