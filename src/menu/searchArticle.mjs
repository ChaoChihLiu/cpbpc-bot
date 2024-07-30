import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import logger from "../service/logger.mjs";
import _ from 'lodash'
import mysql from "mysql2/promise";
// import {dbConn} from "../service/dbConnPool.mjs";
import env from 'dotenv'

env.config()
export const OBJ_NAME_SEARCH_ARTICLE = 'searchArticle'

export function run(msg){
    let user_sha = hashHeader(msg.from)

    // const keyboard = {
    //     reply_markup: {
    //         inline_keyboard: [
    //             [
    //                 { text: 'Elder\'s Page', callback_data: 'search_article_elderpage' },
    //                 { text: 'Pastoral Chat', callback_data: 'search_article_pastoralchat' }
    //             ]
    //         ]
    //     }
    // }
    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_ARTICLE}`)

    return {text: `give me keyword`}
}

export async function handleWaitForInput(msg){
    // let {dbConn} = await import('../service/dbConnPool.mjs')
    const dbConn = await mysql.createConnection({
        host: process.env.EN_DB_HOST,
        port: process.env.EN_DB_PORT,
        user: process.env.EN_DB_USER,
        password: process.env.EN_DB_PASS,
        database: process.env.EN_DB
    });


    const keyword = msg.text
    try{
        const [rows, fields] = await dbConn.query( ` select cjr.rp_id, cc.alias
                                                from cpbpc_jevents_vevdetail cjv
                                                left join cpbpc_jevents_vevent cj on cj.ev_id = cjv.evdet_id
                                                left join cpbpc_categories cc on cc.id = cj.catid
                                                left join cpbpc_jevents_repetition cjr on cjr.eventdetail_id  = cjv.evdet_id
                                                 where cc.alias in ( 'elder-s-page', 'pastoral-chat', 'rpg-adult' )
                                                and cjv.description like ?
                                                   and cjv.state = 1
                                                order by cjv.evdet_id desc
                                                limit 10
                                                `, [`%${keyword}%`])

        logger.info(`rows is ${JSON.stringify(rows)}`)
        const userstat_key = hashHeader(msg.from)
        cleanState(userstat_key)
        if( _.isEmpty(rows) ){
            return {text: "no result"}
        }

        const list = []
        rows.forEach((row, key) =>{
            if( 'elder-s-page' === row['alias'] ){
                list[key] = `https://calvarypandan.sg/resources/elders-page/eventdetail/${row['rp_id']}`
            }
            if( 'pastoral-chat' === row['alias'] ){
                list[key] = `https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['rp_id']}`
            }
            if( 'rpg-adult' === row['alias'] ){
                list[key] = `https://calvarypandan.sg/resources/rpg/calendar/eventdetail/${row['rp_id']}`
            }
        })
        return {text: list.join("\n\n")}
    }catch (e){
        logger.error(e)
    }finally{
        await dbConn.end()
    }

}