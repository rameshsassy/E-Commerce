import { appBaseUrl } from "../_helpers.js";

export default function monthlyInsights(seller, insights) {
  const dash = `${appBaseUrl()}/seller/analytics`;
  return `
    <h2>Monthly growth insights 📈</h2>
    <p>Hi ${seller.firstName || "there"},</p>
    <p>Your marketplace activity this month:</p>
    <ul>
      <li><b>Total orders:</b> ${insights.ordersCount ?? 0}</li>
      <li><b>Revenue:</b> ₹${(insights.revenue ?? 0).toLocaleString("en-IN")}</li>
      <li><b>Growth note:</b> ${insights.note || "Focus on bestsellers and seasonal demand."}</li>
    </ul>
    <p><a href="${dash}">View analytics</a></p>
    <p>— Team Aashansh</p>
  `;
}
