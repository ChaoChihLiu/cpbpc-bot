import {google} from 'googleapis';

const KEYFILEPATH = './.gcp_secret';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Authenticate with the Google Sheets API
export async function authenticate() {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    return authClient;
}


