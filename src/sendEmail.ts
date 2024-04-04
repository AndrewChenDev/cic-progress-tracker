import path from 'path';
import {authenticate} from '@google-cloud/local-auth';
import {Auth, google} from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
import _ from 'lodash';

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<Auth.OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist(): Promise<Auth.OAuth2Client | null> {
    try {
        const credentials = await Bun.file(TOKEN_PATH).json();
        const {client_id, client_secret, refresh_token} = credentials;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
        oAuth2Client.setCredentials({refresh_token});
        return oAuth2Client;
    } catch (err) {
        console.error('Failed to load saved credentials:', err);
        return null;
    }
}

/**
 * Serializes credentials to a file.
 *
 * @param {Auth.OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client: Auth.OAuth2Client): Promise<void> {
    if (!client.credentials.refresh_token) {
        console.error('No refresh token found, credentials not saved');
        return;
    }
    try {
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: client._clientId,
            client_secret: client._clientSecret,
            refresh_token: client.credentials.refresh_token,
        }, null, 2);
        await Bun.write(TOKEN_PATH, payload);
        console.log('Credentials saved successfully.');
    } catch (err) {
        console.error('Failed to save credentials:', err);
    }
}

/**
 * Load or request authorization to call APIs.
 *
 * @return {Promise<Auth.OAuth2Client|null>}
 */
export async function authorize(): Promise<Auth.OAuth2Client | null> {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        console.log('Using saved credentials');
        return client;
    }
    try {
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
        await saveCredentials(client);
    } catch (err) {
        console.error('Authorization failed:', err);
        return null;
    }
    return client;
}

/**
 * Send an email message.
 *
 * @param {Auth.OAuth2Client} auth
 * @param responseBody
 */
export async function sendMessage(auth: Auth.OAuth2Client, responseBody:any) {
    try {
        const gmail = google.gmail({version: 'v1', auth});
        const rawMessage = `From: "${process.env.MY_NAME}" <${process.env.MY_EMAIL}>\r\n` +
            `To: ${process.env.MY_EMAIL}\r\n` +
            `Subject: Citizenship Tracker Updated\r\n` +
            `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
            emailContent(responseBody);

        const encodedMessage = Buffer.from(rawMessage).toString('base64url');
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log('Message sent!');
    } catch (err) {
        console.error('Failed to send message:', err);
    }
}

function emailContent(data: any){
    return `<!DOCTYPE html>
<html lang="en">
<body>
    <h1>Dear Applicant,</h1>
    <p>Hi, this is a notification that the status of your citizenship application has been updated.</p>

    <h2>Application Summary:</h2>
    <ul>
        <li><strong>Application Number:</strong> ${data.applicationNumber}</li>
        <li><strong>UCI (Unique Client Identifier):</strong> ${data.uci}</li>
        <li><strong>Last Updated:</strong> ${data.lastUpdatedTime}</li>
        <li><strong>Status:</strong> ${_.startCase(data.status)}</li>
    </ul>

    <h2>Actions Required:</h2>
    <p>We kindly ask for your attention to the following required action(s) to ensure the smooth processing of your application:</p>
    <ul>
        ${data.actions.map((action:any) => `
        <li style="margin: 30px 0">
            <strong>${_.startCase(action.activity)}:</strong>
            <ul>
                <li><strong>Details:</strong> ${action.title.en}</li>
                <li><strong>Instructions:</strong> ${action.content.en}</li>
            </ul>
        </li><br/><br/><br/>
        `).join('')}
    </ul>

    <h2>Application Activities:</h2>
    <ul>
        ${data.activities.map((activity:any) => `
        <li style="margin: 30px 0">
            ${_.startCase(activity.activity)}:<strong>${_.startCase(activity.status)}</strong>
        </li><br/><br/><br/>
        `).join('')}
    </ul>

    <h2>Application History:</h2>
    <ul>
        ${data.history.map((entry:any) => `
        <li style="margin: 30px 0">
            <strong>${entry.title.en}</strong><br/>
            ${entry.time}<br/><br/>
            ${entry.text.en}
        </li>
        <br/><br/><br/>
        `).join('')}
    </ul>
</body>
</html>
`;
}
