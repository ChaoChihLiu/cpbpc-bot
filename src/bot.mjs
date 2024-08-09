import TelegramBot from 'node-telegram-bot-api'
import env from 'dotenv';
import {handleCallback, handleMsg} from "./dispatcher.mjs"
import logger from './service/logger.mjs'
import cron from "node-cron"
import {cleanStates} from "./userstat.mjs";


env.config()
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// bot.onText(/\/start/, (msg) => {
bot.on('message', (msg) => {
    try {
        handleMsg(msg, bot)
    } catch (e){
        logger.error(e.message)
    }
});

// Handle callback queries
bot.on('callback_query', async (msg) => {
    try {
        await handleCallback(msg, bot)
    } catch (e){
        logger.error(e.message)
    }
});

cron.schedule('* * * * *', () => {
    logger.info("Running a task every minute")
    cleanStates()
});

// Additional message handlers can be added here
