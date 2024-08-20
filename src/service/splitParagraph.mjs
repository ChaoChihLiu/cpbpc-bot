import pool from "../service/dbConnPool.mjs";
import _ from 'lodash'
import logger from "./logger.mjs";
import pLimit from 'p-limit'

const limit = pLimit(10)

function removeNbsp(str) {
    str = str.replace(/\u00A0/g, ' ')
    return str
}
function removeLineBreaks(str) {
    return str.replace(/(\r\n|\n|\r)/g, ' ')
}

function isBlank(value) {
    // let value = input.trim()
    return _.isEmpty(value) && !_.isNumber(value) && !_.isBoolean(value) && _.isString(value) || _.isNil(value);
}

function removeHtmlUnicode(str) {
    str = str.replace(/&[a-zA-Z0-9#]+;/g, ' ');
    str = str.replace(/&#x[0-9A-Fa-f]+;|&#\d+;/g, ' ');

    return str;
}
const removeHtmlTags = (str) => {
    return str.replace(/<\/?[^>]+>/gi, ' ')
}

const removeRedudantWhitspace = (input) =>{
    return input.replace(/\s+/g, ' ')
}

async function findLastRead() {

    let queryStat = `
        select MAX(evdet_id) as last_read from cpbpc_jevents_vevdetail_paragraph cjvp
    `
    let [rows, fields] = await pool.query(queryStat)
    let result = 0
    rows.forEach((row, key) => {
        result = 0
        if (!isBlank(row['last_read'])) {
            result = row['last_read']
        }
    })

    logger.info(`start from ${result}`)
    return result
}

async function saveParagraph(paragraph, evdet_id, seq_no) {

    let content = paragraph
    let updateStat = `
        INSERT INTO cpbpc_jevents_vevdetail_paragraph (evdet_id, paragraph, paragraph_seq)
        VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
             paragraph = ?
    `
    let parameters = [evdet_id, content, seq_no+1, content]
    await pool.execute(updateStat, parameters)
}

async function saveParagraphs(paragraphs, evdet_id) {
    let tasks = paragraphs.map((paragraph, key) => limit(() => saveParagraph(paragraph, evdet_id, key)));
    try {
        await Promise.all(tasks)
    } catch (error) {
        logger.error(error)
    }
}

async function splitArticle(){
    try{
        let startFrom = await findLastRead()
        const processSentence = (arr) => arr.map(item => removeLineBreaks(removeRedudantWhitspace(removeHtmlTags(removeHtmlUnicode(removeNbsp(item)))))).filter(item => item.trim() !== '')

        let queryStat = `
         SELECT cjv.evdet_id,
               cjv.description as article,
               cc.alias
         FROM cpbpc_jevents_vevdetail cjv
            LEFT JOIN cpbpc_jevents_vevent cj ON cj.ev_id = cjv.evdet_id
            LEFT JOIN cpbpc_categories cc ON cc.id = cj.catid
            LEFT JOIN cpbpc_jevents_repetition cjr ON cjr.eventdetail_id = cjv.evdet_id
         WHERE cc.alias IN ('elder-s-page', 'pastoral-chat', 'rpg-adult')
                and cjv.evdet_id > ?
    `
        let parameters = [startFrom]
        let [rows, fields] = await pool.query(queryStat, parameters)
        if( !rows || _.isEmpty(rows) ){
            logger.info(`no new record`)
            return
        }

        for (const row of rows) {
            // let article = removeLineBreaks(removeHtmlTags(removeHtmlUnicode(removeNbsp( row['article']))))
            let article = row['article']
            let evdet_id = row['evdet_id']
            if (!isBlank(_.trim(article))) {
                let delimiter = '</p>';
                if (_.isEqual(_.toLower(row['alias']), 'rpg-adult')) {
                    if (_.includes(article, '</div>')) {
                        delimiter = '</div>';
                    } else {
                        delimiter = '<br />';
                    }
                }
                logger.info(`Using delimiter: ${delimiter}`);

                let paragraphs = _.split(article, delimiter);
                let processedParagraphs = processSentence(paragraphs);
                logger.info(`Processing ${processedParagraphs.length} paragraphs`);

                await saveParagraphs(processedParagraphs, evdet_id);
            } else {
                logger.info('Article is blank');
            }
        }
    }catch (e){
        logger.error(e)
    }
}//end of splitArticle

splitArticle()

// let input =`
// <p>My dear readers,</p>
// <p> </p>
// <p><strong>1. Quest for World Peace</strong></p>
// <p>This remains man’s <strong>&quot;PROBLEM No. 1&quot;</strong> ever since the first man fell into sin, disobeying the Creator’s clear command (Genesis 3). The answer to man’s quest is simply: &quot;Return to the Creator and obey His commands.&quot; It’s as simple as that.</p>
// <p> </p>
// <p>But modern man, continuing in his own wisdom and pride, has other solutions to his many and difficult problems: the chief of which is &quot;how to sustain peace in a world plagued with disagreement, conflict and war.&quot; So man strives to keep the world at peace by his own wisdom and devices.</p>
// <p> </p>
// <p>The scientific minds think of &quot;science and technology,&quot; the legal and literary-minded resort to &quot;negotiations&quot; and &quot;peace talks.&quot;</p>
// <p> </p>
// <p>Our national paper, The Straits Times (May 7, 2014), highlights Singapore’s &quot;Inter-faith harmony&quot; a striking success and a &quot;world model of communal peace&quot; – a country whose various religious and racial groups co-exist in harmony and unity – where each religion receives equal credit and acknowledgement. Singapore has learnt how to handle communal, religious and racial differences without &quot;treading on anyone’s toes.&quot;</p>
// <p> </p>
// <p><strong>2. ASEAN leaders call for restraint</strong></p>
// <p>Hearing the warning sounds of war-drums, ASEAN’s leaders have issued a united call to countries disputing over South China Sea issues to exercise restraint. Hopefully the countries involved will settle their differences in a peaceable manner, heeding the 10-nation grouping’s appeal. The consequences of war would be too unpleasant to imagine.</p>
// <p> </p>
// <p>Those of us who have experienced the horror of the Second World War (in the Far East, 1941-45) will surely hope that the present &quot;spat&quot; will be settled in a peaceful manner. But we can only hope, &quot;keeping the fingers crossed,&quot; as the saying goes.</p>
// <p> </p>
// <p>But think hard and imagine a &quot;worst scenario&quot; development. Do not forget that nuclear weapons may be used. It is common knowledge that nuclear capabilities are available to many countries. Who knows if one or more of the disputing parties involved may be tempted to use a &quot;doomsday weapon.&quot; Suddenly, other uninvolved parties may be drawn in and the escalation may spin out of control – the big powers getting dragged in!</p>
// <p> </p>
// <p>It may well be the start of the Third World War and Armageddon!</p>
// <p> </p>
// <p>Then our Lord will return! Or worse, it may lead to the outbreak of global War such as described in the Book of Revelation:</p>
// <p style=&quot;padding-left: 30px;&quot;>&quot;And there were voices, and thunders, and lightnings; and there was a great earthquake, such as was not since men were upon the earth, so mighty an earthquake, and so great. And the great city was divided into three parts, and the cities of the nations fell: and great Babylon came in remembrance before God, to give unto her the cup of the wine of the fierceness of his wrath. And every island fled away, and the mountains were not found. And there fell upon men a great hail out of heaven, every stone about the weight of a talent: and men blasphemed God because of the plague of the hail; for the plague thereof was exceeding great.&quot; (Rev 16:18-21)</p>
// <p>When mankind is incapable of managing his own affairs, the Lord Jesus, Prince of Peace, will return:</p>
// <p style=&quot;padding-left: 30px;&quot;>&quot;And I saw heaven opened, and behold a white horse; and he that sat upon him was called Faithful and True, and in righteousness he doth judge and make war. His eyes were as a flame of fire, and on his head were many crowns; and he had a name written, that no man knew, but he himself. And he was clothed with a vesture dipped in blood: and his name is called The Word of God. And the armies which were in heaven followed him upon white horses, clothed in fine linen, white and clean. And out of his mouth goeth a sharp sword, that with it he should smite the nations: and he shall rule them with a rod of iron: and he treadeth the winepress of the fierceness and wrath of Almighty God. And he hath on his vesture and on his thigh a name written, King Of Kings, And Lord Of Lords.&quot;(Rev 19:11-16)</p>
// <p> </p>
// <p>The stage is set for the final judgment of those who are behind the world’s unrest. These evil individuals will be consigned to the lake of fire and brimstone, before the advent of God’s<strong> new heaven and new earth.</strong></p>
// <p> </p>
// <p>The &quot;end time happenings&quot; tell us one thing: man must return and submit himself to Almighty God our Creator and Redeemer, who will finally bring in the New Heaven and New Earth; after the old heaven and earth have passed away.</p>
// <p> </p>
// <p>Heed the Saviour’s call from heaven:</p>
// <p style=&quot;padding-left: 30px;&quot;>&quot;And, behold, I come quickly; and my reward is with me, to give every man according as his work shall be. I am Alpha and Omega, the beginning and the end, the first and the last.&quot;(Rev 22:12-13)</p>
// <p> </p>
// <p>Yours faithfully in the Saviour’s love,</p>
// <p>Dr SH Tow, Sr Pastor</p>
// <p style=&quot;font-family: 'Times New Roman'; font-size: medium; text-align: justify; line-height: 24px;&quot;><span style=&quot;font-size: 14pt; line-height: 28px; font-family: Arial, sans-serif;&quot;></span></p>
// `
// let delimiter = '</p>'
// if( _.includes(input, '</div>') ){
//     delimiter = '</div>'
// } else{
//     delimiter = '<br />'
// }
// console.info(delimiter)
//
// let paragraphs = _.split(input, delimiter)
// const processSentence = (arr) => arr.map(item => removeLineBreaks(removeHtmlTags(removeHtmlUnicode(removeNbsp(item))))).filter(item => item.trim() !== '')
// paragraphs = processSentence(paragraphs)
// for (const paragraph of paragraphs) {
//     let article = removeLineBreaks(removeHtmlTags(removeHtmlUnicode(removeNbsp(paragraph))))
//     if( isBlank(_.trim(article)) != true ){
//         console.info(article)
//     }else{
//
//     }
// }
