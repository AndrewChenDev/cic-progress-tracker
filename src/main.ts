import cron from 'node-cron';
import checkProgress from "./checkProgress";
import cronParser from 'cron-parser';

const cronSchedule = '0 * * * *';

// Check if an environment variable exists
checkEnvVariables();

run().then(() => {
    console.log('Scheduled task started');
    // Schedule your task to run on the desired schedule, e.g., every hour
    cron.schedule(cronSchedule, async () => {
        console.log('Running scheduled task');
        await run();
    });
}).catch((err) => {
    console.error('Error starting scheduled task:', err);
});


async function run() {
    await checkProgress();
    // Use cron-parser to determine the next execution time
    try {
        const interval = cronParser.parseExpression(cronSchedule);
        console.log('Next task will run at:', interval.next().toString());
    } catch (err) {
        console.error('Error parsing cron schedule:', err);
    }
}


// Function to check if all required environment variables are set
function checkEnvVariables() {
    // Required environment variables
    const requiredEnv = ['URL', 'USERNAME', 'PASSWORD', 'CLIENT_ID', 'CLIENT_SECRET', 'MY_EMAIL', 'MY_NAME'];
    const unsetEnv = requiredEnv.filter(envVar => !process.env[envVar]);

    if (unsetEnv.length > 0) {
        console.error(`Missing required environment variables: ${unsetEnv.join(', ')}`);
        process.exit(1); // Exit the application with an error code
    } else {
        console.log('All required environment variables are set');
    }
}
