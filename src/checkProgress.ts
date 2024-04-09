import playwright, {Browser, BrowserContext, Page} from 'playwright';
import {authorize, sendMessage} from "./sendEmail";

interface StoredData {
    dateText: string;
    statusText: string;
}
async function checkProgress(): Promise<void> {
    let storedData = Bun.file('data.json');
    if (await storedData.exists()) {
        storedData = await storedData.json();
    } else {
        await Bun.write('data.json', JSON.stringify({dateText:'', statusText:''}));
        storedData = await Bun.file('data.json').json();
    }
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    try {
        browser = await playwright.chromium.launch();
        context = await browser.newContext();
        page = await context.newPage();


        // Listen for all responses to capture a specific POST request response
        page.on('response', async (response:any) => {
            const request = response.request();
            // Check if the response is for a POST request
            if (response.request().method() === 'POST' && response.url() === 'https://api.tracker-suivi.apps.cic.gc.ca/user'){
                const responseBody = await response.json();

                if(request.postDataJSON()?.method === 'get-application-details'){
                    responseBody.history.sort((a: { time: number; }, b: { time: number; }) => b.time - a.time);
                    convertTimestamps(responseBody);

                    const {lastUpdatedTime, status} = responseBody;
                    const hasChange = checkForChange(lastUpdatedTime, status, storedData);
                    if (hasChange) {
                        await Bun.write('data.json', JSON.stringify({dateText:lastUpdatedTime, statusText:status}));
                        console.log('Data has changed');
                        let auth = await authorize();
                        if (auth) {
                            await sendMessage(auth,responseBody);
                        }
                    } else {
                        console.log('No change in data');
                    }
                    console.log({
                        Date: responseBody.lastUpdatedTime,
                        Status: responseBody.status
                    })
                }
            }
        });

        console.log('Browser opened, loading page...');
        await page.goto(process.env.URL ?? 'https://tracker-suivi.apps.cic.gc.ca/en/login', {waitUntil: 'load'});

        await login(page);

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

function checkForChange(dateText: string, statusText: string, storedData: StoredData): boolean {
    return dateText !== storedData.dateText || statusText !== storedData.statusText;
}

async function closeResources(page: Page | null, context: BrowserContext | null, browser: Browser | null): Promise<void> {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    console.log('Browser closed');
}

function convertTimestamps(obj:any) {
    // Helper function to check if a key ends with 'time'
    const endsWithTime = (key: string) => key.toLowerCase().endsWith('time');

    // Helper function to convert timestamp to a readable date string
    const toReadableDate = (timestamp: string | number | Date) => new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Vancouver', // Adjust the timeZone as needed
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(timestamp));

    // Recursive function to traverse and convert timestamps
    const traverseAndConvert = (currentObj: { [x: string]: any; }) => {
        Object.keys(currentObj).forEach(key => {
            if (endsWithTime(key) && typeof currentObj[key] === 'number') {
                // Convert the timestamp to a readable date string
                currentObj[key] = toReadableDate(currentObj[key]);
            } else if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
                // If the value is an object, recurse into it
                traverseAndConvert(currentObj[key]);
            }
        });
    };

    // Start the traversal and conversion
    traverseAndConvert(obj);

    // Return the modified object
    return obj;
}
export default checkProgress;
