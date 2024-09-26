import env from 'dotenv';

env.config();

export const OBJ_NAME_SEARCH_HYMN_MENU = 'searchHymnMenu';

export const bucketName = 'cpbpc-hymn'
export const baseURL = `https://d13vhl06g9ql7i.cloudfront.net/hymn/cpbpc-hymn/num/`
export const hymnCate = 'churchhymnal'

export function run(msg) {
    return {
        text: 'Search Hymn With...?',
        options: {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Keyword/Number', callback_data: 'searchHymn' },
                        { text: 'Scripture', callback_data: 'searchHymnBible' },
                        { text: 'Topic', callback_data: 'searchHymnTopic' }
                    ],
                    // [
                    //     { text: 'Topic', callback_data: 'searchHymnTopic' },
                    //     { text: 'Group', callback_data: 'searchHymnGroup' }
                    // ]
                ]
            }
        } //end of options
    } //end of return
}





