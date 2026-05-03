    // 📩 CUSTOMER WELCOME EMAIL
    export const customerWelcomeTemplate = (name, websiteLink) => {
        return `
        <h2>Welcome ${name}! 🎉</h2>
    
        <p>Welcome to <b>Aashansh</b>!</p>
    
        <p>You’re now part of a place where:</p>
        <ul>
            <li>🛒 Carts get filled (sometimes a little too easily 😄)</li>
            <li>💳 “Just browsing” turns into “Okay, I’ll take it”</li>
            <li>📦 Deliveries feel like mini celebrations</li>
        </ul>
    
        <p>We’re super excited to have you with us!</p>
    
        <p>👉 <a href="${websiteLink}">Start exploring</a></p>
    
        <p>If you need anything, we’re always here to help.</p>
    
        <br/>
        <p><b>Happy shopping,</b><br/>Team Aashansh</p>
    
        <p><i>P.S. Your cart is already waiting… no pressure 😉</i></p>
        `;
    };
    
    // 📩 SELLER WELCOME EMAIL
    export const sellerWelcomeTemplate = (name, dashboardLink) => {
        return `
        <h2>Welcome ${name}! 🚀</h2>
    
        <p>Welcome to <b>Aashansh</b>!</p>
    
        <p>You’re officially a seller now — which means:</p>
        <ul>
            <li>📦 Your products are ready to shine</li>
            <li>💰 Your business just went online</li>
            <li>📈 Growth is now just a few clicks away</li>
        </ul>
    
        <p><b>Here’s what you can do next:</b></p>
        <ul>
            <li>✔️ Add your products</li>
            <li>✔️ Set pricing and stock</li>
            <li>✔️ Start reaching real customers</li>
        </ul>
    
        <p>👉 <a href="${dashboardLink}">Go to your dashboard</a></p>
    
        <p>Let’s build something amazing together.</p>
    
        <br/>
        <p><b>Best regards,</b><br/>Team Aashansh</p>
    
        <p><i>P.S. That first order notification? It’s going to feel awesome 🔔</i></p>
        `;
    };