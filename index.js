require('dotenv').config();
// imports
const TelegramBot = require('node-telegram-bot-api');

// initilization

const bot = new TelegramBot(process.env.BOT_TOEKN, { polling: true });

bot.on('message', (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello dear user');
});
