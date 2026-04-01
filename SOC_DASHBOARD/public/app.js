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
    stats.total++;
    if (event.severity === 'CRITICAL') stats.critical++;
    if (event.severity === 'HIGH') stats.high++;
    if (event.severity === 'INFO') stats.info++;

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

function clearLogs() {
    document.getElementById('alert-feed').innerHTML = '<div style="text-align: center; color: #484f58; margin-top: 2rem;">Feed cleared. Waiting for new events...</div>';
    knownEvents.clear();
    stats = { total: 0, critical: 0, high: 0, info: 0 };
    updateStats({severity: 'RESET'}); // Dummy to reset UI
}

// Initial fetch and start interval
fetchEvents();
setInterval(fetchEvents, 2000);
