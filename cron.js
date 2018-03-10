const RSVP = require('rsvp');
const request = require('request');
const moment = require('moment-timezone');

moment.tz.setDefault("America/New_York");

const groupr_api_auth_token = process.env.groupr_api_auth_token;
const groupr_api_url = process.env.groupr_api_url;

const makeRequest = options => {
  return new RSVP.Promise(function (resolve, reject) {
    console.log(`requesting url - ${options.uri}`);
    request(options, function (error, response, body) {
      if (!error) {
        console.log('successful response', body);
        resolve(body);
        return;
      }
      console.log('error response', body);
      reject(body);
    });
  });
};

const getGroups = () => {
  const uri = `${groupr_api_url}/groups`;
  return makeRequest({
    uri,
    method: 'GET',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

const updateNextDate = groupId => {
  const uri = `${groupr_api_url}/groups/${groupId}/actions/skip-date`;
  return makeRequest({
    uri,
    method: 'POST',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

const updateNextLocation = groupId => {
  const uri = `${groupr_api_url}/groups/${groupId}/actions/skip-location`
  return makeRequest({
    uri,
    method: 'POST',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

const postGroupLocation = groupId => {
  const uri = `${groupr_api_url}/groups/${groupId}/actions/post`;
  return makeRequest({
    uri,
    method: 'POST',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

getGroups().then(response => {
  const groups = JSON.parse(response).data || [];
  groups.forEach(group => {
    const attributes = group.attributes;
    const groupId = group.id;
    const isDayAfterGroup = moment().endOf('day').isSame(moment(attributes.nextDate).add(1, 'day').endOf('day'))
    const is4DaysBeforeNextGroup = moment().endOf('day').isSame(moment(attributes.nextDate).subtract(4, 'day').endOf('day'))

    if (isDayAfterGroup) {
      console.log('It is the day after group. Updating the next group date and next location');
      console.log(`Group ${groupId}`);
      updateNextDate(groupId).then(() => {
        return updateNextLocation(groupId);
      });
    } else if (is4DaysBeforeNextGroup) {
      console.log('Now posting next group location to social media channels');
      console.log(`Group ${groupId}`);
      postGroupLocation(groupId);
    }
  });
});
