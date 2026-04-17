const twilio = require("twilio");

const client = twilio(
  "ACb5e7455f3e2aac88894d98947c86049e",  // SID
  "359eb36118dca1d133f01edade79ae85"     // Auth Token
);

async function sendWhatsAppMessage(to, message) {
  try {
    await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio Sandbox Number
      to: `whatsapp:${to}`,          // ✅ use the "to" parameter passed to function
      body: message,
    });
    console.log(`✅ WhatsApp sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending WhatsApp:", err.message);
  }
}

module.exports = sendWhatsAppMessage;
