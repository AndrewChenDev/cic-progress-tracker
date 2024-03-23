import playwright from 'playwright';
import fs from 'fs';
import {authorize, sendMessage} from "./sendEmail";

async function checkProgress() {
    const storedData = readStoredData();

    let browser, context, page;

    try {
        // const browser = await playwright.chromium.launch({ headless: false });
        browser = await playwright.chromium.launch();
        context = await browser.newContext();
        page = await context.newPage();

        console.log('browser opened, loading page...');
        await page.goto(`${process.env.URL}`, {waitUntil: "load"});
        // Fill the username field
        const usernameField = await page.$('input[name="uci"]');
        await usernameField?.fill(`${process.env.USERNAME}`);

        // Fill the password field
        const passwordField = await page.$('input[name="password"]');
        await passwordField?.fill(`${process.env.PASSWORD}`);

        // Click the "Sign in" button
        const signInButton = await page.$('button.btn-sign-in');
        await signInButton?.click();
        console.log('Logged in, waiting for page to load ...');

        // Wait for the page content to be visible
        await page.waitForSelector('div.page-content', {state: 'visible', timeout: 5000});

        // Capture the date text and status text
        const dateElement = await page.$('dd.date-text');
        const dateText = (await dateElement?.textContent())?.trim();

        const statusElement = await page.$('div.page-content strong');
        const statusText = (await statusElement?.textContent())?.trim();
        console.log('Data captured');
        // Check if there's a change
        const hasChange = dateText !== storedData.dateText.trim() || statusText !== storedData.statusText.trim();

        if (hasChange) {
            // Update the stored data if there's a change
            writeData({dateText: dateText, statusText: statusText});
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
        console.error('An error occurred, closing browser now');
    } finally {
        // Ensure the page is closed if it has been opened
        if (page) {
            await page.close();
        }
        // Ensure the context is closed if it has been created
        if (context) {
            await context.close();
        }
        // Ensure the browser is closed if it has been launched
        if (browser) {
            await browser.close(); // This ensures the browser instance is properly shut down
        }
        console.log('Browser closed');
    }
}

// Function to read stored data from JSON file
function readStoredData() {
    try {
        if (fs.existsSync('data.json')) {
            const data = fs.readFileSync('data.json');
            return JSON.parse(data.toString());
        }
        return {dateText: '', statusText: ''}; // Return default values if the file does not exist
    } catch (error) {
        console.error('Error reading from data.json:', error);
        return {dateText: '', statusText: ''}; // Return default values in case of error
    }
}

// Function to write data to JSON file
function writeData(data: any) {
    try {
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2)); // Pretty print JSON
    } catch (error) {
        console.error('Error writing to data.json:', error);
    }
}

export default checkProgress;
