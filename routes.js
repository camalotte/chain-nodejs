const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require('./db');
const { addContact, getContactsPromise } = require("./db");
const { getChatHistory } = require("./db");
const { sendMessage } = require("./db");

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
const setupRoutes = (app, userSockets) => {
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
        // Get the current user's username from the JWT payload
        const currentUsername = req.user.username;

        // Get the contact's username from the request body
        const contactUsername = req.body.contactUsername;

        if (!contactUsername) {
            res.status(400).json({ message: "Contact username is missing" });
            return;
        }

        // Check if the contact is already in the current user's contact list
        try {
            const existingContacts = await getContactsPromise(currentUsername);
            const contactExists = existingContacts.some(
                (contact) => contact.contact_username === contactUsername
            );

            if (contactExists) {
                res.status(409).json({ message: "Contact already exists" });
                return;
            }
        } catch (error) {
            console.error("Error checking for existing contacts:", error);
            res.status(500).json({ message: "Error checking for existing contacts" });
            return;
        }

        // Add the contact to the current user's contact list
        try {
            await addContact(currentUsername, contactUsername);
            res.status(201).json({ message: "Contact added successfully" });
        } catch (error) {
            console.error("Error adding contact:", error);
            res.status(500).json({ message: "Error adding contact" });
        }
    });

    app.get("/contacts", authenticateJWT, async (req, res) => {
        const currentUsername = req.user.username;

        try {
            const contacts = await getContactsPromise(currentUsername);
            res.status(200).json(contacts);
        } catch (error) {
            console.error("Error fetching contacts:", error);
            res.status(500).json({ message: "Error fetching contacts" });
        }
    });

    // Add this code to your existing routes in the routes.js file
    app.get("/chat-history/:contactUsername", authenticateJWT, async (req, res) => {
        try {
            // Get the current user's username from the JWT payload
            const currentUsername = req.user.username;
            // Get the contact's username from the request params
            const contactUsername = req.params.contactUsername;
            // Fetch the chat history between the current user and the contact
            const chatHistory = await getChatHistory(currentUsername, contactUsername);
            // Return the chat history as a JSON array
            res.status(200).json(chatHistory);
        } catch (error) {
            console.error("Error fetching chat history:", error);
            res.status(500).json({ message: "Error fetching chat history" });
        }
    });

    app.post("/send-message/:contactUsername", authenticateJWT, async (req, res) => {
        try {
            // Get the current user's username from the JWT payload
            const currentUsername = req.user.username;

            // Get the contact's username from the request params
            const contactUsername = req.params.contactUsername;

            // Get the message content from the request body
            const messageContent = req.body.messageContent;

            // Insert the new message into the messages table
            const messageId = await sendMessage(currentUsername, contactUsername, messageContent);

            // Prepare the message object
            // const message = {
            //     sender_username: currentUsername,
            //     recipient_username: contactUsername,
            //     content: messageContent,
            //     timestamp: new Date().toISOString(),
            // };

            // Emit a real-time event to notify the receiver about the new message
            if (userSockets[contactUsername]) {
                userSockets[contactUsername].emit("message", {
                    messageId,
                    sender: currentUsername,
                    content: messageContent,
                    timestamp: new Date().toISOString(),
                });
            }

            // Return the message ID in the response
            res.status(201).json({ messageId });
        } catch (error) {
            console.error("BE Error sending message:", error.message, error.stack);
            res.status(500).json({ message: "Error sending message" });
        }
    });
};
module.exports = setupRoutes;
