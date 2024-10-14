import {getState, hashHeader, isWaitForAuth, isWaitForInput, WAIT_FOR_AUTH, WAIT_FOR_INPUT} from "./userstat.mjs";
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
                { text: 'Weekly', callback_data: 'searchWeekly' }
            ],
            [
                { text: 'Search Hymn', callback_data: 'searchHymnMenu' },
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
    const input = msg.text

    if( !isWaitForInput(userstat_key)
        && !isWaitForAuth(userstat_key) ){
        const module = import(`./menu/${input}.mjs`)

        module.then((menuModule) => {
            menuModule.run(msg)
        }).catch((error) => {
            logger.info(`handleMsg, cannot find this module ${input}, go back to main menu`)
            send(telegramBot, chatId, 'Welcome! What I can help you:', menu)
        })
    }

    if( isWaitForInput(userstat_key) ){
        let array = getState(userstat_key).split('-')
        let moduleName = array[array.indexOf(WAIT_FOR_INPUT)+1]
        handleWaitForInput(moduleName, msg, telegramBot)
    }
    if( isWaitForAuth(userstat_key) ){
        let array = getState(userstat_key).split('-')
        let moduleName = array[array.indexOf(WAIT_FOR_AUTH)+1]
        handleWaitForAuth(moduleName, msg, telegramBot)
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
    handleFunction(moduleName, 'handleWaitForInput', msg, telegramBot)
}
async function handleWaitForAuth(moduleName, msg, telegramBot){
    handleFunction(moduleName, 'handleWaitForAuth', msg, telegramBot)
}

async function handleFunction(moduleName, functionName, msg, telegramBot){
    logger.info(`in handleFunction: ${moduleName}, ${functionName}`)
    
    const chatId = msg.chat.id;

    const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), `./menu/${moduleName}.mjs`);
    const module = await import(modulePath)

    if( !module || typeof module[functionName] !== 'function' ){
        logger.info(`handleFunction, cannot find this module ${moduleName}, go back to main menu`)
        send(telegramBot, chatId, 'Welcome! What I can help you:', menu)
        return
    }

    if (typeof module[functionName] === 'function') {
        const result = await module[functionName](msg);
        if( typeof result === 'Promise' ){
            result.then(returnedValue => {
                if ( !returnedValue.options && !returnedValue.text) {
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
    } //end of if (typeof module[functionName] === 'function')

} //end of handleFunction

async function callModule(msg, telegramBot){

    const message = msg.message;
    const data = msg.data;
    const chatId = msg.message.chat.id;

    const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), `./menu/${data}.mjs`);
    const module = await import(modulePath)

    if( !module || typeof module['run'] !== 'function' ){
        logger.info(`callModule, cannot find this module ${data}, go back to main menu`)
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