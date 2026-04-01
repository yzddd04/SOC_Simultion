const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./vulnerable.db");

db.serialize(() => {
  // Create Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    role TEXT,
    secret_note TEXT
  )`);

  // Create Messages table for XSS
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample data
  db.run(
    `INSERT INTO users (username, password, role, secret_note) VALUES (?, ?, ?, ?)`,
    [
      "admin",
      "p4ssw0rd123",
      "admin",
      "Kunci rahasia server ada di /etc/passwd atau file sistem lainnya. Flag: {SQLI_SUCCESS_ADMIN}",
    ],
  );

  db.run(
    `INSERT INTO users (username, password, role, secret_note) VALUES (?, ?, ?, ?)`,
    ["user1", "qwerty", "user", "Saya suka belajar keamanan web!"],
  );

  db.run(`INSERT INTO messages (user, content) VALUES (?, ?)`, [
    "admin",
    "Selamat datang di lab simulasi keamanan web!",
  ]);

  console.log("Database initialized successfully.");
});

db.close();
