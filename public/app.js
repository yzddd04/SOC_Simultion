async function runSQLi() {
    const username = document.getElementById('sqli-input').value;
    const res = await fetch(`/api/users/search?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    document.getElementById('sqli-result').innerHTML = `
        <small>Query: <code>${data.query}</code></small>
        <pre>${JSON.stringify(data.result, null, 2)}</pre>
    `;
}

async function runSSRF() {
    const url = document.getElementById('ssrf-input').value;
    const resultDiv = document.getElementById('ssrf-result');
    resultDiv.innerHTML = 'Memuat...';
    try {
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        const data = await res.text();
        resultDiv.innerHTML = `<pre>${data.substring(0, 500)}${data.length > 500 ? '...' : ''}</pre>`;
    } catch (e) {
        resultDiv.innerHTML = `<pre>Error: ${e.message}</pre>`;
    }
}

async function runBrute() {
    const username = document.getElementById('brute-user').value;
    const password = document.getElementById('brute-pass').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    const resultDiv = document.getElementById('brute-result');
    if (data.success) {
        resultDiv.innerHTML = `<p style="color:#238636">Login Berhasil! <br>Secret: ${data.user.secret_note}</p>`;
    } else {
        resultDiv.innerHTML = `<p style="color:#f85149">Login Gagal: ${data.message}</p>`;
    }
}

async function loadMessages() {
    const res = await fetch('/api/messages');
    const messages = await res.json();
    const list = document.getElementById('xss-messages');
    list.innerHTML = messages.map(m => `
        <div class="message-item">
            <strong>${m.user}:</strong> ${m.content}
        </div>
    `).join('');
}

async function runXSS() {
    const user = document.getElementById('xss-user').value;
    const content = document.getElementById('xss-content').value;
    await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, content })
    });
    loadMessages();
}

async function runLFI() {
    const filename = document.getElementById('lfi-input').value;
    const res = await fetch(`/api/view?file=${encodeURIComponent(filename)}`);
    const data = await res.text();
    document.getElementById('lfi-result').innerHTML = `<pre>${data.substring(0, 1000)}</pre>`;
}

async function runIDOR() {
    const id = document.getElementById('idor-input').value;
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
    const data = await res.json();
    document.getElementById('idor-result').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

async function runPriv() {
    const id = document.getElementById('priv-id').value;
    const jsonStr = document.getElementById('priv-json').value;
    try {
        const bodyData = JSON.parse(jsonStr);
        const res = await fetch(`/api/users/${encodeURIComponent(id)}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        const data = await res.json();
        document.getElementById('priv-result').innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (e) {
        document.getElementById('priv-result').innerHTML = `<pre style="color:red">JSON Tidak Valid: ${e.message}</pre>`;
    }
}

loadMessages();
