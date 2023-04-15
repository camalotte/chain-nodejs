const socketIO = require("socket.io");

const configureSocket = (server) => {
    const userSockets = {}; // Add this line to define the userSockets object

    const io = socketIO(server, {
        cors: {
            origin: "*", // Replace with the actual origin (e.g. http://localhost:3000)
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const username = socket.handshake.query.username;
        console.log(`User connected: ${username} (socket ID: ${socket.id})`);

        // Add the socket to the userSockets mapping
        userSockets[username] = socket;

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${username} (socket ID: ${socket.id})`);
            // Remove the socket from the userSockets mapping
            delete userSockets[username];
        });
    });

    // Return the updated io object with the userSockets mapping
    return { io, userSockets };
};

module.exports = configureSocket;
