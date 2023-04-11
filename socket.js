const socketIO = require("socket.io");

const configureSocket = (server) => {
    const io = socketIO(server, {
        cors: {
            origin: "*", // Replace with the actual origin (e.g. http://localhost:3000)
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join", (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
        });

        socket.on("message", (roomId, message) => {
            console.log(`Message in room ${roomId}:`, message);
            socket.to(roomId).emit("message", message);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
};

module.exports = configureSocket;

// const http = require("http");
// const socketIO = require("socket.io");
// const app = require("./app");
//
// const server = http.createServer(app);
// const io = socketIO(server, {
//     cors: {
//         origin: "*", // Replace with the actual origin (e.g. http://localhost:3000)
//         methods: ["GET", "POST"],
//     },
// });
// io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);
//
//     socket.on("join", (roomId) => {
//         socket.join(roomId);
//         console.log(`User ${socket.id} joined room ${roomId}`);
//     });
//
//     socket.on("message", (roomId, message) => {
//         console.log(`Message in room ${roomId}:`, message);
//         socket.to(roomId).emit("message", message);
//     });
//
//     socket.on("disconnect", () => {
//         console.log("User disconnected:", socket.id);
//     });
// });
//
// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
//
// module.exports = io;
