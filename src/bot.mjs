import TelegramBot from 'node-telegram-bot-api'
import env from 'dotenv';
import moment_timezone from 'moment-timezone'
import {readConfig} from "./config.mjs";
import {readSheetWithRange} from "./accessSheets.mjs"
import mysql from 'mysql2'
import crypto from 'crypto'
import {cleanState, getState, isWaitForInput, keepState} from "./userstat.mjs";


env.config()
// Replace with your Telegram bot token
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const dbConn = mysql.createConnection({
    host: process.env.EN_DB_HOST,
    port: process.env.EN_DB_PORT,
    user: process.env.EN_DB_USER,
    password: process.env.EN_DB_PASS,
    database: process.env.EN_DB
});

function hashInput(input) {
    var input_str = input
    if( (typeof input) !== 'string' ){
        input_str = JSON.stringify(input)
    }

    const hash = crypto.createHash('sha256');
    hash.update(input_str);
    const hashedInput = hash.digest('hex');

    return hashedInput;
}

const timezone = 'Asia/Singapore'

// bot.onText(/\/start/, (msg) => {
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userstat_key = hashInput(msg.from)
    console.info(`input is ${JSON.stringify(msg)}`);
    // console.info( `sha 'from' information ${hashInput(msg.from)}` );

    if( isWaitForInput(userstat_key) ){
        const keyword = msg.text
        const user_state = getState(userstat_key)

        if( user_state.includes('elderpage') ){
            dbConn.query(` select cjr.rp_id 
    from cpbpc_jevents_vevdetail cjv
    left join cpbpc_jevents_vevent cj on cj.ev_id = cjv.evdet_id
    left join cpbpc_categories cc on cc.id = cj.catid
    left join cpbpc_jevents_repetition cjr on cjr.eventdetail_id  = cjv.evdet_id
     where cc.alias in ( 'elder-s-page' )
    and cjv.description like ?
    order by cjv.evdet_id desc
    limit 10
    ;`, [`%${keyword}%`], (error, results, fields) => {
                if (error) {
                    console.error('Error executing query:', error);
                    bot.sendMessage(chatId, 'Oops! Bot has something wrong');
                    return;
                }

                const list = []
                results.forEach((row, key) =>{
                    list[key] = `https://calvarypandan.sg/resources/elders-page/eventdetail/${row['rp_id']}`
                })

                // Print the results
                // console.log('Results:', results);
                bot.sendMessage(chatId, list.join("\n"));
                cleanState(userstat_key)
            });
        }else if( user_state.includes('pastoralchat') ){
            dbConn.query(` select cjr.rp_id 
    from cpbpc_jevents_vevdetail cjv
    left join cpbpc_jevents_vevent cj on cj.ev_id = cjv.evdet_id
    left join cpbpc_categories cc on cc.id = cj.catid
    left join cpbpc_jevents_repetition cjr on cjr.eventdetail_id  = cjv.evdet_id
    where cc.alias in ( 'pastoral-chat' )
    and cjv.description like ?
    order by cjv.evdet_id desc
    limit 10
    ;`, [`%${keyword}%`], (error, results, fields) => {
                if (error) {
                    console.error('Error executing query:', error);
                    bot.sendMessage(chatId, 'Oops! Bot has something wrong');
                    return;
                }

                const list = []
                results.forEach((row, key) =>{
                    list[key] = `https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['rp_id']}`
                })

                // Print the results
                // console.log('Results:', results);
                bot.sendMessage(chatId, list.join("\n"));
                cleanState(userstat_key)

                // Print the results
                // console.log('Results:', results);
            });
        }

    }else{
        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Remembrance', callback_data: 'remembrance' },
                        { text: 'Search Article', callback_data: 'search_article' },
                    ],
                    [{ text: 'church website', url: 'https://calvarypandan.sg/' }]
                ]
            }
        }
        bot.sendMessage(chatId, 'Welcome! Choose an option:', inlineKeyboard);
    }
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    console.info(`input is ${JSON.stringify(callbackQuery)}`);
    const userstat_key = hashInput(callbackQuery.from)
    // console.info( `sha 'from' information ${hashInput(callbackQuery.from)}` );
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    let current_moment = "Morning"
    const month = moment_timezone().tz(timezone).format('MMMM')
    const this_date = moment_timezone().tz(timezone).format('DD')
    const currentHour = moment_timezone().tz(timezone).hours();
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

    if( 'search_article' === data.toLowerCase() ){
        // const keyboard = {
        //     reply_markup: {
        //         keyboard: [
        //             [
        //                 { text: 'Elder\'s Page', callback_data: 'search_article_elderpage' },
        //                 { text: 'Pastoral Chat', callback_data: 'search_article_pastoralchat' }
        //             ]
        //         ],
        //         resize_keyboard: true,
        //         one_time_keyboard: true
        //     }
        // };
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Elder\'s Page', callback_data: 'search_article_elderpage' },
                        { text: 'Pastoral Chat', callback_data: 'search_article_pastoralchat' }
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, 'Search from:', keyboard);
    }  //end of search article

    if( 'search_article_elderpage' === data.toLowerCase()
        || 'search_article_pastoralchat' === data.toLowerCase() ){
        keepState(userstat_key, `wait_for_input_${data.toLowerCase()}`)
        bot.sendMessage(chatId, `give me keyword`);
    }  //end of wait for input

    // bot.answerCallbackQuery(callbackQuery.id);
});

// Additional message handlers can be added here
