import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import logger from "../service/logger.mjs";
import _ from 'lodash';
import pool from "../service/dbConnPool.mjs";
import env from 'dotenv';
import {findSynonyms} from "../service/openAI.mjs";
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

async function runAllPromiseWithKeywords(question) {

    // let tasks = keywords.map((word) => findSynonyms(word));
    let tasks = [findSynonyms(question)]

    try {
        let results = await Promise.all(tasks);
        logger.info(`result is ${JSON.stringify(results)}`);

        let must = []
        let synonyms = []
        results.forEach((result) => {
            if( _.isEmpty(result['keywords']) != true ){
                must = [...must, ...result['keywords']]
            }

            if( _.isEmpty(result['synonyms']) != true ){
                synonyms = [...synonyms, ...result['synonyms']]
            }
        })

        return {'keywords':_.uniq(_.compact(must)), 'synonyms':_.uniq(_.compact(synonyms))};
    } catch (error) {
        logger.error(error);
    }
    return {'keywords':[], 'synonyms':[]};
}

function addSomemore(keywords, question) {
    if( _.includes(question, 'why') ){
        keywords.push('reason')
        keywords.push('why')
    }
    if( _.includes(question, 'how') ){
        keywords.push('method')
        keywords.push('how')
    }
    if( _.includes(question, 'what') ){
        keywords.push('definition')
        keywords.push('introduction')
        keywords.push('what')
    }
    if( _.includes(question, 'who') ){
        keywords.push('characters')
        keywords.push('who')
    }
    if( _.includes(question, 'where') ){
        keywords.push('where')
        keywords.push('place')
    }
    if( _.includes(question, 'when') ){
        keywords.push('time')
        keywords.push('timing')
        keywords.push('moment')
        keywords.push('when')
    }

    return keywords
}

function processText(keywords, longText) {
    longText = _.trim(longText)
    longText = _.truncate(_.trim(longText), {
        'length': 300,
        'separator': ' ', 
        'omission': '...',
    })

    // keywords.forEach((keyword) => {
    //     longText = longText.replace(new RegExp(keyword, 'gi'), `**${keyword}**`)
    // })

    logger.info(`omitted text ${longText}`)
    return longText
}

async function queryPublishId(rows) {
    let queryStat = `
        select rp_id from cpbpc_jevents_repetition cjr
        where cjr.eventdetail_id = ?
        order by rp_id desc
            limit 1
       `

    rows = rows.map(async (row) => {
        let parameters = [row['evdet_id']]
        let [data, fields] = await pool.query(queryStat, parameters);
        row['id'] = data['rp_id']
        return row
    })

    return rows;
}

export async function handleWaitForInput(msg) {
    // const musts = tokenize(msg.text);
    const question = _.toLower(msg.text)
    // let keywords = await identifyKeywords(question)
    // keywords = addSomemore(keywords, question)

    // if( _.isEmpty(keywords) ){
    //     return { text: "no result, cannot identify keyword/key phrase" };
    // }

    let {keywords, synonyms} = await runAllPromiseWithKeywords(question)
    // keywords.push(must)
    // keywords = _.compact(keywords)

    if( _.isEmpty(synonyms) ){
        return { text: "no result, cannot identify synonyms" };
    }

    logger.info(`keyword type ${typeof keywords}`);
    logger.info(`question is ${msg.text}, musts include [${keywords}], synonyms include [${synonyms}]`);

    // let synonyms_natural_mode = _.trim(synonyms.map(item => `${item}`).join(','))
    let must_natural_mode = _.trim(keywords.map(item => `${item}`).join(','))
    let array = [...keywords, ...synonyms]
    let synonyms_natural_mode = _.trim(array.map(item => `${item}`).join(','))
    // must_natural_mode = "+" + must_natural_mode.replaceAll(' ', ' +').replaceAll(',',  ' +')

    let queryStat = `
        SELECT cjr.rp_id as id,
               cjv.evdet_id,
               cjv.paragraph as article,
               cc.alias
                , MATCH (cjv.paragraph) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance_score
        FROM cpbpc_jevents_vevdetail_paragraph cjv
            LEFT JOIN cpbpc_jevents_vevent cj
            LEFT JOIN cpbpc_jevents_repetition cjr ON cjr.eventdetail_id = cjv.evdet_id
        ON cj.ev_id = cjv.evdet_id
            LEFT JOIN cpbpc_categories cc ON cc.id = cj.catid
        WHERE cc.alias IN ('elder-s-page'
            , 'pastoral-chat'
            , 'rpg-adult')
          and match (cjv.paragraph) AGAINST (? IN NATURAL LANGUAGE MODE)
          and cjv.evdet_id <> '5870'
        ORDER BY relevance_score DESC
            LIMIT 10
       `
    try {
        // Directly use pool.query
        let parameters = [synonyms_natural_mode, synonyms_natural_mode]
        logger.info( `query statement : ${mysql.format(queryStat, parameters)}`)
        let [rows, fields] = await pool.query(queryStat,parameters);
        // rows = await queryPublishId(rows);
        logger.info(`rows is ${JSON.stringify(rows)}`);
        const userstat_key = hashHeader(msg.from);
        cleanState(userstat_key);

        if (_.isEmpty(rows)) {
            return { text: "no result" };
        }

        // rows = await analyseArticle(synonyms, rows)

        const list = rows
            // .filter((row) => row['relevance'] >= 10)
            .map((row) => {
                let score = new decimal(row['relevance_score']).toDecimalPlaces(2).toString()
                if (row['alias'] === 'elder-s-page') {
                    return `matched: ${score} \n https://calvarypandan.sg/resources/elders-page/eventdetail/${row['id']} \n ${processText(keywords, row['article'])}`;
                }
                if (row['alias'] === 'pastoral-chat') {
                    return `matched: ${score} \n https://calvarypandan.sg/resources/pastoral-chat/eventdetail/${row['id']} \n ${processText(keywords, row['article'])}`;
                }
                if (row['alias'] === 'rpg-adult') {
                    return `matched: ${score} \n https://calvarypandan.sg/resources/rpg/calendar/eventdetail/${row['id']} \n ${processText(keywords, row['article'])}`;
                }
            });

        if( _.isEmpty(list) ){
            return { text: "no result" };
        }

        let lists = splitArray(list, 2)
        let finalResult = []
        lists.forEach((list)=>{
            finalResult.push({ text: list.join("\n\n") })
        })
        
        return finalResult;
    } catch (e) {
        logger.error(e);
        return { text: "An error occurred while processing your request." };
    }
}

function splitArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
