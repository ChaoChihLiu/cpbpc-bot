import {hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import decimal from 'decimal.js'

env.config();

export const OBJ_NAME_SEARCH_HYMN = 'searchHymn';
decimal.set({ rounding: decimal.ROUND_HALF_EVEN });

export function run(msg) {
    let user_sha = hashHeader(msg.from);

    keepState(user_sha, `${WAIT_FOR_INPUT}-${OBJ_NAME_SEARCH_HYMN}`);

    return { text: `give me hymn number` };
}

export async function handleWaitForInput(msg) {
    const hymnNum = _.toLower(msg.text)

    return { text: `https://d13vhl06g9ql7i.cloudfront.net/hymn/testhymn/num/${hymnNum}` };
}

function splitArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
