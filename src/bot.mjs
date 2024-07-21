
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import fs from 'fs';
import properties from 'properties';
import {readConfig} from "./config.mjs";
import {readSheetWithRange} from "./accessSheets.mjs";
import moment from "moment/moment.js";
import moment_timezone from 'moment-timezone'
import * as _ from 'lodash';

// Replace 'YOUR_API_TOKEN' with your bot's API token
let API_TOKEN = null;
let TELEGRAM_API_URL = null;
let WEBHOOK_URL = null;

const app = express();
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
    const update = req.body;
    console.info(`message is ${JSON.stringify(update)}`);
    if (update.message) {
        handleMessage(update.message);
    } else if (update.callback_query) {
        handleCallbackQuery(update.callback_query);
    }

    res.sendStatus(200);
});

const handleMessage = async (message) => {
    const chatId = message.chat.id;
    const text = message.text;

    
    if( text && text.length > 0 ){
    // if ('hi' === text.toLowerCase()) {
    //     const keyboard = {
    //         inline_keyboard: [
    //             [
    //                 { text: 'Remembrance', callback_data: 'remembrance' },
    //                 { text: 'Sign up Open Jio', callback_data: 'open_jio_form' }
    //             ]
    //         ]
    //     };
        const keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: 'Button 1' }, { text: 'Button 2' }],
                    [{ text: 'Button 3' }, { text: 'Button 4' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };
        await sendMessage(chatId, 'Please choose:', keyboard);
    } else {
        await sendMessage(chatId, `You said: ${text}`);
    }
};


const timezone = 'Asia/Singapore'
const month = moment_timezone().tz(timezone).format('MMMM')
const this_date = moment_timezone().tz(timezone).format('DD')
const currentHour = moment_timezone().tz(timezone).hours();
const handleCallbackQuery = async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    let current_moment = "Morning"
    if( currentHour >= 12 ){
        current_moment = "Evening"
    }

    if( 'remembrance' === data.toLowerCase() ){
        let spreadId = await readConfig('remembrance_telegram')
        let jsons = await readSheetWithRange(spreadId, `${month}!A1:B62`)

        let json = ''
        jsons.forEach((value, key) =>{
            const rem_date = value[0]
            // console.info( `content is ${content}, type of ${typeof content}` )
            if( rem_date == this_date && value[1].includes(current_moment) ){
                console.info( `content is ${value[1]}, type of ${typeof value[1]}` )
                json = value[1]
            }
        })

        let content = json
        await sendMessage(chatId, content);
    }

    if( 'open_jio_form' === data.toLowerCase() ){
        const keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: 'Button 1' }, { text: 'Button 2' }],
                    [{ text: 'Button 3' }, { text: 'Button 4' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };

        await sendMessage(chatId, 'Choose an option:', keyboard);
    }

    // await sendMessage(chatId, `You selected option: ${data}`);
};

const sendMessage = async (chatId, text, replyMarkup = null) => {
    const url = `${TELEGRAM_API_URL}sendMessage`;
    console.info( `send message url is ${url}` );
    let payload = null;
    if ( replyMarkup ){
        payload = {
            chat_id: chatId,
                text: text,
            reply_markup: replyMarkup
        };
    }
    if ( !replyMarkup ){
        payload = {
            chat_id: chatId,
            text: text
        };
    }

    // await fetch(url, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload)
    // });

    try {
        console.info(`reply payload is ${text}`)
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, ${JSON.stringify(response.body)}`);
        }

        const data = await response.json();
        console.log('Response from server:', data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
};

const readPropertiesAndSetToken = async (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const obj = properties.parse(data);
        API_TOKEN = obj.telemgram_bot_api_key; // Assuming the key in properties is 'telemgram_bot_api_key'
        TELEGRAM_API_URL = `https://api.telegram.org/bot${API_TOKEN}/`;
        WEBHOOK_URL = `https://rpg-7f76ccf078caba5f.elb.ap-southeast-1.amazonaws.com:88/webhook`;

        console.info( `TELEGRAM_API_URL ${TELEGRAM_API_URL}` );
        console.info( `WEBHOOK_URL ${WEBHOOK_URL}` );
    } catch (error) {
        console.error('Error parsing properties:', error);
    }
};

app.listen(89, async () => {
    console.log('Bot server is running on port 89');
    await readPropertiesAndSetToken('../.secret');
    // checkAndSetWebhook();
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

