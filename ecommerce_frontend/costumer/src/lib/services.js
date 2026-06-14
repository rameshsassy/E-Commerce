import { api } from "./api";

// ---------- Types ----------

// ---------- Auth ----------
export const authApi = {
  register: (data) => api.post("/auth/customer/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh-token"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post(`/auth/reset-password/${token}`, { password }),
};

// ---------- User / Profile ----------
export const userApi = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  autosaveProfile: (data) => api.patch("/user/profile", data),
  updatePassword: (data) => api.put("/user/update-password", data),
};

// ---------- Customer ----------
export const customerApi = {
  getProfile: () => api.get("/customer/profile"),
  updateEmailPrefs: (data) => api.put("/customer/email-preferences", data),
  listAddresses: () => api.get("/customer/address"),
  addAddress: (data) => api.post("/customer/address", data),
  updateAddress: (id, data) => api.put(`/customer/address/${id}`, data),
  deleteAddress: (id) => api.del(`/customer/address/${id}`),
  createCodOrder: (data) => api.post("/customer/order", data),
  createRazorpayOrder: (data) => api.post("/customer/order/razorpay", data),
  verifyRazorpay: (data) => api.post("/customer/order/razorpay/verify", data),
  listOrders: () => api.get("/customer/orders"),
  getOrder: (id) => api.get(`/customer/orders/${id}`),
};

// ---------- Products ----------
export const productApi = {
  list: (params = {}) => api.get("/products", params),
  get: (id) => api.get(`/products/${id}`),
  checkPincode: (id, pincode) =>
    api.get(`/products/${id}/check-pincode`, { pincode }),
};

export const categoryApi = {
  list: () => api.get("/categories"),
  get: (id) => api.get(`/categories/${id}`),
};

// ---------- Reviews ----------
export const reviewApi = {
  list: (productId, params = {}) =>
    api.get(`/products/${productId}/reviews`, params),
  create: (productId, form) =>
    api.postForm(`/products/${productId}/reviews`, form),
  toggleHelpful: (productId, reviewId) =>
    api.post(`/products/${productId}/reviews/${reviewId}/helpful`),
};

// ---------- Wishlist ----------
export const wishlistApi = {
  list: () => api.get("/wishlist"),
  add: (productId) => api.post("/wishlist", { productId }),
  remove: (productId) => api.del(`/wishlist/${productId}`),
};

// ---------- Cart ----------
export const cartApi = {
  get: () => api.get("/cart"),
  add: (productId, quantity) => api.post("/cart", { productId, quantity }),
  update: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId) => api.del(`/cart/${itemId}`),
  clear: () => api.del("/cart"),
};

// ---------- Coupons ----------
export const couponApi = {
  apply: (code, cartTotal) =>
    api.post("/coupons/customer/apply", { code, cartTotal }),
};

// ---------- Returns ----------
export const returnApi = {
  list: () => api.get("/returns/customer"),
  create: (data) => api.post("/returns/customer", data),
};

// ---------- Support ----------
export const supportApi = {
  list: () => api.get("/support"),
  create: (form) => api.postForm("/support", form),
};

// ---------- Chat ----------
export const chatApi = {
  startConversation: (data) => api.post("/chat/conversations", data),
  listConversations: () => api.get("/chat/conversations"),
  listMessages: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}/messages`),
  send: (conversationId, content) =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content }),
};

// ---------- Notifications ----------
export const notificationApi = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// ---------- Menu / Newsletter ----------
export const publicApi = {
  menu: () => api.get("/menu"),
  newsletter: (email) => api.post("/public/newsletter/subscribe", { email }),
};
