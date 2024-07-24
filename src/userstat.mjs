import crypto from "crypto";

const userStates = {}

export function keepState(user_sha, state){
    userStates[user_sha] = state
}

export function isWaitForInput(user_sha){
    if( !userStates[user_sha] ){
        return false
    }

    if( userStates[user_sha].startsWith('wait_for_input') ){
        return true
    }


    return false
}

export function getState(user_sha){
    if( !userStates[user_sha] ){
        return ''
    }

    return userStates[user_sha]
}

export function cleanState(user_sha){
    if( !userStates[user_sha] ){
        return
    }

    userStates[user_sha]=''
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