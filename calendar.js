const googleapis = require('googleapis');
const RSVP = require('rsvp');
const moment = require('moment');

const calendarId = process.env.google_calendar_id;
const privateKey = process.env.google_private_key;
const clientEmail = process.env.google_client_email;

const { google } = googleapis;

const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, ['https://www.googleapis.com/auth/calendar'], null);

jwtClient.authorize();

function createGroupEvent(event) {
    const calendar = google.calendar('v3');
    return new RSVP.Promise(function (resolve, reject) {
        calendar.events.insert({
            auth: jwtClient,
            calendarId,
            resource: event,
        }, function (err, event) {
            if (err) {
                reject(err);
            }
            resolve(event);
        });
    });
}

function getGroupEvent(date) {
    const options = {
        auth: jwtClient,
        calendarId,
        timeMin: moment(date).startOf('day').format(),
        timeMax: moment(date).endOf('day').format(),
        maxResults: 1,
        singleEvents: true,
        orderBy: 'startTime',
        q: 'group',
    };
    const calendar = google.calendar('v3');
    return new RSVP.Promise(function (resolve, reject) {
        calendar.events.list(options, function (err, response) {
            if (err) {
                reject(err);
            }
            const items = response && response.data && response.data.items || [];
            resolve(items.length && items[0] || null);
        });
    });
}

function updateGroupEvent(eventId, event) {
    const options = {
        auth: jwtClient,
        calendarId,
        eventId,
        resource: event,
    };
    const calendar = google.calendar('v3');
    return new RSVP.Promise(function (resolve, reject) {
        calendar.events.update(options, function (err, event) {
            if (err) {
                reject(err);
            }
            resolve(event);
        });
    });
}

module.exports = {
    getGroupEvent,
    createGroupEvent,
    updateGroupEvent,
};