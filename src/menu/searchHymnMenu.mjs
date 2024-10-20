import env from 'dotenv';
import {createAccessKey, hasAuthed, waitForAuthInput} from "../service/authWithSheets.mjs";
import logger from '../service/logger.mjs'
import {cleanState, hashHeader} from "../userstat.mjs";
import _ from "lodash";

env.config();

export const OBJ_NAME_SEARCH_HYMN_MENU = 'searchHymnMenu';

export const bucketName = process.env.hymn_bucket
// export const baseURL = `https://d13vhl06g9ql7i.cloudfront.net/hymn/cpbpc-hymn/num/`
export const baseURL = `https://d13vhl06g9ql7i.cloudfront.net/`
export const hymnURLPostfix = `/cpbpc-hymn/`
export const hymnCate = 'churchhymnal'

export async function run(msg) {
    logger.info(`hymn menu ${JSON.stringify(msg)}`)
    const chatId = msg.from.id
    if( !await hasAuthed(chatId) ){
        return waitForAuthInput(msg)
    }

    return {
        text: 'Search Hymn With...?',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Keyword/Number', callback_data: 'searchHymn' },
                        { text: 'Scripture', callback_data: 'searchHymnBible' },
                        { text: 'Topic', callback_data: 'searchHymnTopic' }
                    ],
                    // [
                    //     { text: 'Topic', callback_data: 'searchHymnTopic' },
                    //     { text: 'Group', callback_data: 'searchHymnGroup' }
                    // ]
                ]
            }
        } //end of options
    } //end of return
}

export async function handleWaitForAuth(msg){
    const userstat_key = hashHeader(msg.from)
    cleanState(userstat_key)
    let result = await createAccessKey(msg)
    if( _.isEqual(result.text, 'ok') ){
        return run(msg)
    }

    return result
}





