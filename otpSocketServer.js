const { Server } = require('socket.io');

// Map of connected userId ↔ socket
const userSockets = new Map();

/**
 * Initializes the Socket.IO server.
 */
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

    // 🔐 Register userId ↔ socket
    socket.on('register', (userId) => {
      if (!userId) {
        console.warn('⚠️ register event received without userId');
        return;
      }
      userSockets.set(userId, socket);
      console.log(`✅ User registered: ${userId}`);
    });

    // ❌ Cleanup on disconnect
    socket.on('disconnect', () => {
      for (const [userId, s] of userSockets.entries()) {
        if (s === socket) {
          userSockets.delete(userId);
          console.log(`🛑 User disconnected: ${userId}`);
        }
      }
    });
  });

  return io; // Return io instance for app.set('io', io)
}

/**
 * Emits OTP to the socket registered with given userId.
 */
function sendOtpToUser(userId, bikeCode) {
  const socket = userSockets.get(userId);

  if (!socket) {
    console.warn(`⚠️ No active socket for user ${userId}`);
    return null;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  socket.emit('otp', { otp, bikeCode });
  console.log(`📨 Sent OTP ${otp} to user ${userId} for bike ${bikeCode}`);
  return otp;
}

module.exports = {
  setupSocketServer,
  sendOtpToUser,
};
