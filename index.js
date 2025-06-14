const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = '7904940307:AAFOaeYHuyiMCsG56ciDRdiRuzem04OQlNo';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Manual fallback company info
const COMPANY_NAME = 'My Logistics Pvt Ltd'; // change as needed
const REGISTERED_MOBILE = '+91 9876543210';   // change as needed

// In-memory booking storage (for demo only)
const bookings = {}; // { messageId: { name, mobile, pickup, drop, ... } }

app.post('/webhook', async (req, res) => {
  const callback = req.body.callback_query;
  if (!callback) return res.sendStatus(200);
  res.sendStatus(200); // Respond immediately

  const action = callback.data;
  const message_id = callback.message.message_id;
  const chat_id = callback.message.chat.id;
  const driver_id = callback.from.id;
  const driver_name = `${callback.from.first_name || ''} ${callback.from.last_name || ''}`.trim();

  const booking = bookings[message_id];
  if (!booking) return;

  const updatedText = `🏢 *${COMPANY_NAME}*\n📱 *${REGISTERED_MOBILE}*\n\n` +
    `🆕 *Booking Confirmed!*\n\n` +
    `🚘 *Trip:* ${booking.tripType}\n🚗 *Car:* ${booking.carType}\n📍 *Pickup:* ${booking.pickup}\n` +
    `${booking.tripType !== 'Local Round Trip' ? `🔻 *Drop:* ${booking.drop}\n` : ''}` +
    `🗓️ *Date & Time:* ${booking.pickupDate} ${booking.pickupTime}\n💵 *Tariff:* ${booking.tariff}\n` +
    `👨‍✈️ *Driver:* ${driver_name}\n📞 *Driver Contact:* Not Set`;

  await axios.post(`${TELEGRAM_API}/editMessageText`, {
    chat_id,
    message_id,
    text: updatedText,
    parse_mode: 'Markdown'
  });

  // Send private message to driver with customer info
  const customerMessage = `📦 *New Booking Assigned to You*\n\n` +
    `👤 *Customer:* ${booking.name}\n📞 *Mobile:* ${booking.mobile}\n\n` +
    `🚘 *Trip:* ${booking.tripType}\n🚗 *Car:* ${booking.carType}\n` +
    `📍 *Pickup:* ${booking.pickup}\n${booking.tripType !== 'Local Round Trip' ? `🔻 *Drop:* ${booking.drop}\n` : ''}` +
    `🗓️ *Date & Time:* ${booking.pickupDate} ${booking.pickupTime}`;

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: driver_id,
    text: customerMessage,
    parse_mode: 'Markdown'
  });
});

// Endpoint to receive booking from frontend
app.post('/new-booking', async (req, res) => {
  const data = req.body;

  const message = `🏢 *${COMPANY_NAME}*\n📱 *${REGISTERED_MOBILE}*\n\n` +
    `🆕 *New Booking*\n\n` +
    `🚘 *Trip:* ${data.tripType}\n🚗 *Car:* ${data.carType}\n📍 *Pickup:* ${data.pickup}\n` +
    `${data.tripType !== 'Local Round Trip' ? `🔻 *Drop:* ${data.drop}\n` : ''}` +
    `🗓️ *Date & Time:* ${data.pickupDate} ${data.pickupTime}\n💵 *Tariff:* ${data.tariff}`;

  const sendRes = await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: '-1002808640689',
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Accept", callback_data: "accept" }
      ]]
    }
  });

  if (sendRes.data.ok) {
    const messageId = sendRes.data.result.message_id;
    bookings[messageId] = data;
  }

  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.send('Bot is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const cors = require('cors');
app.use(cors());
const cors = require('cors');
app.use(cors());
