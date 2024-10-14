import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import logger from "../service/logger.mjs"
import pool from "../service/dbConnPool.mjs"
import mysql from "mysql2/promise";
import pLimit from "p-limit";
import {bucketName, hymnCate} from './searchHymnMenu.mjs'
import {queryHymnWithNumber, searchS3ObjectsWithNumber} from "./searchHymn.mjs";
import {createAccessKey, hasAuthed, waitForAuthInput} from "../service/authWithSheets.mjs";

env.config();

export const OBJ_NAME_SEARCH_HYMN_TOPIC = 'searchHymnTopic';

export async function handleWaitForAuth(msg){
    const userstat_key = hashHeader(msg.from)
    cleanState(userstat_key)
    let result = await createAccessKey(msg)
    if( _.isEqual(result.text, 'ok') ){
        return run(msg)
    }

    return result
}

export async function run(msg) {
    const chatId = msg.from.id
    if( !await hasAuthed(chatId) ){
        return waitForAuthInput(msg)
    }

    let user_sha = hashHeader(msg.from);
    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_HYMN_TOPIC}`);
    const rows = await queryTopics()
    const formattedList = _.map(rows, (row) => `${row['seq_no']}. ${row['topic']}`);
    const formattedString = _.join(formattedList, '\n');
    return { text: `choose 1 from: \n ${formattedString}` };
}

async function queryTopics() {
    let queryStat = `
        select topic, ROW_NUMBER() OVER (ORDER BY topic ASC) AS seq_no
        from (select DISTINCT(\`index\`) as topic
              from cpbpc_hymn_index chi
              where index_type = 'Topic') as temp
    `;
    logger.info( `query statement : ${mysql.format(queryStat)}`)
    let [rows, fields] = await pool.query(queryStat)

    if( !rows || rows.length <= 0 ){
        return []
    }

    return rows
}

async function queryHymn(keyword) {
    let queryStat = `
                     SELECT DISTINCT (ch.seq_no), ch.title
                        FROM cpbpc_hymn ch
                                 left join cpbpc_hymn_index chi on ch.seq_no = chi.hymn_num
                        WHERE ch.category = '${hymnCate}'
                          and chi.index_type = 'Topic'
                          and chi.\`index\` = (
                            select topic from (
                                select topic, seq_no from (
                                select topic, ROW_NUMBER() OVER (ORDER BY topic ASC) AS seq_no
                                from (select DISTINCT(\`index\`) as topic
                                  from cpbpc_hymn_index chi
                                  where index_type = 'Topic') as temp  
                                ) as subquery
                                where seq_no=?
                            )as subquery1
                      )
                        order by seq_no asc
                    `;
    logger.info( `query statement : ${mysql.format(queryStat, [keyword])}`)
    let [rows, fields] = await pool.query(queryStat, [keyword])

    const limit = pLimit(5);
    let tasks = rows.map(row =>
        limit(async () => {
            let isExisted = await searchS3ObjectsWithNumber(bucketName, row['seq_no'], '.jpg');
            let hymnData = await queryHymnWithNumber(row['seq_no'], isExisted);
            return hymnData[0];
        })
    );
    const results = await Promise.all(tasks);
    logger.info( `result ${JSON.stringify(results)}` )

    return results
}

export async function handleWaitForInput(msg) {
    const userstat_key = hashHeader(msg.from);
    cleanState(userstat_key);

    const input = _.toLower(msg.text)
    let urls = await queryHymn(input)
    if( !urls || urls.length <= 0 ){
        return { text: `No hymn contains this topic: ${input}` };
    }

    // urls = _.slice(urls,0, 20)
    // return { text: urls.join('\n') };
    const chunkedArrays = _.chunk(urls, 20);
    return chunkedArrays.map((array => {
        return { text: array.join('\n') }
    }))
}


