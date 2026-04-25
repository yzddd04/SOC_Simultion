let knownEvents = new Set();
let stats = {
    total: 0,
    critical: 0,
    high: 0,
    info: 0
};

async function fetchEvents() {
    try {
        const res = await fetch('http://localhost:3000/api/events');
        const events = await res.json();
        
        events.forEach(event => {
            if (!knownEvents.has(event.id)) {
                addEventToFeed(event);
                knownEvents.add(event.id);
                updateStats(event);
            }
        });
    } catch (e) {
        console.error('Failed to fetch events:', e);
    }
}

function updateStats(event) {
    if (event && event.severity !== 'RESET') {
        stats.total++;
        if (event.severity === 'CRITICAL') stats.critical++;
        if (event.severity === 'HIGH') stats.high++;
        if (event.severity === 'INFO') stats.info++;
    }

    document.getElementById('stat-total').innerText = stats.total;
    document.getElementById('stat-critical').innerText = stats.critical;
    document.getElementById('stat-high').innerText = stats.high;
    document.getElementById('stat-info').innerText = stats.info;
}

function addEventToFeed(event) {
    const feed = document.getElementById('alert-feed');
    
    // Remove "Waiting" message if it's there
    if (stats.total === 0) feed.innerHTML = '';

    const card = document.createElement('div');
    card.className = `alert-card ${event.severity}`;
    
    const time = new Date(event.timestamp).toLocaleTimeString();
    
    card.innerHTML = `
        <div class="alert-meta">
            <span>[${event.severity}] ID: ${event.id}</span>
            <span>${time} | IP: ${event.ip}</span>
        </div>
        <div class="alert-title">${event.type}</div>
        <div class="alert-body">${event.message}</div>
        <div class="alert-payload">Payload: ${JSON.stringify(event.payload)}</div>
    `;
    
    feed.prepend(card);
}

async function clearLogs() {
    // Menghapus data dari backend agar refresh tidak memunculkannya lagi
    try {
        await fetch('http://localhost:3000/api/events', { method: 'DELETE' });
    } catch (e) {
        console.error('Failed to clear backend logs', e);
    }
    
    document.getElementById('alert-feed').innerHTML = '<div style="text-align: center; color: #484f58; margin-top: 2rem;">Feed cleared. Waiting for new events...</div>';
    knownEvents.clear(); // Aman untuk dihapus karena backend sudah kosong
    stats = { total: 0, critical: 0, high: 0, info: 0 };
    updateStats({severity: 'RESET'}); // Reset UI ke 0
}

// Initial fetch and start interval
fetchEvents();
setInterval(fetchEvents, 2000);

// --- ASK AI Logic ---
function toggleAIChat() {
    const box = document.getElementById('ai-chat-box');
    box.classList.toggle('hidden');
}

function handleAIEnter(e) {
    if (e.key === 'Enter') {
        sendAIMessage();
    }
}

async function sendAIMessage() {
    const inputField = document.getElementById('ai-input-field');
    const msg = inputField.value.trim();
    if (!msg) return;

    appendAIMessage(msg, 'user');
    inputField.value = '';

    // Fetch current logs to send as context
    let contextData = "Belum ada log.";
    try {
        const res = await fetch('http://localhost:3000/api/events');
        const data = await res.json();
        if (data.length > 0) {
            // Send only the last 15 logs to save context length
            contextData = JSON.stringify(data.slice(-15), null, 2);
        }
    } catch (e) {
        contextData = "Error mengambil log: " + e.message;
    }

    const systemPrompt = `You are an AI SOC Assistant. You speak Indonesian. You help analyze security event logs. 
IMPORTANT: Timestamp pada log menggunakan format UTC. Saat memberikan analisis, kamu WAJIB mengonversi waktu tersebut ke Waktu Indonesia Barat (WIB / UTC+7).
Saat ini adalah ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB.
Here are the recent logs: 
${contextData}`;

    appendAIMessage("Menganalisis log...", 'bot', 'loading-msg');

    try {
        const groqRes = await fetch('/api/ask-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: msg }
                ]
            })
        });

        const groqData = await groqRes.json();
        document.getElementById('loading-msg').remove();

        if (groqData.choices && groqData.choices.length > 0) {
            appendAIMessage(groqData.choices[0].message.content, 'bot');
        } else if (groqData.error) {
            appendAIMessage(`Error API: ${groqData.error.message}`, 'bot');
        } else {
            appendAIMessage("Maaf, terjadi kesalahan dari server AI.", 'bot');
        }
    } catch (err) {
        document.getElementById('loading-msg')?.remove();
        appendAIMessage("Error: " + err.message, 'bot');
    }
}

function appendAIMessage(text, sender, id = null) {
    const container = document.getElementById('ai-messages');
    const div = document.createElement('div');
    div.className = `ai-msg ${sender}`;
    if (id) div.id = id;
    
    if (sender === 'bot' && typeof marked !== 'undefined') {
        div.innerHTML = marked.parse(text);
    } else {
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code style="background:#010409;padding:2px;border-radius:3px;">$1</code>')
            .replace(/\n/g, '<br>');
        div.innerHTML = formattedText;
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}
