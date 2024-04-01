import cron from 'node-cron';
import checkProgress from "./checkProgress";
import cronParser from 'cron-parser';
import {authorize} from "./sendEmail";

// Define a type for the environment variable keys to improve type checking
type EnvKey = 'USERNAME' | 'PASSWORD' | 'MY_EMAIL' | 'MY_NAME';

const cronSchedule: string = `${process.env.CRON_SCHEDULE}` || '0 * * * *';

(async () => {
    // Check if an environment variable exists
    checkEnvVariables();
    await checkCredentials();
    try {
        await run();
    }catch (err){
        console.error('Error starting scheduled task:', err);
    }
})();

async function run(): Promise<void> {
    await checkProgress();
}

// Function to check if all required environment variables are set
function checkEnvVariables(): void {
    // Required environment variables
    const requiredEnv: EnvKey[] = ['USERNAME', 'PASSWORD', 'MY_EMAIL', 'MY_NAME'];
    const unsetEnv: string[] = requiredEnv.filter((envVar: EnvKey) => !process.env[envVar]);

    if (unsetEnv.length > 0) {
        console.error(`Missing required environment variables: ${unsetEnv.join(', ')}`);
        process.exit(1); // Exit the application with an error code
    } else {
        console.log('All required environment variables are set');
    }
}

async function checkCredentials(){
    let auth = await authorize();
    if(auth){
        console.log('Credentials are valid');
    }else{
        console.log('Credentials are invalid');
        process.exit(1);
    }
    return
}
