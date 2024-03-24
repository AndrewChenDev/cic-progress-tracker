import playwright, {Browser, BrowserContext, Page} from 'playwright';
import fs from 'fs';
import {authorize, sendMessage} from "./sendEmail";

interface StoredData {
    dateText: string;
    statusText: string;
}

async function checkProgress(): Promise<void> {
    const storedData: StoredData = readStoredData();

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
        browser = await playwright.chromium.launch();
        context = await browser.newContext();
        page = await context.newPage();

        console.log('Browser opened, loading page...');
        await page.goto(process.env.URL ?? '', {waitUntil: 'load'});

        await login(page);

        const {dateText, statusText} = await captureData(page);

        const hasChange = checkForChange(dateText, statusText, storedData);
        if (hasChange) {
            writeData({dateText, statusText});
            console.log('Data has changed');
            let auth = await authorize();
            if (auth) {
                await sendMessage(auth);
            }
        } else {
            console.log('No change in data');
        }
        console.log({
            Date: dateText,
            Status: statusText

        })
    } catch (error) {
        console.error('An error occurred, closing browser now:', error);
    } finally {
        await closeResources(page, context, browser);
    }
}

async function login(page: Page): Promise<void> {
    const usernameField = await page.$('input[name="uci"]');
    await usernameField?.fill(process.env.USERNAME ?? '');

    const passwordField = await page.$('input[name="password"]');
    await passwordField?.fill(process.env.PASSWORD ?? '');

    const signInButton = await page.$('button.btn-sign-in');
    await signInButton?.click();

    console.log('Logged in, waiting for page to load...');
    await page.waitForSelector('div.page-content', {state: 'visible', timeout: 5000});
}

async function captureData(page: Page): Promise<{ dateText: string; statusText: string }> {
    const dateElement = await page.$('dd.date-text');
    const dateText = (await dateElement?.textContent())?.trim() ?? '';

    const statusElement = await page.$('div.page-content strong');
    const statusText = (await statusElement?.textContent())?.trim() ?? '';

    console.log('Data captured');
    return {dateText, statusText};
}

function checkForChange(dateText: string, statusText: string, storedData: StoredData): boolean {
    return dateText !== storedData.dateText.trim() || statusText !== storedData.statusText.trim();
}

function readStoredData(): StoredData {
    try {
        if (fs.existsSync('data.json')) {
            const data = fs.readFileSync('data.json', 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading from data.json:', error);
    }
    return {dateText: '', statusText: ''};
}

function writeData(data: StoredData): void {
    try {
        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing to data.json:', error);
    }
}

async function closeResources(page: Page | null, context: BrowserContext | null, browser: Browser | null): Promise<void> {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    console.log('Browser closed');
}

export default checkProgress;
