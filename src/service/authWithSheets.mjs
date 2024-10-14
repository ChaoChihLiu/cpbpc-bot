import {google} from 'googleapis';
import logger from './logger.mjs'
import _ from 'lodash'
import {authenticate} from "./gcpAuth.mjs";
import env from "dotenv";
import {hashHeader, keepState, WAIT_FOR_AUTH} from "../userstat.mjs";
import mysql from "mysql2/promise";
import pool from "./dbConnPool.mjs";
import crypto from 'crypto'

env.config();
var spreadsheetId = process.env.church_member_sheets
export async function searchId( email, idNum ) {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    let range = 'Sheet1!A:A';
    let response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    })

    const rows = response.data.values
    let rowIndex = _.findIndex(rows, (row) => _.isEqual(_.trim(row[0]), _.trim(email)))
    if( rowIndex < 0 ){
        return false
    }

    rowIndex ++
    range = `Sheet1!B${rowIndex}`;
    response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    })
    const nric = response.data.values[0][0]
    if( _.endsWith(nric, idNum) ){
        return true
    }

    return false
}

function isEmptyOrWhitespace(value) {
    return _.isNil(value) || _.isEmpty(_.trim(value));
}


export function waitForAuthInput(msg){
    let user_sha = hashHeader(msg.from);
    logger.info(`msg data ${msg.data}`)
    keepState(user_sha, `${WAIT_FOR_AUTH}-${msg.data}`);
    return { text: `this function is only accessible to church member\n need your email and last 4 digits of NRIC, use comma as delimiter. \ne.g. 1234@gmail.com,567D` }
}

async function isIdentityVerified(chatId) {
    let queryStat = `
                        select count(*) as counter from cpbpc_hymn_access where telegram_chat_id=?
                       `;
    logger.info( `query statement : ${mysql.format(queryStat, [chatId])}`)
    let [rows, fields] = await pool.query(queryStat, [chatId])
    let count = rows[0]['counter']
    if( count == 0 ){
        return false
    }

    return true
}

export function hasAuthed(chatId){
    const isVerified = isIdentityVerified(chatId)
    return isVerified
}

export function genAccessKey(length=36){
    if (length > 36) length = 36;

    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length)
    
}

export async function createAccessKey(msg){

    const userInfo = msg.text
    if( !isCorrectFormat(userInfo) ){
        return { text: 'your input is not in correct format \n e.g. 1234@gmail.com,567D' }
    }

    const email = _.trim(_.split(userInfo, ',')[0])
    const idNum = _.trim(_.split(userInfo, ',')[1])

    let isCorrect = await searchId(email, idNum)
    if( !isCorrect ){
        return { text: `cannot find ${email},${idNum} from church member contact list` }
    }

    await reGenAccessKey(email, msg.chat.id)
    return {text: `ok`}
}

function isCorrectFormat(userInfo){
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+,\d{3}[A-Za-z]$/
    if (regex.test(userInfo)) {
        return true
    } else {
        return false
    }
}

// query access key from db, if access key creation time is 10 minutes ago, then regenerate new one
export async function queryAccessKey(chatId){
    let queryStat = `
                        select * from cpbpc_hymn_access where telegram_chat_id=? 
                         order by key_create_time desc limit 1                                                     
                       `;
    logger.info( `query statement : ${mysql.format(queryStat, [chatId])}`)
    let [rows, fields] = await pool.query(queryStat, [chatId])
    let row = rows[0]
    const currentTime = new Date()
    const tenMinutesAgo = new Date(currentTime.getTime() - 10 * 60 * 1000)

    const keyCreateTime = new Date(row['key_create_time']);
    if(keyCreateTime >= tenMinutesAgo){
        return row['access_key']
    }

    return reGenAccessKey(row['user_email'], row['telegram_chat_id'])

}

export async function reGenAccessKey(email, chatId){

    let accessKey = genAccessKey(12)
    let updateStat = `
        INSERT INTO calvarypandan.cpbpc_hymn_access
            (user_email, telegram_chat_id, access_key)
        VALUES(?, ?, ?)
    `
    let parameters = [email, chatId, accessKey]
    logger.info( `insert statement : ${mysql.format(updateStat, parameters)}`)
    await pool.execute(updateStat, parameters)

    return accessKey
    // return {text: `ok`}
}
