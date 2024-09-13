import {cleanState, hashHeader, keepState, WAIT_FOR_INPUT} from "../userstat.mjs";
import _ from 'lodash';
import env from 'dotenv';
import decimal from 'decimal.js'
import {ListObjectsV2Command, S3Client} from '@aws-sdk/client-s3'

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
    const userstat_key = hashHeader(msg.from);
    cleanState(userstat_key);

    let isExisted = await searchS3Objects( 'testhymn', hymnNum, '.jpg' )
    if( !isExisted ){
        return { text: `Hymn number ${hymnNum} not exist` };
    }
    return { text: `https://d13vhl06g9ql7i.cloudfront.net/hymn/testhymn/num/${hymnNum}` };
}

const s3 = new S3Client({ region: 'ap-southeast-1' });
async function searchS3Objects(bucketName, prefix, postfix) {
    let continuationToken = null;

    do {
        const params = {
            Bucket: bucketName,
            Prefix: `${prefix}_`,
            ContinuationToken: continuationToken
        };

        try {
            const data = await s3.send(new ListObjectsV2Command(params));

            // Check if any object keys match the prefix and postfix criteria
            for (const object of data.Contents) {
                if (object.Key.startsWith(`${prefix}_`) && object.Key.endsWith(postfix)) {
                    return true; 
                }
            }

            continuationToken = data.IsTruncated ? data.NextContinuationToken : null;

        } catch (err) {
            console.error('Error listing objects:', err);
            return false; // Return false on error
        }
    } while (continuationToken);

    return false; 
}

