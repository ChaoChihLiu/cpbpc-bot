import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import decimal from 'decimal.js'
import {ListObjectsV2Command, S3Client} from '@aws-sdk/client-s3'
import logger from "../service/logger.mjs"
import pool from "../service/dbConnPool.mjs"
import mysql from "mysql2/promise";
import pLimit from "p-limit";
import {baseURL, bucketName, hymnCate, hymnURLPostfix} from './searchHymnMenu.mjs'
import {createAccessKey, hasAuthed, queryAccessKey, waitForAuthInput} from "../service/authWithSheets.mjs";

env.config()
const showHymnScores = process.env.show_hymn_scores === 'true'
export const OBJ_NAME_SEARCH_HYMN = 'searchHymn';
decimal.set({ rounding: decimal.ROUND_HALF_EVEN });

export async function run(msg) {
    const chatId = msg.from.id
    if( !await hasAuthed(chatId) ){
        return waitForAuthInput(msg)
    }

    let user_sha = hashHeader(msg.from);
    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_HYMN}`)
    return { text: `give me hymn number/keywords (split by space)` }
}

function isPureNumber(str) {
    return /^\d+$/.test(str);
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

function isText(str) {
    return isNaN(str) && typeof str === 'string';
}

async function queryHymn(chatId, keyword) {
    let queryStat = `
                        SELECT seq_no, title
                        FROM cpbpc_hymn
                        WHERE  category='${hymnCate}' and title LIKE ?
                    union
                        SELECT seq_no, title
                        FROM cpbpc_hymn
                        WHERE  category='${hymnCate}' and content LIKE ?
                    union
                        SELECT seq_no, title
                         FROM cpbpc_hymn
                         WHERE  category='${hymnCate}' and ${keyword.split(" ").map(() => 'content LIKE ?').join(' AND ')}`;
    const values1 = keyword
    const values2 = _.replace(keyword, /\s+/g, '')
    const values3 = keyword.split(" ").map(input => `%${input}%`);
    logger.info( `query statement : ${mysql.format(queryStat, [values1, values2, ...values3])}`)
    let [rows, fields] = await pool.query(queryStat, [values1, values2, ...values3])

    const limit = pLimit(5);
    let tasks = rows.map(row =>
        limit(async () => {
            let isExisted = await searchS3ObjectsWithNumber(bucketName, row['seq_no'], '_watermarked.jpg');
            let hymnData = await queryHymnWithNumber(chatId, row['seq_no'], isExisted);
            return hymnData[0];
        })
    );
    const results = await Promise.all(tasks);

    logger.info( `result ${JSON.stringify(results)}` )

    return results
}

export async function queryHymnWithNumber(chatId, number, inS3) {
    let queryStat = `SELECT seq_no, title, alias
                     FROM cpbpc_hymn
                     WHERE seq_no=${number} and category='${hymnCate}'`;

    let [rows, fields] = await pool.query(queryStat)
    logger.info( `query statement : ${mysql.format(queryStat)}`)

    let userAccessKey = await queryAccessKey(chatId)

    let result = rows.map(row =>
        !inS3
            ? `${row['index'] ? row['index'] + ' - ' : ''}${row['title']} \nhymn number ${row['seq_no']}`
            : `${row['index'] ? row['index'] + ' - ' : ''}${row['title']} \n${baseURL}${userAccessKey}${hymnURLPostfix}${row['alias']}`
    );

    logger.info( `result ${JSON.stringify(result)}` )

    return result
}

export async function handleWaitForInput(msg) {
    const userstat_key = hashHeader(msg.from);
    cleanState(userstat_key);

    const input = _.toLower(msg.text)
    if( isPureNumber(input) ){
        let hymnNum = input

        let isExisted = await searchS3ObjectsWithNumber( bucketName, hymnNum, '_watermarked.jpg' )
        let result = await queryHymnWithNumber(msg.chat.id, hymnNum, isExisted)
        if( !result || result.length <= 0 ){
            return { text: `No hymn number: ${input}` };
        }

        return { text: `${result[0]}` };
    }
    
    // let keywords = _.split(input, " ")
    let urls = await queryHymn(msg.chat.id, input)
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

function transformToURL(item) {
    const parts = item.split('_');
    const num = parts[0];
    return `${baseURL}${num}`;
}

const s3 = new S3Client({ region: 'ap-southeast-1' });
export async function searchS3ObjectsWithNumber(bucketName, prefix, postfix) {
    if( showHymnScores && showHymnScores == true ){
        return searchS3Objects( bucketName, prefix, postfix, true )
    }
    return false;
}

async function searchS3ObjectsWithTitle(bucketName, toBeMatched, postfix) {
    // return searchS3Objects( bucketName, prefix, postfix, false )
    let continuationToken = null;
    const matchingKeys = [];

    do {
        const params = {
            Bucket: bucketName,
            ContinuationToken: continuationToken
        };

        try {
            const data = await s3.send(new ListObjectsV2Command(params));

            // Check if any object keys match the prefix and postfix criteria
            for (const object of data.Contents) {
                let objectKey = _.toLower(object.Key)
                if ( objectKey.includes(`${toBeMatched}`) && objectKey.endsWith(postfix)) {
                    logger.info(`matched item ${object.Key}`)
                    let result = _.split(object.Key, '/')[0]
                    matchingKeys.push(result);
                }
            }

            continuationToken = data.IsTruncated ? data.NextContinuationToken : null;

        } catch (err) {
            logger.error('Error listing objects:', err);
            return false; // Return false on error
        }
    } while (continuationToken);

    return [...new Set(matchingKeys)]
}

async function searchS3Objects(bucketName, toBeMatched, postfix, matchedStartWith) {
    let continuationToken = null;

    logger.info(`bucket name ${bucketName}, tobematched ${toBeMatched}, postfix ${postfix}, matchedStartWith ${matchedStartWith}`)

    do {
        const params = {
            Bucket: bucketName,
            Prefix: `${toBeMatched}_`,
            ContinuationToken: continuationToken
        };

        try {
            const data = await s3.send(new ListObjectsV2Command(params));
            logger.info(`s3 data is ${JSON.stringify(data)}`)
            if( !data.Contents ){
                return false
            }

            // Check if any object keys match the prefix and postfix criteria
            for (const object of data.Contents) {
                if (matchedStartWith && object.Key.startsWith(`${toBeMatched}_`) && object.Key.endsWith(postfix)) {
                    return true;
                }
                if (!matchedStartWith && object.Key.includes(`${toBeMatched}`) && object.Key.endsWith(postfix)) {
                    return true;
                }
            }

            continuationToken = data.IsTruncated ? data.NextContinuationToken : null;

        } catch (err) {
            logger.error('Error listing objects:', err);
            return false;
        }
    } while (continuationToken);

    return false;
}


