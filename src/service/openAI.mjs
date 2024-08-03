import axios from 'axios'
import env from 'dotenv'

env.config()

const getOpenAIKey = () => process.env.OPENAI_API_KEY;

export async function comprehendQuestion(quesiton){
    let result = await createCompletions(rephraseQuestion(quesiton))
    return JSON.parse(result['choices'][0]['message']['content'])
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

function rephraseQuestion(question) {
    return `Comprehend the meaning of the following question and provide keywords or key phrases only,
                including synonyms of keywords/key phrases in biblical context: ${question}
                and please organise your answer in array only`;
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
