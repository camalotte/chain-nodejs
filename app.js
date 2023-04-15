const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const setupRoutes = require("./routes");
const http = require("http");
const server = http.createServer(app);
const configureSocket = require("./socket");
const db = require("./db");     //WARNING: Unused constant db

const { userSockets } = configureSocket(server, {
    cors: {
        origin: "*", // Replace with the actual origin (e.g. http://localhost:3000)
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Set up the routes
setupRoutes(app, userSockets);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
