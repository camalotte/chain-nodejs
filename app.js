const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const jwtSecret = "secret-key"; // Change this to a more secure key
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(" ")[1];

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

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
        function (err) {
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
            const token = jwt.sign({ username: user.username }, jwtSecret, {
                expiresIn: "1h",
            });
            res.status(200).json({ message: "Login successful", user, token });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(400).json({ message: "Error logging in" });
    }
});
app.get("/hub", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: "Authorization header is missing" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = jwt.verify(token, jwtSecret);
        // You can use decodedToken.username to get the username from the JWT
        // Perform any data fetching or processing you need for the user's hub page here
        res.status(200).json({ message: "Lets get discovering", username: decodedToken.username });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const searchUsers = (query) => {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT username FROM users WHERE username LIKE ?",
            [`%${query}%`],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
};
app.get("/search", async (req, res) => {
    const { query } = req.query;

    if (!query) {
        res.status(400).json({ message: "Search query is missing" });
        return;
    }

    try {
        const users = await searchUsers(query);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error searching for users" });
    }
});
app.get("/chats", authenticateJWT, async (req, res) => {
    const { user } = req.query;

    if (!user) {
        res.status(400).json({ message: "User parameter is missing" });
        return;
    }
    // ...
    try {
        // Replace the following with the actual logic to fetch chats for the user
        const chats = [
            `Chat with ${user} 1`,
            `Chat with ${user} 2`,
            `Chat with ${user} 3`,
        ];

        res.status(200).json({ chats });
    } catch (error) {
        res.status(500).json({ message: "Error fetching chats for user" });
    }
});
