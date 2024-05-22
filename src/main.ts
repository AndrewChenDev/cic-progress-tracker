import checkProgress from "./checkProgress";

// Define a type for the environment variable keys to improve type checking
type EnvKey = 'USERNAME' | 'PASSWORD' | 'MY_EMAIL' | 'MY_NAME'| 'SENDGRID_API_KEY';

const cronSchedule: string = `${process.env.CRON_SCHEDULE}` || '0 * * * *';

(async () => {
    // Check if an environment variable exists
    //output PST time with format YYYY-MM-DD
    console.log(new Date().toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    checkEnvVariables();
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
    const requiredEnv: EnvKey[] = ['USERNAME', 'PASSWORD', 'MY_EMAIL', 'MY_NAME', 'SENDGRID_API_KEY'];
    const unsetEnv: string[] = requiredEnv.filter((envVar: EnvKey) => !process.env[envVar]);

    if (unsetEnv.length > 0) {
        console.error(`Missing required environment variables: ${unsetEnv.join(', ')}`);
        process.exit(1); // Exit the application with an error code
    } else {
        console.log('All required environment variables are set');
    }
}
