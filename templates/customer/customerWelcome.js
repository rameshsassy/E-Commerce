/** Customer welcome after signup */
export default function customerWelcome(name, websiteLink) {
  return `
    <h2>Welcome ${name}! 🎉</h2>
    <p>Welcome to <b>Aashansh</b>!</p>
    <p>You're now part of a place where:</p>
    <ul>
      <li>🛒 Carts get filled (sometimes a little too easily 😄)</li>
      <li>💳 "Just browsing" turns into "Okay, I'll take it"</li>
      <li>📦 Deliveries feel like mini celebrations</li>
    </ul>
    <p>We're super excited to have you with us!</p>
    <p>👉 <a href="${websiteLink}">Start exploring</a></p>
    <p>If you need anything, we're always here to help.</p>
    <br/>
    <p><b>Happy shopping,</b><br/>Team Aashansh</p>
    <p><i>P.S. Your cart is already waiting… no pressure 😉</i></p>
  `;
}
