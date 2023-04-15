const sqlite3 = require("sqlite3").verbose();
const dbName = "chat.db";
const db = new sqlite3.Database(dbName, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Connected to the SQLite database.");
});

// const db = new sqlite3.Database("./users.db", (err) => {
//     if (err) {
//         console.error(err.message);
//     }
//     console.log("Connected to the SQLite database.");
// });
db.serialize(() => {
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
        `CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            contact_username TEXT,
            FOREIGN KEY (username) REFERENCES users (username),
            FOREIGN KEY (contact_username) REFERENCES users (username)
        )`
    );
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_username TEXT NOT NULL,
            recipient_username TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL
        );
    `, (err) => {
        if (err) {
            console.error("Error setting up database schema:", err);
        } else {
            console.log("Database schema set up successfully");
        }
    });
});

const addContact = (username, contactUsername) => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO contacts (username, contact_username) VALUES (?, ?)",
            [username, contactUsername],
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
};
const getContactsPromise = (username) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT contact_username FROM contacts WHERE username = ?";
        db.all(query, [username], (error, rows) => {
            if (error) {
                console.error("Error getting contacts:", error);
                reject(error);
            } else {
                const contacts = rows.map((row) => ({
                    contact_username: row.contact_username,
                }));
                resolve(contacts);
            }
        });
    });
};
const getChatHistory = (username1, username2) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM messages
            WHERE (sender_username = ? AND recipient_username = ?)
            OR (sender_username = ? AND recipient_username = ?)
            ORDER BY timestamp ASC;
        `;
        db.all(query, [username1, username2, username2, username1], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};
const sendMessage = (senderUsername, recipientUsername, messageContent) => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString();
        const query = `
            INSERT INTO messages (sender_username, recipient_username, content, timestamp)
            VALUES (?, ?, ?, ?);
        `;
        db.run(query, [senderUsername, recipientUsername, messageContent, timestamp], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

module.exports = {
    db,
    addContact,
    getContactsPromise,
    getChatHistory,
    sendMessage,
};
