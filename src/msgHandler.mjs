import {cleanState, getState, hashHeader, isWaitForInput, keepState} from "./userstat.mjs";
import mysql from "mysql2";
import logger from './service/logger.mjs'
import moment_timezone from "moment-timezone";
import {readSheetWithRange} from "./service/accessSheets.mjs";
import env from 'dotenv'

env.config()
const timezone = process.env.TIMEZONE
const dbConn = mysql.createConnection({
    host: process.env.EN_DB_HOST,
    port: process.env.EN_DB_PORT,
    user: process.env.EN_DB_USER,
    password: process.env.EN_DB_PASS,
    database: process.env.EN_DB
});

export function handleMsg(msg, telegramBot){
    const chatId = msg.chat.id;
    const userstat_key = hashHeader(msg.from)
    logger.info(`handleMsg input is ${JSON.stringify(msg)}`);
    // logger.info( `sha 'from' information ${hashHeader(msg.from)}` );

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
                    logger.error('Error executing query:', error);
                    if( telegramBot ){
                        // bot.sendMessage(chatId, 'Oops! Bot has something wrong');
                        telegramBot.sendMessage(chatId, 'Oops! Bot has something wrong')
                    }
                    return;
                }

                const list = []
                results.forEach((row, key) =>{
                    list[key] = `https://calvarypandan.sg/resources/elders-page/eventdetail/${row['rp_id']}`
                })

                // Print the results
                // logger.log('Results:', results);
                if( telegramBot ){
                    // bot.sendMessage(chatId, list.join("\n"));
                    telegramBot.sendMessage(chatId, list.join("\n"))
                }

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
                    logger.error('Error executing query:', error);
                    if( telegramBot ){
                        // bot.sendMessage(chatId, 'Oops! Bot has something wrong');
                        telegramBot.sendMessage(chatId, 'Oops! Bot has something wrong')
                    }
                }

                const list = []
                results.forEach((row, key) =>{
                    list[key] = `https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['rp_id']}`
                })

                // Print the results
                // logger.log('Results:', results);
                if( telegramBot ){
                    // bot.sendMessage(chatId, list.join("\n"));
                    telegramBot.sendMessage(chatId, list.join("\n"))
                }
                cleanState(userstat_key)

                // Print the results
                // logger.log('Results:', results);
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
        if( telegramBot ){
            // bot.sendMessage(chatId, 'Welcome! Choose an option:', inlineKeyboard);
            try{
                telegramBot.sendMessage(chatId, 'Welcome! Choose an option:', inlineKeyboard)
            }catch (e){
                logger.info(e)
            }
        }
    }
}


export async function handleCallback(msg, telegramBot){
    logger.info(`handleCallback input is ${JSON.stringify(msg)}`);
    const userstat_key = hashHeader(msg.from)
    // logger.info( `sha 'from' information ${hashHeader(callbackQuery.from)}` );
    const message = msg.message;
    const data = msg.data;
    const chatId = msg.message.chat.id;

    let current_moment = "Morning"
    const month = moment_timezone().tz(timezone).format('MMMM')
    const this_date = moment_timezone().tz(timezone).format('DD')
    const currentHour = moment_timezone().tz(timezone).hours();
    if (currentHour >= 12) {
        current_moment = "Evening"
    }

    if ('remembrance' === data.toLowerCase()) {
        let spreadId = process.env.remembrance_telegram
        let jsons = await readSheetWithRange(spreadId, `${month}!A1:B62`)

        let json = ''
        jsons.forEach((value, key) => {
            const rem_date = value[0]
            // logger.info( `content is ${content}, type of ${typeof content}` )
            if (rem_date == this_date && value[1].includes(current_moment)) {
                logger.info(`content is ${value[1]}, type of ${typeof value[1]}`)
                json = value[1]
            }
        })

        let content = json
        if( telegramBot ){
            // bot.sendMessage(message.chat.id, content);
            await telegramBot.sendMessage(message.chat.id, content)
        }else{
            logger.info(`content is ${content}`)
        }
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

        if( telegramBot ){
            // bot.sendMessage(chatId, 'Search from:', keyboard);
            telegramBot.sendMessage(chatId, 'Search from:', keyboard)
        }
    }  //end of search article

    if( 'search_article_elderpage' === data.toLowerCase()
        || 'search_article_pastoralchat' === data.toLowerCase() ){
        keepState(userstat_key, `wait_for_input_${data.toLowerCase()}`)
        if( telegramBot ){
            // bot.sendMessage(chatId, `give me keyword`);
            await telegramBot.sendMessage(chatId, `give me keyword`)
        }
    }  //end of wait for input

}