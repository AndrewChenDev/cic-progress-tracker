import sgMail from '@sendgrid/mail'
import _ from "lodash";
sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '')

export async function sendMessage(responseBody:any) {
    const msg = {
        to: process.env.MY_EMAIL, // Change to your recipient
        from: 'tracker@andrew.ac', // Change to your verified sender
        subject: 'Citizenship Tracker Updated',
        html: emailContent(responseBody),
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })
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
