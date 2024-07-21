import TelegramBot from 'node-telegram-bot-api'
import env from 'dotenv';
import moment_timezone from 'moment-timezone'
import {readConfig} from "./config.mjs";
import {readSheetWithRange} from "./accessSheets.mjs";

env.config()
// Replace with your Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const timezone = 'Asia/Singapore'
const month = moment_timezone().tz(timezone).format('MMMM')
const this_date = moment_timezone().tz(timezone).format('DD')
const currentHour = moment_timezone().tz(timezone).hours();

// bot.onText(/\/start/, (msg) => {
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.info(`input is ${msg.text}`);

    const inlineKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Remembrance', callback_data: 'remembrance' },
                    { text: 'Sign up Open Jio', callback_data: 'open_jio_form' },
                ],
                [{ text: 'church website', url: 'https://calvarypandan.sg/' }]
            ]
        }
    };

    bot.sendMessage(chatId, 'Welcome! Choose an option:', inlineKeyboard);
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    let current_moment = "Morning"
    if (currentHour >= 12) {
        current_moment = "Evening"
    }

    if ('remembrance' === data.toLowerCase()) {
        // bot.sendMessage(message.chat.id, 'You opened the menu.');
        let spreadId = await readConfig('remembrance_telegram')
        let jsons = await readSheetWithRange(spreadId, `${month}!A1:B62`)

        let json = ''
        jsons.forEach((value, key) => {
            const rem_date = value[0]
            // console.info( `content is ${content}, type of ${typeof content}` )
            if (rem_date == this_date && value[1].includes(current_moment)) {
                console.info(`content is ${value[1]}, type of ${typeof value[1]}`)
                json = value[1]
            }
        })

        let content = json
        bot.sendMessage(message.chat.id, content);
    } //end of remembrance

    if( 'open_jio_form' === data.toLowerCase() ){
        const keyboard = {
            reply_markup: {
                keyboard: [
                    [{ text: 'Button 1' }, { text: 'Button 2' }],
                    [{ text: 'Button 3' }, { text: 'Button 4' }]
                ],
                resize_keyboard: true,
                one_time_keyboard: false
            }
        };

        bot.sendMessage(chatId, 'Choose an open jio:', keyboard);
    }  //end of open jio

    // bot.answerCallbackQuery(callbackQuery.id);
});

// Additional message handlers can be added here
