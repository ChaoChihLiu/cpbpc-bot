import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import logger from "../service/logger.mjs";
import _ from 'lodash';
import pool from "../service/dbConnPool.mjs";
import env from 'dotenv';
import {comprehendQuestion} from "../service/openAI.mjs";
import mysql from "mysql2/promise";
import decimal from 'decimal.js'

env.config();

export const OBJ_NAME_SEARCH_ARTICLE = 'searchArticle';
decimal.set({ rounding: decimal.ROUND_HALF_EVEN });

export function run(msg) {
    let user_sha = hashHeader(msg.from);

    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_ARTICLE}`);

    return { text: `give me keyword/question` };
}

export async function handleWaitForInput(msg) {
    // const musts = tokenize(msg.text);
    const synonyms = await comprehendQuestion(msg.text)
    const musts = synonyms.slice(0, 5).map(must => `+${must}`)
    logger.info(`question is ${msg.text}, musts include [${musts}], synonyms include [${synonyms}]`);
    const parameters = synonyms.map(token => `%${token}%`);


//     let queryStat = `
//         SELECT *
//              FROM (
//                  SELECT cjr.rp_id as id,
//                         cjv.description as article,
//                         cc.alias
// --                         ,(${synonyms.map(synonym => `IF(cjv.description LIKE ?, 1, 0)`).join(' + ')}) AS match_score
//                         , MATCH (cjv.description) AGAINST (
//                               '${synonyms.join(',').replaceAll( '\'', '\'\'')}'  IN NATURAL LANGUAGE MODE
//                         ) AS relevance_score
//                  FROM cpbpc_jevents_vevdetail cjv
//                  LEFT JOIN cpbpc_jevents_vevent cj ON cj.ev_id = cjv.evdet_id
//                  LEFT JOIN cpbpc_categories cc ON cc.id = cj.catid
//                  LEFT JOIN cpbpc_jevents_repetition cjr ON cjr.eventdetail_id = cjv.evdet_id
//                  WHERE cc.alias IN ('elder-s-page', 'pastoral-chat', 'rpg-adult')
//                    AND cjv.state = 1
//                     and match (cjv.description) AGAINST (
//                                 '${synonyms.join(',').replaceAll( '\'', '\'\'')}'
//                                 in natural language mode
//                             )
//                     and match (cjv.description) AGAINST (
//                                 '${musts.join(',').replaceAll( '\'', '\'\'')}'
//                                 in boolean mode
//                             )
// --                  ORDER BY match_score DESC
//                     ORDER BY relevance_score DESC
//                  LIMIT 10
//              ) AS temp
// --              WHERE match_score > 0
//              `
    let queryStat = `
        SELECT cjr.rp_id as id,
               cjv.description as article,
               cc.alias
                ,MATCH (cjv.description) AGAINST (
                        '${synonyms.join(',').replaceAll( '\'', '\'\'')}'  IN NATURAL LANGUAGE MODE
                ) AS relevance_score
        FROM cpbpc_jevents_vevdetail cjv
            LEFT JOIN cpbpc_jevents_vevent cj ON cj.ev_id = cjv.evdet_id
            LEFT JOIN cpbpc_categories cc ON cc.id = cj.catid
            LEFT JOIN cpbpc_jevents_repetition cjr ON cjr.eventdetail_id = cjv.evdet_id
        WHERE cc.alias IN ('elder-s-page', 'pastoral-chat', 'rpg-adult')
          AND cjv.state = 1
          and match (cjv.description) AGAINST (
                '${synonyms.join(',').replaceAll( '\'', '\'\'')}'
            in natural language mode
            )
          and match (cjv.description) AGAINST (
                '${musts.join(',').replaceAll( '\'', '\'\'')}'
            in boolean mode
            )
        ORDER BY relevance_score DESC
        LIMIT 50
       `
    try {
        // Directly use pool.query
        console.log( `query statement : ${mysql.format(queryStat, parameters)}`)
        let [rows, fields] = await pool.query(queryStat,parameters);
        // logger.info(`rows is ${JSON.stringify(rows)}`);
        const userstat_key = hashHeader(msg.from);
        cleanState(userstat_key);

        if (_.isEmpty(rows)) {
            return { text: "no result" };
        }

        // rows = await analyseArticle(synonyms, rows)

        const list = rows
            .filter((row) => row['relevance'] >= 10)
            .map((row) => {
                let score = new decimal(row['relevance_score']).toDecimalPlaces(2).toString()
                if (row['alias'] === 'elder-s-page') {
                    return `matched: ${score} \n https://calvarypandan.sg/resources/elders-page/eventdetail/${row['id']}`;
                }
                if (row['alias'] === 'pastoral-chat') {
                    return `matched: ${score} \n https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['id']}`;
                }
                if (row['alias'] === 'rpg-adult') {
                    return `matched: ${score} \n https://calvarypandan.sg/resources/rpg/calendar/eventdetail/${row['id']}`;
                }
            });

        return { text: list.join("\n\n") };
    } catch (e) {
        logger.error(e);
        return { text: "An error occurred while processing your request." };
    }
}
