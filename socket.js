const socketIO = require("socket.io");

const configureSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: "*", // Replace with the actual origin (e.g. http://localhost:3000)
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const username = socket.handshake.query.username;
        console.log(`User connected: ${username} (socket ID: ${socket.id})`);

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${username} (socket ID: ${socket.id})`);
        });
    });

    return io;
};

module.exports = configureSocket;
