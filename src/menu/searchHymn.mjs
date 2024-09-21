import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import decimal from 'decimal.js'
import {ListObjectsV2Command, S3Client} from '@aws-sdk/client-s3'
import logger from "../service/logger.mjs"
import pool from "../service/dbConnPool.mjs"
import mysql from "mysql2/promise";
import pLimit from "p-limit";

env.config();

export const OBJ_NAME_SEARCH_HYMN = 'searchHymn';
decimal.set({ rounding: decimal.ROUND_HALF_EVEN });

const bucketName = 'cpbpc-hymn'
const baseURL = `https://d13vhl06g9ql7i.cloudfront.net/hymn/cpbpc-hymn/num/`

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

async function queryHymn(keywords) {
    const limit = pLimit(5);

    const queries = async () => {
        // Prepare the query for the first statement
        const query1 = () => {
            const queryStat = `SELECT seq_no, title
                     FROM cpbpc_hymn
                     WHERE  category='churchhymnal' and title LIKE ? order by seq_no asc`;
            const values = keywords;
            return pool.query(queryStat, values)
                .then(([rows, fields]) => {
                    logger.info(`query statement : ${mysql.format(queryStat, values)}`);
                    return rows;
                });
        };

        // Prepare the query for the second statement
        const query2 = () => {
            const queryStat = `SELECT seq_no, title
                     FROM cpbpc_hymn
                     WHERE  category='churchhymnal' and content LIKE ? order by seq_no asc`;
            const values = _.replace(keywords, /\s+/g, ' ');
            return pool.query(queryStat, values)
                .then(([rows, fields]) => {
                    logger.info(`query statement : ${mysql.format(queryStat, values)}`);
                    return rows;
                });
        };

        // Prepare the query for the third statement
        const query3 = () => {
            const queryStat = `SELECT seq_no, title
                     FROM cpbpc_hymn
                     WHERE  category='churchhymnal' and ${keywords.map(() => 'content LIKE ?').join(' AND ')} order by seq_no asc`;
            const values = keywords.map(keyword => `%${keyword}%`);
            return pool.query(queryStat, values)
                .then(([rows, fields]) => {
                    logger.info(`query statement : ${mysql.format(queryStat, values)}`);
                    return rows;
                });
        };

        // Use p-limit to control concurrency and run all queries in parallel
        const results = await Promise.all([
            limit(query1),
            limit(query2),
            limit(query3)
        ]);

        return results;
    }//end of const queries = async ()

    const [result1, result2, result3] = await queries()
    const allResults = [...result1, ...result2, ...result3]
    const rows = _.uniqBy(allResults, 'seq_no')

    let tasks = rows.map(row =>
        limit(async () => {
            let isExisted = await searchS3ObjectsWithNumber(bucketName, row['seq_no'], '.jpg');
            let hymnData = await queryHymnWithNumber(row['seq_no'], isExisted);
            return hymnData[0];
        })
    );
    const data = await Promise.all(tasks);

    logger.info( `result ${JSON.stringify(data)}` )

    return data
}

async function queryHymnWithNumber(number, inS3) {
    let queryStat = `SELECT seq_no, title
                     FROM cpbpc_hymn
                     WHERE seq_no=${number} and category='churchhymnal'`;

    let [rows, fields] = await pool.query(queryStat)
    logger.info( `query statement : ${mysql.format(queryStat)}`)

    let result = rows.map(row => `${row['title']}: \n${baseURL}${row['seq_no']}`)
    if( !inS3 ){
        result = rows.map(row => `${row['title']}: \nhymn number ${row['seq_no']}`)
    }

    logger.info( `result ${JSON.stringify(result)}` )

    return result
}

export async function handleWaitForInput(msg) {
    const userstat_key = hashHeader(msg.from);
    cleanState(userstat_key);

    const input = _.toLower(msg.text)
    if( isPureNumber(input) ){
        let hymnNum = input

        let isExisted = await searchS3ObjectsWithNumber( bucketName, hymnNum, '.jpg' )
        let result = await queryHymnWithNumber(hymnNum, isExisted)
        if( !result || result.length <= 0 ){
            return { text: `No hymn number: ${input}` };
        }

        return { text: `${result[0]}` };
    }
    
    let keywords = _.split(input, " ")
    let urls = await queryHymn(keywords)
    if( !urls || urls.length <= 0 ){
        return { text: `No hymn contains these keywords: ${input}` };
    }

    urls = _.slice(urls,0, 20)

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


