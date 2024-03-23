import cron from 'node-cron';
import checkProgress from "./checkProgress";
import cronParser from 'cron-parser';

const cronSchedule = '0 * * * *';
run().then(()=>{
    console.log('Scheduled task started');
    // Schedule your task to run on the desired schedule, e.g., every hour
    cron.schedule(cronSchedule, async () => {
        console.log('Running scheduled task');
        await run();
    });
}).catch((err)=>{
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


