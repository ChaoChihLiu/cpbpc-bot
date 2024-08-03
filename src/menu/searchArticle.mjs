import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import logger from "../service/logger.mjs";
import _ from 'lodash';
import pool from "../service/dbConnPool.mjs";
import env from 'dotenv';
import {comprehendQuestion} from "../service/openAI.mjs";
import {analyseArticle} from "../service/analyseRelevance.mjs";

env.config();

export const OBJ_NAME_SEARCH_ARTICLE = 'searchArticle';

export function run(msg) {
    let user_sha = hashHeader(msg.from);

    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_ARTICLE}`);

    return { text: `give me keyword/question` };
}

export async function handleWaitForInput(msg) {
    // const tokens = analyseSentence(msg.text);
    const tokens = await comprehendQuestion(msg.text);
    logger.info(`question is ${msg.text}, tokens include [${tokens}]`);
    const parameters = tokens.map(token => `%${token}%`);

    try {
        // Directly use pool.query
        let [rows, fields] = await pool.query(
            `SELECT *
             FROM (
                 SELECT cjr.rp_id as id,
                        cjv.description as article,
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
             ORDER BY id DESC`,
            parameters
        );

        // logger.info(`rows is ${JSON.stringify(rows)}`);
        const userstat_key = hashHeader(msg.from);
        cleanState(userstat_key);

        if (_.isEmpty(rows)) {
            return { text: "no result" };
        }

        rows = await analyseArticle(tokens, rows)

        const list = rows.map((row) => {
            if (row['alias'] === 'elder-s-page') {
                return `matched: ${row['relevance'] / tokens.length * 100} \n https://calvarypandan.sg/resources/elders-page/eventdetail/${row['id']}`;
            }
            if (row['alias'] === 'pastoral-chat') {
                return `matched: ${row['relevance'] / tokens.length * 100} \n https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['id']}`;
            }
            if (row['alias'] === 'rpg-adult') {
                return `matched: ${row['relevance'] / tokens.length * 100} \n https://calvarypandan.sg/resources/rpg/calendar/eventdetail/${row['id']}`;
            }
        }).filter(Boolean);

        return { text: list.join("\n\n") };
    } catch (e) {
        logger.error(e);
        return { text: "An error occurred while processing your request." };
    }
}
