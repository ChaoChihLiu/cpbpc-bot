import {google} from 'googleapis';
import logger from './logger.mjs'

const KEYFILEPATH = './.gcp_secret';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Authenticate with the Google Sheets API
async function authenticate() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    return authClient;
}

// Read data from Google Sheets
var spreadsheetId = ""
async function readSheet() {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const range = '2024-08!A1:C10'; // Adjust the range as needed

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values;
    if (rows.length) {
        // logger.info('Data from the spreadsheet:');
        // rows.map((row) => {
        //     logger.info(row);
        // });
    } else {
        logger.info('No data found.');
    }
}

export async function readSheetWithRange( spreadsheetId, range ) {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // const range = '2024-08!A1:C10'; // Adjust the range as needed

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values;
    if (rows.length) {
        // logger.info('Data from the spreadsheet:');
        // rows.map((row) => {
        //     logger.info(row);
        // });
        return rows
    } else {
        logger.info('No data found.');
    }

    return []
}

// Write data to Google Sheets
async function writeSheet() {
    const authClient = await authenticate();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = 'your-spreadsheet-id';
    const range = 'Sheet1!A1'; // Adjust the range as needed
    const valueInputOption = 'RAW';
    const resource = {
        values: [
            ['Column A', 'Column B', 'Column C', 'Column D'],
            ['Value 1', 'Value 2', 'Value 3', 'Value 4'],
        ],
    };

    const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption,
        resource,
    });

    logger.info(`${response.data.updatedCells} cells updated.`);
}

// Uncomment the function you want to use
// spreadsheetId = await readConfigFromFile('./.config', 'remembrance_telegram')
// readSheetWithRange(spreadsheetId, 'July!B1:B62');
// writeSheet();

