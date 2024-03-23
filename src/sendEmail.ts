const fs = require('fs').promises;
import path from 'path';
import {authenticate} from '@google-cloud/local-auth';
import {google,} from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');


/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
// @ts-ignore
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client:any): Promise<void> {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
    let client:any = await loadSavedCredentialsIfExist();
    if (client) {
        console.log('Using saved credentials');
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        console.log('Saving credentials');
        await saveCredentials(client);
    }
    return client;
}

export async function sendMessage(auth:any, data?:any) {
    const gmail = google.gmail({version: 'v1', auth});

    const rawMessage = `From: "${process.env.MY_NAME}" <${process.env.MY_EMAIL}\r\n` +
        `To: ${process.env.MY_EMAIL}\r\n` +
        `Subject: CitizenShip Tracker Updated\r\n` +
        `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
        `Hi, this is a notification that the status of your citizenship application has been updated.`

    const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
        },
    })
    console.log('Message sent!')
}

