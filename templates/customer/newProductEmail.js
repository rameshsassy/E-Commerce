import { appBaseUrl } from "../_helpers.js";

export default function newProductEmail(customerName, productTitle, productUrl) {
  return `
    <h2>New on Aashansh ✨</h2>
    <p>Hi ${customerName || "there"},</p>
    <p>A product you might like just went live: <b>${productTitle}</b>.</p>
    <p><a href="${productUrl}">View product</a></p>
    <p>You're receiving this because you opted in to new product alerts.</p>
    <p>— Team Aashansh</p>
  `;
}
