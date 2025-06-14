app.post('/webhook', (req, res) => {
  const callback = req.body.callback_query;
  if (!callback) return res.sendStatus(200);

  // Send 200 immediately to avoid delay
  res.sendStatus(200);

  const chat_id = callback.message.chat.id;
  const message_id = callback.message.message_id;
  const originalText = callback.message.text;

  const updatedText = `${originalText}\n\n✅ *Booking Confirmed!*`;

  // Update message and remove buttons
  axios.post(`${TELEGRAM_API}/editMessageText`, {
    chat_id,
    message_id,
    text: updatedText,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [] }
  });

  // Optional: Respond to button click (not mandatory)
  axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
    callback_query_id: callback.id,
    text: 'Booking confirmed!'
  });
});
