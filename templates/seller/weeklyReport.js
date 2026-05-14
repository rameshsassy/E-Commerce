import { appBaseUrl } from "../_helpers.js";

export default function weeklyReport(seller, summary) {
  const dash = `${appBaseUrl()}/seller/dashboard`;
  return `
    <h2>Your weekly performance 📊</h2>
    <p>Hi ${seller.firstName || "there"},</p>
    <p>Here's a snapshot of your store this week:</p>
    <ul>
      <li><b>Orders:</b> ${summary.ordersCount ?? 0}</li>
      <li><b>Revenue (completed payments):</b> ₹${(summary.revenue ?? 0).toLocaleString("en-IN")}</li>
      <li><b>Products listed:</b> ${summary.productsCount ?? 0}</li>
    </ul>
    <p><a href="${dash}">Seller Dashboard</a></p>
    <p>Keep up the great work — buyers love authentic craft.</p>
    <p>— Team Aashansh</p>
  `;
}
