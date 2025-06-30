// otpSocketServer.js

const { Server } = require('socket.io');

// This will hold the userId ↔ socket mapping
const userSockets = new Map();

function setupSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: ['https://zupito-frontend.onrender.com'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected');

    socket.on('register', (userId) => {
      userSockets.set(userId, socket);
      console.log(`📌 User ${userId} registered`);
    });

    socket.on('disconnect', () => {
      for (const [userId, s] of userSockets.entries()) {
        if (s === socket) {
          userSockets.delete(userId);
          console.log(`❌ User ${userId} disconnected`);
        }
      }
    });
  });
}
function sendOtpToUser(userId, bikeCode) {
  console.log('👥 Connected users:', Array.from(userSockets.keys()));
  const socket = userSockets.get(userId);
  if (!socket) {
    console.log(`⚠️ No socket for user ${userId}`);
    return null;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  socket.emit('otp', { otp, bikeCode });
  console.log(`📨 Sent OTP ${otp} to ${userId}`);
  return otp;
}

module.exports = {
  setupSocketServer,
  sendOtpToUser,
};
