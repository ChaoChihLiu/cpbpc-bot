import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import logger from "../service/logger.mjs";
import _ from 'lodash';
import pool from "../service/dbConnPool.mjs";
import {analyseSentence} from "../service/tokeniser.mjs";
import env from 'dotenv';

env.config();

export const OBJ_NAME_SEARCH_ARTICLE = 'searchArticle';

export function run(msg) {
    let user_sha = hashHeader(msg.from);

    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_ARTICLE}`);

    return { text: `give me keyword` };
}

export async function handleWaitForInput(msg) {
    const tokens = analyseSentence(msg.text);
    logger.info(`question is ${msg.text}, tokens include [${tokens}]`);
    const parameters = tokens.map(token => `%${token}%`);

    try {
        // Directly use pool.query
        const [rows, fields] = await pool.query(
            `SELECT *
             FROM (
                 SELECT cjr.rp_id,
                        cc.alias,
                        (${tokens.map(token => `IF(cjv.description LIKE ?, 1, 0)`).join(' + ')}) AS match_score
                 FROM cpbpc_jevents_vevdetail cjv
                 LEFT JOIN cpbpc_jevents_vevent cj ON cj.ev_id = cjv.evdet_id
                 LEFT JOIN cpbpc_categories cc ON cc.id = cj.catid
                 LEFT JOIN cpbpc_jevents_repetition cjr ON cjr.eventdetail_id = cjv.evdet_id
                 WHERE cc.alias IN ('elder-s-page', 'pastoral-chat', 'rpg-adult')
                   AND cjv.state = 1
                 ORDER BY match_score DESC
                 LIMIT 20
             ) AS temp
             WHERE match_score > 0
             ORDER BY rp_id DESC`,
            parameters
        );

        logger.info(`rows is ${JSON.stringify(rows)}`);
        const userstat_key = hashHeader(msg.from);
        cleanState(userstat_key);

        if (_.isEmpty(rows)) {
            return { text: "no result" };
        }

        const list = rows.map((row) => {
            if (row['alias'] === 'elder-s-page') {
                return `matched: ${row['match_score'] / tokens.length * 100} \n https://calvarypandan.sg/resources/elders-page/eventdetail/${row['rp_id']}`;
            }
            if (row['alias'] === 'pastoral-chat') {
                return `matched: ${row['match_score'] / tokens.length * 100} \n https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['rp_id']}`;
            }
            if (row['alias'] === 'rpg-adult') {
                return `matched: ${row['match_score'] / tokens.length * 100} \n https://calvarypandan.sg/resources/rpg/calendar/eventdetail/${row['rp_id']}`;
            }
        }).filter(Boolean);

        return { text: list.join("\n\n") };
    } catch (e) {
        logger.error(e);
        return { text: "An error occurred while processing your request." };
    }
}
