const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// === Supabase setup ===
const SUPABASE_URL = 'https://twsjtdnygfxmgjvczvkx.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_SERVICE_KEY'; // Replace this with your service key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === Telegram Bot Token ===
const BOT_TOKEN = '7904940307:AAFOaeYHuyiMCsG56ciDRdiRuzem04OQlNo';


// === Handle Booking Submission ===
app.post('/bookings', async (req, res) => {
  const data = req.body;

  const publicMessage = `
🚕 *New Booking Available*
🛣 Trip Type: *${data.tripType}*
🚗 Car Type: *${data.carType}*
📍 From: *${data.pickupLocation}*
📍 To: *${data.dropLocation}*
🕓 Pickup: *${data.pickupTime}*
💰 Tariff: *${data.tariff}*
🌙 Night Charges: ₹100 (10 PM – 5 AM)

👉 Click *Accept* if you're available.
  `;

  try {
    // Fetch all group IDs from Supabase
    const { data: groups, error } = await supabase
      .from('telegram_groups')
      .select('group_id');

    if (error || !groups || groups.length === 0) {
      return res.status(400).json({ error: 'No Telegram groups saved' });
    }

    // Send message to all groups
    for (const group of groups) {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: group.group_id,
        text: publicMessage,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Accept', callback_data: 'accept_booking' },
              { text: '❌ Skip', callback_data: 'skip_booking' }
            ]
          ]
        }
      });
    }

    res.json({ status: 'ok', message: 'Booking posted to groups' });

  } catch (err) {
    console.error('Error sending booking:', err);
    res.status(500).json({ error: 'Failed to send booking' });
  }
});


// === Handle Accept/Skip Button ===
app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
  const body = req.body;

  if (body.callback_query) {
    const chatId = body.callback_query.message.chat.id;
    const user = body.callback_query.from;
    const action = body.callback_query.data;

    let text = '';
    if (action === 'accept_booking') {
      text = `✅ *${user.first_name}* accepted this booking. Contact will be shared privately.`;
    } else {
      text = `❌ *${user.first_name}* skipped the booking.`;
    }

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    });
  }

  res.sendStatus(200);
});


// === /getid Command to Save Telegram Group Chat ID ===
app.post(`/webhook/getid/${BOT_TOKEN}`, async (req, res) => {
  const body = req.body;

  if (body.message && body.message.text === '/getid') {
    const chat = body.message.chat;

    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return res.sendStatus(200);
    }

    const { data, error } = await supabase
      .from('telegram_groups')
      .upsert([{ group_id: chat.id, group_name: chat.title }]);

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chat.id,
      text: '✅ Group connected successfully!',
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(200);
  }
});


// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Booking bot server running on port ${PORT}`);
});
