import axios from 'axios'
import env from 'dotenv'
import logger from "./logger.mjs";
import pool from './dbConnPool.mjs'
import _ from "lodash";
import mysql from "mysql2/promise";
import naturalSort from "natural-sort";

env.config()

const getOpenAIKey = () => process.env.OPENAI_API_KEY;

export async function identifyKeywords(quesiton){
    let result = await createCompletions(rephraseKeywordQuestion(quesiton))
    logger.info(`identifyKeywords, openAI result ${JSON.stringify(result)}`)

    if( !result['choices'] || result['choices'].length <= 0
        || !result['choices'][0]['message']
        || !result['choices'][0]['message']['content'] ){
        return [];
    }

    return JSON.parse(result['choices'][0]['message']['content'])
}

function sortWord(keywords){
    logger.info(`sort word input ${JSON.stringify(keywords)}`)
    let result = _.sortBy(keywords, naturalSort).map(item => `${item}`).join(' ')
    logger.info(`sort word result ${JSON.stringify(result)}`)
    return result
}

async function querySynonyms(keywords) {

    let keyword_str = sortWord(keywords)
    logger.info(`keyword str ${keyword_str}`)

    let queryStat = `select synonym from cpbpc_synonym 
                        where keyword = ?`
    let para = [keyword_str]
    let [rows, fields] = await pool.query(queryStat, para);
    if (_.isEmpty(rows)) {
        logger.info(`keyword combination ${keyword_str} has no synonym yet`)
        return []
    }

    const synonyms = JSON.parse(rows[0]['synonym'])
    return synonyms
}

async function updateSynonyms(keywords, result) {
    let keyword_str = sortWord(keywords)
    let synynums_str = JSON.stringify(_.uniq(_.compact(result)))
    let updateStat = `
        INSERT INTO cpbpc_synonym (keyword, synonym)
        VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                synonym = ?
    `
    let parameters = [keyword_str, synynums_str, synynums_str]
    logger.info( `insert statement : ${mysql.format(updateStat, parameters)}`)
    pool.execute(updateStat, parameters)
}

export async function findSynonyms(question){
    // let resultFromDB = await querySynonyms(question)
    let result = await createCompletions(rephraseSynonymQuestion(question))
    // logger.info(`resultFromDB ${resultFromDB}`)
    logger.info(`findSynonyms openAI result ${JSON.stringify(result)}`)

    if( !result['choices'] || result['choices'].length <= 0
        || !result['choices'][0]['message']
        || !result['choices'][0]['message']['content'] ){
        return [];
    }

    try{
        logger.info(`type ${typeof result['choices'][0]['message']['content']},  array from AI ${JSON.stringify(result['choices'][0]['message']['content'])}`)
        let jsonObject = JSON.parse(result['choices'][0]['message']['content'])
        // result = _.uniq(_.compact([...resultFromDB, ...array]))
        let must = jsonObject['keywords']
        let synonyms = jsonObject['synonyms']

        let resultFromDB = await querySynonyms(must)
        logger.info(`from DB ${JSON.stringify(resultFromDB)}`)
        let merged = [...resultFromDB, ...synonyms]
        updateSynonyms(must, merged)

        return {'keywords': must, 'synonyms': merged}
        // return {'must': [], 'synonyms': []}
    } catch (e){
        logger.error(e)
    }
    return {'keywords': [], 'synonyms': []}
}

async function createCompletions(prompt) {
    const apiKey = getOpenAIKey();
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const requestBody = genCompletionJsonInput(prompt);

    try {
        const response = await axios.post(apiUrl, requestBody, { headers });
        return response.data;
    } catch (error) {
        console.error("Error creating completions:", error.response ? error.response.data : error.message);
        throw error;
    }
}

function genCompletionJsonInput(text) {
    const elements = {
        model: "gpt-4",
        messages: [
            { role: "user", content: text }
        ],
        max_tokens: 150
    };

    return JSON.stringify(elements);
}

function rephraseKeywordQuestion(question) {
    return `Comprehend the meaning of the following question, provide and sort key keywords or key phrases according to importance in the question: 
                ${question}
                and follow this pattern '["keyword1", "keyword2", "keyword3"...]' to organise your response`;
}

function rephraseSynonymQuestion(question) {
    return `Comprehend the meaning of the following question, provide keywords/key phrases to question and provide synonyms as many as possible: ${question}
                and follow this pattern '{"keywords":["word1", "word2"...], "synonyms":["synonym1", "synonym2",...]}' to organise your response`;
    // return `Comprehend the meaning of the following question, and provide synonyms as many as possible, sort synonyms by the relevance level to the context of the question:
    //             ${question}
    //             and follow this pattern '["synonym1", "synonym2", "synonym3"...]' to organise your response`;
}


// Example usage:
// (async () => {
//     try {
//         const response = await comprehendQuestion("can I wear jeans and attend Sunday worship service?");
//         // let result = JSON.parse(response)
//         console.log(response[0])
//
//         const parameters = response.map(token => `%${token}%`);
//         console.log(parameters[0])
//     } catch (error) {
//         console.error(error);
//     }
// })();
