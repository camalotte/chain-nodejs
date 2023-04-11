const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const db = require("./db");
const setupRoutes = require("./routes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Set up the routes
setupRoutes(app);

const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*", // Replace with the actual origin (e.g. http://localhost:3000)
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
