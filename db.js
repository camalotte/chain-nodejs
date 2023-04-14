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


module.exports = {
    db,
    addContact,
    getContactsPromise,
};
