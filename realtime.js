/** Socket.IO instance set from server.js — avoids circular imports */
let ioRef = null;

function setIo(io) {
  ioRef = io;
}

/**
 * Notify a user room (client should connect with query userId).
 */
function notifyUser(userId, eventName, payload) {
  if (!ioRef || !userId) return;
  ioRef.to(`user:${userId}`).emit(eventName, payload);
}

module.exports = { setIo, notifyUser };
