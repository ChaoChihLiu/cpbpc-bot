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
                { text: 'Weekly', callback_data: 'searchWeekly' },
                { text: 'Search Article', callback_data: 'searchArticle' },
            ],
            // [{ text: '─────────', callback_data: 'separator', callback_game: {} }],
            // [
            //     { text: 'Weekly-MWS', url: 'https://d13vhl06g9ql7i.cloudfront.net/api/pnw' },
            //     { text: 'Weekly-SGH', url: 'https://cpbpc-documents.s3-ap-southeast-1.amazonaws.com/Worship/sgh.pdf' },
            // ],
            // [
            //     { text: 'Weekly-MWS', callback_data: 'mwsWeekly' },
            //     { text: 'Weekly-SGH', callback_data: 'sghWeekly' },
            // ],
            // [{ text: '─────────', callback_data: 'separator', callback_game: {} }],
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
    }
}

async function batchSend(telegramBot, chatId, returnedValue) {
    // let tasks = returnedValue.map((task, key) => send(telegramBot, chatId, task.text, task.options))
    // Promise.all(tasks)
    for (const message of returnedValue) {
        await send(telegramBot, chatId, message.text, message.options)
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
                if (!returnedValue.options && !returnedValue.text) {
                    throw new Error("no value returned, should have text or text & options")
                }
                if ((Array.isArray(returnedValue))) {
                    batchSend(telegramBot,chatId, returnedValue)
                }else {
                    send(telegramBot, chatId, returnedValue.text, returnedValue.options)
                }

            }).catch(error => {
                logger.error(error.message)
                send(telegramBot, chatId, "something wrong in server!")
            })
        }else{
            if ((Array.isArray(result))) {
                batchSend(telegramBot,chatId, result)
            }else {
                send(telegramBot, chatId, result.text, result.options)
            }
        }
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

    if(!options){
        options = {
            "parse_mode": "Markdown",
            "disable_web_page_preview": true,
            // "parse_mode": 'HTML'
        }
    }else{
        options = {
            ...options,
            "parse_mode": "Markdown",
            "disable_web_page_preview": true,
            // "parse_mode": 'HTML'
        }
    }

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