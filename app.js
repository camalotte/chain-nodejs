const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// const users = new Map();

const db = new sqlite3.Database(":memory:", (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Connected to the in-memory SQLite database.");
});
db.run(
    `CREATE TABLE users (
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

const loginUser = async (username, password) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
            if (err) {
                reject(err);
            }
            if (!row) {
                resolve(null);
            } else {
                const passwordMatch = await bcrypt.compare(password, row.password);
                if (!passwordMatch) {
                    resolve(null);
                } else {
                    resolve({ username: row.username, password: row.password });
                }
            }
        });
    });
};

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: "Missing username or password" });
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashedPassword],
        (err) => {
            if (err) {
                res.status(409).json({ message: "Username already exists" });
                return;
            }
            console.log("Registered user:", username);
            res.status(201).json({ message: "User registered successfully" });
        }
    );
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginUser(username, password);
        if (user) {
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(400).json({ message: "Error logging in" });
    }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
