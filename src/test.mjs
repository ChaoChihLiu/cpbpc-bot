import natural from "natural"
import createConnection from "./service/dbConnPool.mjs"
import _ from "lodash";

async function findMatchingRecords(inputText) {
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(inputText);

    // Create a connection to the MySQL database
    const connection = await createConnection()

    // Construct the SQL query
    const query = `
    SELECT *,
           ( ${tokens.map(token => `IF(content LIKE ?, 1, 0)`).join(' + ')} ) AS match_score
    FROM your_table
    ORDER BY match_score DESC
    LIMIT 10
  `;

    // Generate the parameter list
    const parameters = tokens.map(token => `%${token}%`);

    console.info(query)

    // Execute the query
    const [results] = await connection.execute(query, parameters);

    // Close the connection
    // await connection.end();
    //
    // return results;
}

// Example usage
let input = ["buy","company share","investment"];

console.info(_.trim(input.map(item => `+${item}`).join(' ')))