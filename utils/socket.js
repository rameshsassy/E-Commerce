// Due to network proxy issues preventing npm install socket.io,
// this acts as a mocked stub to prevent server crashes.

export const initSocket = (server) => {
  console.log("Socket.io initialization skipped (Offline Mode)");
  return null;
};

export const getIO = () => {
  return null;
};

export const sendNotificationToUser = (userId, notificationData) => {
  console.log(`[MOCK SOCKET] Notification sent to user ${userId}:`, notificationData.title);
};
