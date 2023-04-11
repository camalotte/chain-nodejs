const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./users.db", (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Connected to the SQLite database.");
});

db.run(
    `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`,
    (err) => {
        if (err) {
            console.error(err.message);
        }
    }
);

db.run(
    `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )`,
    (err) => {
        if (err) {
            console.error(err.message);
        }
    }
);

module.exports = db;
