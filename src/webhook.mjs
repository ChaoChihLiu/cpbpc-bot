import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import env from 'dotenv';
import {handleCallback, handleMsg} from "./msgHandler.mjs";
import TelegramBot from "node-telegram-bot-api";

env.config()

let API_TOKEN = process.env.TELEGRAM_BOT_TOKEN
let TELEGRAM_API_URL = `https://api.telegram.org/bot${API_TOKEN}/`
let WEBHOOK_URL = process.env.WEBHOOK_HOST

const app = express()
app.use(bodyParser.json())

const bot = new TelegramBot(API_TOKEN, { polling: true });

app.post('/webhook', (req, res) => {
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

const checkAndSetWebhook = async () => {
    try {
        console.info(`telegram api url : ${TELEGRAM_API_URL}getWebhookInfo`)
        const getWebhookInfoUrl = `${TELEGRAM_API_URL}getWebhookInfo`;
        const response = await fetch(getWebhookInfoUrl);
        const data = await response.json();

        if (data.result.url !== WEBHOOK_URL) {
            console.log('Setting webhook...');
            const setWebhookUrl = `${TELEGRAM_API_URL}setWebhook?url=${WEBHOOK_URL}`;
            const setResponse = await fetch(setWebhookUrl);
            const setData = await setResponse.json();

            if (setData.ok) {
                console.log('Webhook set successfully');
            } else {
                console.error('Error setting webhook:', setData);
            }
        } else {
            console.log('Webhook is already set');
        }
    } catch (error) {
        console.error('Error checking or setting webhook:', error);
    }
};

