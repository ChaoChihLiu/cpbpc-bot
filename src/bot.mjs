import TelegramBot from 'node-telegram-bot-api'
import env from 'dotenv';
import {handleCallback, handleMsg} from "./msgHandler.mjs";


env.config()
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// bot.onText(/\/start/, (msg) => {
bot.on('message', (msg) => {
    handleMsg(msg, bot)
});

// Handle callback queries
bot.on('callback_query', async (msg) => {
    await handleCallback(msg, bot)
});

// Additional message handlers can be added here
