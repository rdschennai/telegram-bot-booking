const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = '7904940307:AAFOaeYHuyiMCsG56ciDRdiRuzem04OQlNo';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.post('/webhook', async (req, res) => {
  const callback = req.body.callback_query;
  if (!callback) return res.sendStatus(200);

  const chat_id = callback.message.chat.id;
  const message_id = callback.message.message_id;
  const originalText = callback.message.text;

  const updatedText = `${originalText}\n\n✅ *Booking Confirmed!*`;

  // Edit the message with new status and remove buttons
  await axios.post(`${TELEGRAM_API}/editMessageText`, {
    chat_id,
    message_id,
    text: updatedText,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [] }
  });

  // Respond to button click
  await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
    callback_query_id: callback.id,
    text: 'Booking confirmed!'
  });

  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Telegram bot is live!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
