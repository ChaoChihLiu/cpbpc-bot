import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import logger from "../service/logger.mjs"
import pool from "../service/dbConnPool.mjs"
import mysql from "mysql2/promise";
import pLimit from "p-limit";
import {baseURL, bucketName, hymnCate} from './searchHymnMenu.mjs'
import {searchS3ObjectsWithNumber} from "./searchHymn.mjs";

env.config();

export const OBJ_NAME_SEARCH_HYMN_BIBLE = 'searchHymnBible';

export function run(msg) {
    let user_sha = hashHeader(msg.from);

    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_HYMN_BIBLE}`);

    return { text: `give me Bible reference, e.g. Gen 1:2 or Rom 8` };
}

async function queryHymn(keyword) {
    let queryStat = `
                        SELECT DISTINCT (ch.seq_no), ch.title, chi.\`index\`
                        FROM cpbpc_hymn ch
                                 left join cpbpc_hymn_index chi on ch.seq_no = chi.hymn_num
                        WHERE ch.category = '${hymnCate}'
                          and chi.index_type = 'Scripture'
                          and chi.\`index\` like ?
                        order by seq_no asc
                    `;
    let value = `%${keyword}%`
    logger.info( `query statement : ${mysql.format(queryStat, [value])}`)
    let [rows, fields] = await pool.query(queryStat, [value])

    const limit = pLimit(5);
    let tasks = rows.map(row =>
        limit(async () => {
            let isExisted = await searchS3ObjectsWithNumber(bucketName, row['seq_no'], '.jpg');
            let hymnData = await queryHymnWithNumber(row['index'], row['seq_no'], isExisted);
            return hymnData[0];
        })
    );
    const results = await Promise.all(tasks);
    logger.info( `result ${JSON.stringify(results)}` )

    return results
}

async function queryHymnWithNumber(ref, number, inS3) {
    let queryStat = `SELECT ch.seq_no, ch.title, chi.\`index\`
                     FROM cpbpc_hymn ch
                     left join cpbpc_hymn_index chi on ch.seq_no = chi.hymn_num
                     WHERE ch.seq_no=${number} 
                       and ch.category='${hymnCate}'
                        and chi.index_type='Scripture'
                       and chi.\`index\`='${ref}'
                     `;

    let [rows, fields] = await pool.query(queryStat)
    logger.info( `query statement : ${mysql.format(queryStat)}`)

    // let result = rows.map(row => `${row['title']} \n${baseURL}${row['seq_no']}`)
    // if( !inS3 ){
    //     result = rows.map(row => `${row['title']} \nhymn number ${row['seq_no']}`)
    // }
    let result = rows.map(row =>
        !inS3
            ? `${row['index'] ? row['index'] + ' - ' : ''}${row['title']} \nhymn number ${row['seq_no']}`
            : `${row['index'] ? row['index'] + ' - ' : ''}${row['title']} \n${baseURL}${row['seq_no']}`
    );

    logger.info( `result ${JSON.stringify(result)}` )

    return result
}

async function findBookFullName(matched) {
    let queryStat = `
                    select ca.complete_form from cpbpc_abbreviation ca
                    where ca.short_form = ? and ca.\`group\` = 'bible' 
                    and ca.cloud_sys = 'azure' and isEnabled=1
                    `;
    logger.info( `query statement : ${mysql.format(queryStat, [matched])}`)
    let [rows, fields] = await pool.query(queryStat, [matched])

    if( !rows || rows.length <= 0 ){
        return matched
    }

    return rows[0]['complete_form']
}

async function convertRef(input) {
    const regex = /(?:\d\s?)?[A-Za-z]+(?:\s?[A-Za-z]+)?/g
    logger.info(`input.match(regex) ${input.match(regex)}`)
    let matched = _.trim(input.match(regex))
    let verse = _.replace(input, matched, '').trim()
    const book = await findBookFullName(matched)

    if( _.isEqual(_.toLower(book), _.toLower('Psalms')) ){
        return `Psalm ${verse}`
    }

    return `${book} ${verse}`
}

export async function handleWaitForInput(msg) {
    const userstat_key = hashHeader(msg.from);
    cleanState(userstat_key);

    const input = _.toLower(msg.text)
    const completeRef = await convertRef(input)
    let urls = await queryHymn(completeRef)
    if( !urls || urls.length <= 0 ){
        return { text: `No hymn contains these keywords: ${input}` };
    }

    // urls = _.slice(urls,0, 20)
    // return { text: urls.join('\n') };
    const chunkedArrays = _.chunk(urls, 20);
    return chunkedArrays.map((array => {
        return { text: array.join('\n') }
    }))
}


