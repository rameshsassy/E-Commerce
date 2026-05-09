// MOCK PUSH NOTIFICATION SERVICE (e.g. Firebase Cloud Messaging / OneSignal)

export const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    console.log(`[PUSH NOTIFICATION] To: ${userId}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log(`Data:`, data);
    
    // In production, integrate with FCM or OneSignal
    // const payload = { notification: { title, body: message }, data };
    // await admin.messaging().sendToDevice(userDeviceToken, payload);
    
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

// Ready to use notification triggers
export const notifyOrderConfirmed = async (userId, orderId) => {
  await sendPushNotification(userId, "Order Confirmed! 🎉", `Your order #${orderId.toString().slice(-8)} has been placed successfully.`);
};

export const notifyShipmentUpdate = async (userId, status) => {
  await sendPushNotification(userId, "Shipment Update 📦", `Your package status is now: ${status}`);
};

export const notifyRefundUpdate = async (userId, amount) => {
  await sendPushNotification(userId, "Refund Processed 💸", `A refund of Rs. ${amount} has been initiated.`);
};
