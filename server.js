const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- SECURITY LOGGING ---
const securityEvents = [];
function logSecurityEvent(type, severity, message, payload) {
  const event = {
    id: securityEvents.length + 1,
    timestamp: new Date().toISOString(),
    type,
    severity,
    message,
    payload,
    ip: '127.0.0.1' // In simulation, we assume local
  };
  securityEvents.push(event);
  console.log(`[SOC ALERT - ${severity}] ${type}: ${message}`);
}

// --- MOCK DATABASE (Pure JS to avoid GLIBC issues) ---
const mockDB = {
  users: [
    { id: 1, username: 'admin', password: 'p4ssw0rd123', role: 'admin', secret_note: 'Kunci rahasia server ada di /etc/passwd atau file sistem lainnya. Flag: {SQLI_SUCCESS_ADMIN}' },
    { id: 2, username: 'user1', password: 'qwerty', role: 'user', secret_note: 'Saya suka belajar keamanan web!' }
  ],
  messages: [
    { id: 1, user: 'admin', content: 'Selamat datang di lab simulasi keamanan web!' }
  ]
};

// Simulation of SQL Query for SQLi demonstration
function simulateSQLQuery(query) {
  console.log("SQL Executing: " + query);
  
  // Vulnerable SQL Injection Logic (Simple simulation)
  // Check for the classic ' OR '1'='1 pattern
  if (query.includes("' OR '1'='1") || query.includes('" OR "1"="1')) {
    return mockDB.users; // Return all users
  }

  // Check for username match
  const match = query.match(/username = '([^']+)'/);
  if (match) {
    const uname = match[1];
    return mockDB.users.filter(u => u.username === uname);
  }

  return [];
}

// --- ENDPOINTS ---

// 1. SQL Injection Lab
app.get('/api/users/search', (req, res) => {
  const username = req.query.username || '';
  // VULNERABLE: Direct concatenation
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  
  // DETEKSI SQLi & XSS
  const sqliPatterns = [/'/g, /--/g, /UNION/gi, /SELECT/gi, /OR/gi, /"/g];
  const xssPatterns = [/<script/gi, /onerror/gi, /onload/gi, /alert\(/gi];
  
  const isSQLi = sqliPatterns.some(pattern => pattern.test(username));
  const isXSS = xssPatterns.some(pattern => pattern.test(username));

  if (isSQLi) {
    logSecurityEvent('SQL Injection Attempt', 'CRITICAL', `Potensi SQLi terdeteksi pada parameter username: ${username}`, { query });
  }
  if (isXSS) {
    logSecurityEvent('XSS Attempt', 'HIGH', `Potensi XSS terdeteksi pada parameter username: ${username}`, { input: username });
  }

  const result = simulateSQLQuery(query);
  res.json({ query, result });
});

// 2. SSRF (Server-Side Request Forgery) Lab
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL required');
  
  console.log("SSRF - Fetching: " + url);
  try {
    // VULNERABLE: No validation of URL
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      logSecurityEvent('SSRF Attempt', 'HIGH', `Percobaan akses URL internal: ${url}`, { url });
    } else {
      logSecurityEvent('SSRF Request', 'INFO', `Server melakukan fetch ke: ${url}`, { url });
    }

    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
  } catch (err) {
    res.status(500).send("Error fetching URL: " + err.message);
  }
});

// --- BRUTEFORCE TRACKER ---
const loginAttempts = {};

// 3. Bruteforce Lab (No rate limiting)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: ${username}:${password}`);
  
  const user = mockDB.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Reset tracker on success
    loginAttempts[username] = 0;
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, secret_note: user.secret_note } });
  } else {
    // Increment tracker on failure
    loginAttempts[username] = (loginAttempts[username] || 0) + 1;
    
    if (loginAttempts[username] >= 3) {
      logSecurityEvent('Bruteforce Attack Detected', 'CRITICAL', `Terdeteksi ${loginAttempts[username]} percobaan login gagal berturut-turut untuk user: ${username}`, { username, attempts: loginAttempts[username] });
    } else {
      logSecurityEvent('Failed Login Attempt', 'WARNING', `Login gagal untuk user: ${username}`, { username });
    }

    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// 4. Stored XSS Lab (No sanitization)
app.post('/api/messages', (req, res) => {
  const { user, content } = req.body;
  
  const xssPatterns = [/<script/gi, /onerror/gi, /onload/gi, /alert\(/gi, /src=/gi];
  if (xssPatterns.some(p => p.test(content)) || xssPatterns.some(p => p.test(user))) {
    logSecurityEvent('Stored XSS Attempt', 'CRITICAL', `Muatan XSS terdeteksi pada pesan dari: ${user}`, { user, content });
  }

  const newMessage = { id: mockDB.messages.length + 1, user, content, created_at: new Date() };
  mockDB.messages.push(newMessage);
  res.json({ success: true, message: newMessage });
});

app.get('/api/messages', (req, res) => {
  res.json(mockDB.messages);
});

// 5. Directory Traversal / LFI Lab
app.get('/api/view', (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).send('File name required');
  
  console.log("LFI - Viewing: " + fileName);
  try {
    // VULNERABLE: Direct path joining without sanitization
    const sensitiveFiles = ['package.json', 'server.js', '.env', 'etc/passwd'];
    
    if (fileName.includes('..') || fileName.startsWith('/') || sensitiveFiles.some(f => fileName.includes(f))) {
      logSecurityEvent('LFI/Path Traversal Attempt', 'CRITICAL', `Akses file sensitif terdeteksi: ${fileName}`, { fileName });
    } else {
      logSecurityEvent('File Access', 'INFO', `User membaca file: ${fileName}`, { fileName });
    }

    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.send(content);
    } else {
      res.status(404).send('File not found');
    }
  } catch (err) {
    res.status(500).send("Error reading file: " + err.message);
  }
});

// 6. SOC Events API
app.get('/api/events', (req, res) => {
  res.json(securityEvents);
});

// Internal Endpoint for SSRF testing
app.get('/api/admin-secret', (req, res) => {
  if (req.ip === '::1' || req.ip === '127.0.0.1' || req.ip.includes('127.0.0.1')) {
    res.send("Selamat! Ini adalah data rahasia internal. Flag: {SSRF_INTERNAL_WIN}");
  } else {
    res.status(403).send("Hanya akses lokal yang diizinkan!");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Vulnerable labs: SQLi, SSRF, Bruteforce, XSS, LFI`);
});
