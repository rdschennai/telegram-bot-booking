const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.post('/webhook', async (req, res) => {
  const callback = req.body.callback_query;

  if (!callback) return res.sendStatus(200);

  const action = callback.data;
  const message_id = callback.message.message_id;
  const chat_id = callback.message.chat.id;

  let statusText = '';
  if (action === 'accept') {
    statusText = '✅ Booking Accepted!';
  } else if (action === 'skip') {
    statusText = '⏭️ Booking Skipped!';
  }

  await axios.post(`${TELEGRAM_API}/editMessageText`, {
    chat_id,
    message_id,
    text: `${callback.message.text}\n\n*Status:* ${statusText}`,
    parse_mode: 'Markdown'
  });

  await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
    callback_query_id: callback.id,
    text: `You chose: ${statusText}`
  });

  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Bot is live!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));