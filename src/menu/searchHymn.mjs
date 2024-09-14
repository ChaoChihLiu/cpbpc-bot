import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import decimal from 'decimal.js'
import {ListObjectsV2Command, S3Client} from '@aws-sdk/client-s3'
import logger from "../service/logger.mjs"
import pool from "../service/dbConnPool.mjs"
import mysql from "mysql2/promise";

env.config();

export const OBJ_NAME_SEARCH_HYMN = 'searchHymn';
decimal.set({ rounding: decimal.ROUND_HALF_EVEN });

export function run(msg) {
    let user_sha = hashHeader(msg.from);

    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_HYMN}`);

    return { text: `give me hymn number/keywords (split by space)` };
}

function isPureNumber(str) {
    return /^\d+$/.test(str);
}

function isText(str) {
    return isNaN(str) && typeof str === 'string';
}

const baseURL = 'https://d13vhl06g9ql7i.cloudfront.net/hymn/testhymn/num/'

async function queryHymn(keywords) {
    let queryStat = `SELECT seq_no
                     FROM cpbpc_document
                     WHERE ${keywords.map(() => 'content LIKE ?').join(' AND ')}`;
    const values = keywords.map(keyword => `%${keyword}%`);
    let [rows, fields] = await pool.query(queryStat, values)
    logger.info( `query statement : ${mysql.format(queryStat, values)}`)
    let result = rows.map(row => `${baseURL}${row['seq_no']}`)

    logger.info( `result ${JSON.stringify(result)}` )

    return result
}

export async function handleWaitForInput(msg) {
    const userstat_key = hashHeader(msg.from);
    cleanState(userstat_key);

    let bucketName = 'testhymn'
    const input = _.toLower(msg.text)
    if( isPureNumber(input) ){
        let hymnNum = input

        let isExisted = await searchS3ObjectsWithNumber( bucketName, hymnNum, '.jpg' )
        if( !isExisted ){
            return { text: `Hymn number ${hymnNum} not exist` };
        }
        return { text: `${baseURL}${hymnNum}` };
    }

    // let hymnTitle = input.replace(/\s+/g, '_');
    // logger.info( `hymn title to search ${hymnTitle}` )
    // let matchedObjects = await searchS3ObjectsWithTitle( bucketName, hymnTitle, '.jpg' )
    // if( !matchedObjects || matchedObjects.length <= 0 ){
    //     return { text: `Hymn ${input} not exist` };
    // }
    // let urls = matchedObjects.map(transformToURL)
    // if( !urls || urls.length <= 0 ){
    //     return { text: `Hymn ${input} not exist` };
    // }

    let keywords = _.split(input, " ")
    let urls = await queryHymn(keywords)
    urls = _.slice(urls,0, 10)

    return { text: urls.join('\n') };
}

function transformToURL(item) {
    const parts = item.split('_');
    const num = parts[0];
    return `${baseURL}${num}`;
}

const s3 = new S3Client({ region: 'ap-southeast-1' });
async function searchS3ObjectsWithNumber(bucketName, prefix, postfix) {
    return searchS3Objects( bucketName, prefix, postfix, true )
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

    do {
        const params = {
            Bucket: bucketName,
            Prefix: `${toBeMatched}_`,
            ContinuationToken: continuationToken
        };

        try {
            const data = await s3.send(new ListObjectsV2Command(params));

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
            return false; // Return false on error
        }
    } while (continuationToken);

    return false;
}


