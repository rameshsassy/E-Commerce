/** Seller welcome after signup */
export default function sellerWelcome(name, dashboardLink) {
  return `
    <h2>Welcome ${name}! 🚀</h2>
    <p>Welcome to <b>Aashansh</b>!</p>
    <p>You're officially a seller now — which means:</p>
    <ul>
      <li>📦 Your products are ready to shine</li>
      <li>💰 Your business just went online</li>
      <li>📈 Growth is now just a few clicks away</li>
    </ul>
    <p><b>Here's what you can do next:</b></p>
    <ul>
      <li>✔️ Add your products</li>
      <li>✔️ Set pricing and stock</li>
      <li>✔️ Start reaching real customers</li>
    </ul>
    <p>👉 <a href="${dashboardLink}">Welcome to Seller Platform — open your dashboard</a></p>
    <p>Let's build something amazing together.</p>
    <br/>
    <p><b>Best regards,</b><br/>Team Aashansh</p>
    <p><i>P.S. That first order notification? It's going to feel awesome 🔔</i></p>
  `;
}
