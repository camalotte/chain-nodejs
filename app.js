const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const users = new Map();
// const loginUser = async (username, password) => {
//     if (!users.has(username)) {
//         return null;
//     }
//     const hashedPassword = users.get(username);
//     const passwordMatch = await bcrypt.compare(password, hashedPassword);
//     if (!passwordMatch) {
//         return null;
//     }
//     return { username };
// }

const loginUser = async (username, password) => {
    console.log("Logging in user:", username);
    console.log("Submitted password:", password);
    if (!users.has(username)) {
        console.log("User not found");
        return null;
    }
    const hashedPassword = users.get(username);
    console.log("Stored hashed password:", hashedPassword);
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    console.log("Password match:", passwordMatch);
    if (!passwordMatch) {
        console.log("Incorrect password");
        return null;
    }
    console.log("Login successful");
    return { username };
}


app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: "Missing username or password" });
        return;
    }
    if (users.has(username)) {
        res.status(409).json({ message: "Username already exists" });
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.set(username, hashedPassword);
    console.log("Registered user:", username);
    res.status(201).json({ message: "User registered successfully" });
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await loginUser(username, password);
        console.log(user);
        if (user) {
            res.status(200).json({ message: "Login successful", username: user.username });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (error) {
        console.log("Error logging in:", error);
        res.status(400).json({ message: "Error logging in" });
    }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
