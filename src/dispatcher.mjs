import {getState, hashHeader, isWaitForInput, WAIT_FOR_INPUT} from "./userstat.mjs";
import logger from './service/logger.mjs'
import env from 'dotenv'

import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

env.config()

const menu = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Remembrance', callback_data: 'remembrance' },
                { text: 'Search Article', callback_data: 'searchArticle' },
            ],
            [{ text: 'church website', url: 'https://calvarypandan.sg/' }]
        ]
    }
}

export async function handleMsg(msg, telegramBot){
    const chatId = msg.chat.id;
    const userstat_key = hashHeader(msg.from)
    logger.info(`handleMsg input is ${JSON.stringify(msg)}`);
    // logger.info( `sha 'from' information ${hashHeader(msg.from)}` );

    const input = msg.text

    if( !isWaitForInput(userstat_key) ){
        const module = import(`./menu/${input}.mjs`)
        module.then((menuModule) => {
            menuModule.run(msg)
        }).catch((error) => {
            logger.info(`cannot find this module ${input}, go back to main menu`)
            send(telegramBot, chatId, 'Welcome! What I can help you:', menu)
        })
    }

    if( isWaitForInput(userstat_key) ){
        let array = getState(userstat_key).split('-')
        let moduleName = array[array.indexOf(WAIT_FOR_INPUT)+1]
        handleWaitForInput(moduleName, msg, telegramBot)
    //     const keyword = msg.text
    //     const user_state = getState(userstat_key)
    //
    //     if( user_state.includes('elderpage') ){
    //         dbConn.query(` select cjr.rp_id
    // from cpbpc_jevents_vevdetail cjv
    // left join cpbpc_jevents_vevent cj on cj.ev_id = cjv.evdet_id
    // left join cpbpc_categories cc on cc.id = cj.catid
    // left join cpbpc_jevents_repetition cjr on cjr.eventdetail_id  = cjv.evdet_id
    //  where cc.alias in ( 'elder-s-page' )
    // and cjv.description like ?
    // order by cjv.evdet_id desc
    // limit 10
    // ;`, [`%${keyword}%`], (error, results, fields) => {
    //             if (error) {
    //                 logger.error('Error executing query:', error);
    //                 send(telegramBot, chatId, 'Oops! Bot has something wrong')
    //                 return;
    //             }
    //
    //             const list = []
    //             results.forEach((row, key) =>{
    //                 list[key] = `https://calvarypandan.sg/resources/elders-page/eventdetail/${row['rp_id']}`
    //             })
    //
    //             send(telegramBot, chatId, list.join("\n"))
    //             cleanState(userstat_key)
    //         });
    //     }else if( user_state.includes('pastoralchat') ){
    //         dbConn.query(` select cjr.rp_id
    // from cpbpc_jevents_vevdetail cjv
    // left join cpbpc_jevents_vevent cj on cj.ev_id = cjv.evdet_id
    // left join cpbpc_categories cc on cc.id = cj.catid
    // left join cpbpc_jevents_repetition cjr on cjr.eventdetail_id  = cjv.evdet_id
    // where cc.alias in ( 'pastoral-chat' )
    // and cjv.description like ?
    // order by cjv.evdet_id desc
    // limit 10
    // ;`, [`%${keyword}%`], (error, results, fields) => {
    //             if (error) {
    //                 logger.error('Error executing query:', error);
    //                 send(telegramBot, chatId, 'Oops! Bot has something wrong')
    //             }
    //
    //             const list = []
    //             results.forEach((row, key) =>{
    //                 list[key] = `https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['rp_id']}`
    //             })
    //
    //             send(telegramBot, chatId, list.join("\n"))
    //             cleanState(userstat_key)
    //         });
    //     }

    }
}

async function handleWaitForInput(moduleName, msg, telegramBot){
    
    const chatId = msg.chat.id;

    const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), `./menu/${moduleName}.mjs`);
    const module = await import(modulePath)

    if( !module || typeof module['handleWaitForInput'] !== 'function' ){
        logger.info(`cannot find this module ${moduleName}, go back to main menu`)
        send(telegramBot, chatId, 'Welcome! What I can help you:', menu)
        return
    }

    if (typeof module['handleWaitForInput'] === 'function') {
        const result = await module['handleWaitForInput'](msg);
        if( typeof result === 'Promise' ){
            result.then(returnedValue => {
                if( !returnedValue.options && !returnedValue.text ){
                    throw new Error("no value returned, should have text or text & options")
                }
                send(telegramBot, chatId, returnedValue.text, returnedValue.options)

            }).catch(error => {
                logger.error(error)
                send(telegramBot, chatId, "something wrong in server!")
            })
        }

        send(telegramBot, chatId, result.text, result.options)
    }

}

async function callModule(msg, telegramBot){

    const message = msg.message;
    const data = msg.data;
    const chatId = msg.message.chat.id;

    const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), `./menu/${data}.mjs`);
    const module = await import(modulePath)

    if( !module || typeof module['run'] !== 'function' ){
        logger.info(`cannot find this module ${data}, go back to main menu`)
        send(telegramBot, chatId, 'Welcome! What I can help you:', menu)
        return
    }

    if (typeof module['run'] === 'function') {
        const result = await module['run'](msg);
        if( typeof result === 'Promise' ){
            result.then(returnedValue => {
                if( !returnedValue.options && !returnedValue.text ){
                    throw new Error("no value returned, should have text or text & options")
                }
                send(telegramBot, message.chat.id, returnedValue.text, returnedValue.options)

            }).catch(error => {
                logger.error(error)
                send(telegramBot, message.chat.id, "something wrong in server!")
            })
        }

        send(telegramBot, message.chat.id, result.text, result.options)
    }

}

export async function handleCallback(msg, telegramBot){
    logger.info(`handleCallback input is ${JSON.stringify(msg)}`);

    callModule(msg, telegramBot)

    // if( 'search_article_elderpage' === data.toLowerCase()
    //     || 'search_article_pastoralchat' === data.toLowerCase() ){
    //     keepState(userstat_key, `wait_for_input_${data.toLowerCase()}`)
    //     send(telegramBot, chatId, `give me keyword`)
    // }  //end of wait for input

}

async function send( bot, chatId, text, options=undefined ){
    try{
        if( !bot ){
            throw new ReferenceError("telegram bot not exist")
        }
        if( !options ){
            return bot.sendMessage(chatId, text)
        }else{
            return bot.sendMessage(chatId, text, options)
        }
    }catch(e){
        throw e
    }
}