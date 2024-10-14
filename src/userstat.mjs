import crypto from "crypto";
import * as _ from "lodash"
import logger from "./service/logger.mjs";

let userStates = new Map()

export const WAIT_FOR_INPUT = 'wait_for_input'
// export const WAIT_FOR_AUTH_EMAIL = 'wait_for_auth_email'
// export const WAIT_FOR_AUTH_NRIC = 'wait_for_auth_nric'
export const WAIT_FOR_AUTH = 'wait_for_auth'

export function keepState(user_sha, state){
    let newStateObj = {create_time: Date.now(), state: ''}
    if( userStates.has(user_sha) ){
        newStateObj = {...userStates[user_sha]}
    }

    newStateObj.state = `${state}-${newStateObj.state}`
    userStates.set(user_sha, newStateObj)
}

export function isWaitForInput(user_sha){
    if( !userStates.has(user_sha) ){
        return false
    }

    if( userStates.get(user_sha).state.startsWith(WAIT_FOR_INPUT) ){
        return true
    }


    return false
}

export function isWaitForAuth(user_sha){
    if( !userStates.has(user_sha) ){
        return false
    }

    if( userStates.get(user_sha).state.startsWith(WAIT_FOR_AUTH) ){
        return true
    }


    return false
}

// export function isWaitForAuthEmail(user_sha){
//     if( !userStates.has(user_sha) ){
//         return false
//     }
//
//     if( userStates.get(user_sha).state.startsWith(WAIT_FOR_AUTH_EMAIL) ){
//         return true
//     }
//
//
//     return false
// }
//
// export function isWaitForAuthNRIC(user_sha){
//     if( !userStates.has(user_sha) ){
//         return false
//     }
//
//     if( userStates.get(user_sha).state.startsWith(WAIT_FOR_AUTH_NRIC) ){
//         return true
//     }
//
//
//     return false
// }

export function getState(user_sha){
    if( !userStates.has(user_sha) ){
        return ''
    }

    return userStates.get(user_sha).state
}

export function cleanState(user_sha){
    if( !userStates.has(user_sha) ){
        return
    }

    userStates.delete(user_sha)
}

export function cleanStates(){
    if( !userStates || userStates.size <= 0 ){
        return
    }

    let currentTime = Date.now()
    let newStates = new Map()
    logger.info(`before housekeeper ${JSON.stringify(userStates)}`)
    userStates = _.map(userStates, (value, key) => {
        if((currentTime - value['create_time']) < 60){
            return {key, value}
        }
    })
    userStates.forEach( (value, key) => {
        if((currentTime - value.create_time) < 60){
            newStates.set(key, value)
        }
    } )
    logger.info(`after housekeeper ${JSON.stringify(userStates)}`)
}

export function hashHeader(input) {
    var input_str = input
    if( (typeof input) !== 'string' ){
        input_str = JSON.stringify(input)
    }

    const hash = crypto.createHash('sha256');
    hash.update(input_str);
    const hashedInput = hash.digest('hex');

    return hashedInput;
}