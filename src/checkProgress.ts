import playwright from 'playwright';
import fs from 'fs';
import {authorize, sendMessage} from "./sendEmail";
// Function to read stored data from JSON file
function readStoredData() {
    if (fs.existsSync('data.json')) {
        const data = fs.readFileSync('data.json');
        return JSON.parse(data.toString());
    }
    return { dateText: '', statusText: '' }; // Return default values if the file does not exist
}

// Function to write data to JSON file
function writeData(data: any) {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2)); // Pretty print JSON
}

async function checkProgress() {
    const storedData = readStoredData();

    // const browser = await playwright.chromium.launch({ headless: false });
    const browser = await playwright.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('browser opened');
        await page.goto(`${process.env.URL}`, { waitUntil: "load" });
        // Fill the username field
        const usernameField = await page.$('input[name="uci"]');
        await usernameField?.fill(`${process.env.USERNAME}`);

        // Fill the password field
        const passwordField = await page.$('input[name="password"]');
        await passwordField?.fill(`${process.env.PASSWORD}`);

        // Click the "Sign in" button
        const signInButton = await page.$('button.btn-sign-in');
        await signInButton?.click();

        // Wait for the page content to be visible
        await page.waitForSelector('div.page-content', { state: 'visible', timeout: 5000 });

        // Capture the date text and status text
        const dateElement = await page.$('dd.date-text');
        const dateText = (await dateElement?.textContent())?.trim();

        const statusElement = await page.$('div.page-content strong');
        const statusText = (await statusElement?.textContent())?.trim();

        // Check if there's a change
        const hasChange = dateText !== storedData.dateText.trim() || statusText !== storedData.statusText.trim();

        if (hasChange) {
            // Update the stored data if there's a change
            writeData({ dateText: dateText, statusText: statusText });
            console.log('Data has changed');
            let auth = await authorize();
            await sendMessage(auth);
        } else {
            console.log('No change in data');
        }
        console.log({
            Date: dateText,
            Status: statusText

        })
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Ensure the page and browser are closed even if an error occurs
        await page.close();
        await context.close();
        await browser.close(); // This ensures the browser instance is properly shut down
        console.log('Browser closed');
    }
}

export default checkProgress;
