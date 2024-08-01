import moment_timezone from "moment-timezone";
import {readSheetWithRange} from "../service/accessSheets.mjs";
import logger from "../service/logger.mjs";

import env from 'dotenv'
import {cleanState, hashHeader} from "../userstat.mjs";

env.config()
const timezone = process.env.TIMEZONE

export const OBJ_NAME_REMEMBRANCE = 'remembrance'
export function run(msg){

    let user_sha = hashHeader(msg.from)
    let current_moment = "Morning"
    const month = moment_timezone().tz(timezone).format('MMM')
    const this_date = moment_timezone().tz(timezone).format('DD')
    const currentHour = moment_timezone().tz(timezone).hours();
    if (currentHour >= 12) {
        current_moment = "Evening"
    }

    let spreadId = process.env.remembrance_telegram
    return new Promise( async (resolve, reject) => {
        try {
            let jsons = await readSheetWithRange(spreadId, `${month}!A1:B62`)

            let json = ''
            jsons.forEach((value, key) => {
                const rem_date = value[0]
                // logger.info( `content is ${value}, type of ${typeof value}` )
                if (rem_date == this_date && value[1].includes(current_moment)) {
                    logger.debug(`content is ${value[1]}, type of ${typeof value[1]}`)
                    json = value[1]
                }
            })
            if (json) {
                logger.info( `content is ${json}` )
                resolve({text: json})
                cleanState(user_sha)
            } else {
                reject('no data found')
            }
        } catch (e) {
            reject(e)
        }

    } )
}