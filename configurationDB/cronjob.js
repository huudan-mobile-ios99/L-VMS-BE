//CRONJOB
const cron = require('node-cron');
const dboperation = require('./dboperation');  // Adjust the path as needed
const fs = require('fs');
const { format } = require('date-fns');

let previousDataLength = null;  // Store the previous data length to detect changes
let countTotal = 0;  // Counter for runs with data.length > 0
let countjobScreen = 0;
let countjobAds = 0;
let currentCronJob = null;  // Store the current cron job

// const screenID = 2; //OFF old version
// const adsID = 9; //SHOW ADS old version


const screenID = 1; //OFF
const adsID = 0; //SHOW ADS
let isRunningAds = false; // Flag to prevent multiple ads runs
const DELAY_DURATION_MS = 60000; // 60 seconds



function logToFile(message) {
    const now = new Date();
    const timestamp = format(now, 'hh:mm:ss a MM/dd/yyyy');
    const logMessage = `${timestamp} - ${message} `;
    fs.appendFileSync('log_output.txt', logMessage + '\n', (err) => {
        if (err) throw err;
    });
}

function myJobScreen() {
    countjobScreen++;
    const message = `Running Screen (${countjobScreen})`;
    console.log(message);
    logToFile(message);
    dboperation.loadPreset(screenID);
    // Add your logic here for when data.length === 0
}

function myJobAds() {
    countjobAds++;
    const message = `Running Ads (${countjobAds})`;
    console.log(message);
    logToFile(message);
    dboperation.loadPreset(adsID);
    // Add your logic here for when data.length > 0
}

// Function to get the schedule interval based on data length
function getScheduleInterval(dataLength) {
     return '*/5 * * * * *';  // Every 3 seconds
}

let isExecuting = false; // Flag to prevent multiple executions of the job
async function executeJob() {
    if (isExecuting) {
        console.log("Job execution is already in progress. Skipping this run.");
        return;
    }
    isExecuting = true; // Set flag to indicate the job is running
    const currentDate = new Date().toISOString().split('T')[0];
    try {
        const data = await dboperation.getMachineOnlineStatus(currentDate);
        const dataLength = data.length;
        countTotal++;
        console.log(`machineOnlineStatus: ${dataLength} (${countTotal})`);

        if (previousDataLength !== dataLength) {
            console.log(`Previous data length: ${previousDataLength}, Current data length: ${dataLength}`);
            if (dataLength === 0 && previousDataLength !== 0) {
                if (!isRunningAds) {
                    console.log('Data length changed to 0. Initiating delay...');
                    isRunningAds = true;  // Set the flag to prevent re-running
                    // Start a delay to confirm data length remains 0
                    const startDelay = Date.now();
                    let delayConfirmed = true;

                    // Check if data length remains 0 during the delay period
                    while (Date.now() - startDelay < DELAY_DURATION_MS) {
                        const currentData = await dboperation.getMachineOnlineStatus(currentDate);
                        if (currentData.length !== 0) {
                            console.log('Data length changed during delay period. Cancelling Ads.');
                            delayConfirmed = false;
                            break;
                        }
                        await delay(1000); // Poll every 1 seconds during the delay period
                    }

                    if (delayConfirmed) {
                        myJobAds();
                    }
                    isRunningAds = false;  // Reset the flag after the process
                }
            } else if (dataLength > 0 && (previousDataLength === null || previousDataLength === 0)) {
                myJobScreen();
            }

            previousDataLength = dataLength;
        }
    } catch (error) {
        console.log(`Error fetching machine online status: ${error}`);
        isRunningAds = false; // Reset the flag in case of an error
    } finally {
        isExecuting = false; // Reset flag to indicate the job is complete
    }
}


// Function to start the cron job
function startCronJob() {
    const initialInterval = getScheduleInterval(previousDataLength || 0); // Initial schedule
    console.log(`Starting cron job with interval: ${initialInterval}`);

    // Schedule the cron job to run executeJob at the specified interval
    currentCronJob = cron.schedule(initialInterval, executeJob);
    currentCronJob.start();
    console.log('Cron job started successfully.');
}

// Function to stop the cron job
async function stopCronJob() {
    if (currentCronJob) {
        currentCronJob.stop();

        currentCronJob = null; // Ensure the job is cleared
        console.log('Cron job stopped.');
        logToFile('Cron job stopped.');
    } else {
        console.log('No cron job to stop.');
        logToFile('No cron job to stop.');
    }
}

// Function to restart the cron job
async function reStartCronJob() {
    await stopCronJob(); // Stop the current cron job if running
    await executeJob(); // Run executeJob to process the current data
    startCronJob(); // Re-run the cron job with updated schedule
    console.log('Cron job restarted.');
    logToFile('Cron job restarted.');
}

// delay to run job
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the initial cron job
startCronJob();

module.exports = {
    cron, stopCronJob, reStartCronJob,
};
