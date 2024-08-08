import express from 'express';
import bodyParser from 'body-parser';
import env from 'dotenv';
import {handleCallback, handleMsg} from "./dispatcher.mjs";
import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";
import {cleanStates} from "./userstat.mjs";
import logger from "./service/logger.mjs";

env.config()

let API_TOKEN = process.env.TELEGRAM_BOT_TOKEN
let WEBHOOK_PATH = process.env.WEBHOOK_PATH

const app = express()
app.use(bodyParser.json())

const bot = new TelegramBot(API_TOKEN);

cron.schedule('* * * * *', () => {
    logger.info("Running a task every minute")
    cleanStates()
});

app.post(`/${WEBHOOK_PATH}`, (req, res) => {
    const update = req.body
    console.info(`message is ${JSON.stringify(update)}`)
    if (update.message) {
        handleMessage(update.message);
    } else if (update.callback_query) {
        handleCallbackQuery(update.callback_query);
    }

    res.sendStatus(200);
});

const handleMessage = (message) => {
    handleMsg(message, bot)
};

const handleCallbackQuery = (callbackQuery) => {
    handleCallback(callbackQuery, bot)
};

app.listen(89, async () => {
    console.log('Bot server is running on port 89');
});

app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});


