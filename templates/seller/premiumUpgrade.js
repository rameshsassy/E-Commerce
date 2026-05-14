/** Premium seller upgrade confirmation */
export default function premiumUpgrade(name, dashboardLink) {
  return `
    <h2>Congratulations, ${name}! You're now a Premium Seller ⭐</h2>
    <p>Your <b>Aashansh Premium</b> subscription is <b>active</b>.</p>
    <ul>
      <li>📦 <b>Bulk purchase</b> option on your products</li>
      <li>🤝 Direct <b>B2B inquiries</b> and wholesale leads</li>
      <li>💬 Tools to negotiate quantity, pricing, and shipping</li>
      <li>🏅 <b>Premium seller</b> visibility and trust with buyers</li>
    </ul>
    <p><a href="${dashboardLink}">Open your seller dashboard</a></p>
    <p>— Team Aashansh</p>
  `;
}
