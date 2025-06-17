// index.js (Render backend)
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Setup Supabase
const supabase = createClient(
  'https://twsjtdnygfxmgjvczvkx.supabase.co',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Replace this with service_role key (not anon)
);

// Setup Telegram Bot
const bot = new TelegramBot('7904940307:AAFOaeYHuyiMCsG56ciDRdiRuzem04OQlNo', {
  polling: true
});

// === Handle /getid command to store group info ===
bot.onText(/\/getid/, async (msg) => {
  const chat = msg.chat;

  if (chat.type === 'group' || chat.type === 'supergroup') {
    const groupId = chat.id;
    const groupTitle = chat.title;

    const { data, error } = await supabase
      .from('telegram_groups')
      .upsert([
        { group_id: groupId, group_name: groupTitle }
      ], { onConflict: ['group_id'] });

    if (error) {
      console.error('Supabase error:', error);
      bot.sendMessage(chat.id, '❌ Failed to register this group.');
    } else {
      bot.sendMessage(chat.id, '✅ This group is now registered for bookings.');
    }
  } else {
    bot.sendMessage(chat.id, '❌ Please use this command from a group.');
  }
});

// === Accept Callback Handler ===
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data === 'accept') {
    bot.sendMessage(message.chat.id, `✅ Accepted by @${callbackQuery.from.username || callbackQuery.from.first_name}`);
  }
});

// === POST route to receive booking and send to all groups ===
app.post('/bookings', async (req, res) => {
  const booking = req.body;

  const { data: groups, error } = await supabase
    .from('telegram_groups')
    .select('*');

  if (error) {
    console.error('Error fetching groups:', error);
    return res.status(500).send('Failed to fetch groups.');
  }

  const companyInfo = `🏢 *${booking.companyName}*\n📞 +91 ${booking.mobileNumber}`;
  const bookingInfo = `
📢 *New Booking*
🚕 Trip: ${booking.tripType}
🚗 Car: ${booking.carType}
📍 Pickup: ${booking.pickupLocation || 'undefined'}
📍 Drop: ${booking.dropLocation || 'undefined'}
🕒 Date & Time: ${booking.pickupTime || 'undefined'}
💰 Tariff: ${booking.tariff || 'undefined'}
  `;

  for (let group of groups) {
    try {
      await bot.sendMessage(group.group_id, `${companyInfo}\n${bookingInfo}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Accept', callback_data: 'accept' }]
          ]
        }
      });
    } catch (err) {
      console.error(`Failed to send to group ${group.group_id}:`, err.message);
    }
  }

  res.send('Booking sent to all groups.');
});

// === Basic Test Route ===
app.get('/', (req, res) => {
  res.send('Telegram Booking Bot is live.');
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
