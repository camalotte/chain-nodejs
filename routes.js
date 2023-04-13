const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const jwtSecret = "secret-key"; // Change this to a more secure key
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
const setupRoutes = (app) => {
    app.post("/register", async (req, res) => {
        const {username, password} = req.body;
        if (!username || !password) {
            res.status(400).json({message: "Missing username or password"});
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, hashedPassword],
            function (err) {
                if (err) {
                    res.status(409).json({message: "Username already exists"});
                    return;
                }
                console.log("Registered user:", username);
                res.status(201).json({message: "User registered successfully"});
            }
        );
    });
    app.post("/login", async (req, res) => {
        try {
            const {username, password} = req.body;
            const user = await loginUser(username, password);
            if (user) {
                const token = jwt.sign({username: user.username}, jwtSecret, {
                    expiresIn: "1h",
                });
                res.status(200).json({message: "Login successful", user, token});
            } else {
                res.status(401).json({message: "Invalid credentials"});
            }
        } catch (error) {
            res.status(400).json({message: "Error logging in"});
        }
    });

    app.get("/hub", async (req, res) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({message: "Authorization header is missing"});
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            const decodedToken = jwt.verify(token, jwtSecret);
            // You can use decodedToken.username to get the username from the JWT
            // Perform any data fetching or processing you need for the user's hub page here
            res.status(200).json();
        } catch (error) {
            res.status(401).json({message: "Invalid token"});
        }
    });

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
            console.error("Error searching for users:", error); // Add this line for error logging
            res.status(500).json({ message: "Error searching for users" });
        }
    });

    app.post("/add-contact", authenticateJWT, async (req, res) => {
        const { contactUsername } = req.body;
        const currentUsername = req.user.username;

        try {
            // Check if the contact already exists
            const existingContact = await Contact.findOne({ username: currentUsername, contactUsername });
            if (existingContact) {
                res.status(400).json({ message: "Contact already exists" });
                return;
            }

            // Add the contact to the database
            const newContact = new Contact({
                username: currentUsername,
                contactUsername,
            });
            await newContact.save();

            // Return a success message
            res.status(200).json({ message: "Contact added successfully" });
        } catch (error) {
            console.error("Error adding contact:", error); // Add this line for error logging
            res.status(500).json({ message: "Error adding contact" });
        }
    });


};
module.exports = setupRoutes;
