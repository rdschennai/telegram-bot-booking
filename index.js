const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = 'https://twsjtdnygfxmgjvczvkx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
    const data = req.body;

    if (data?.message?.text === '/getid') {
        const chat = data.message.chat;
        if (chat.type === 'group' || chat.type === 'supergroup') {
            const { id, title } = chat;
            const { data: saved, error } = await supabase
                .from('group_ids')
                .upsert({ group_id: id, group_name: title }, { onConflict: 'group_id' });

            return res.send({
                text: error ? '❌ Failed to save group ID.' : `✅ Group ID saved: ${id}`,
            });
        } else {
            return res.send({ text: '❌ Use this command in a group.' });
        }
    }

    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('🚗 Telegram Booking Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});