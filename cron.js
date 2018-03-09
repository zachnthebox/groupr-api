const RSVP = require('rsvp');
const request = require('request');
const moment = require('moment-timezone');

moment.tz.setDefault("America/New_York");

const groupr_api_auth_token = process.env.groupr_api_auth_token;
const groupr_api_url = process.env.groupr_api_url;

const makeRequest = options => {
  return new RSVP.Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      }
      reject(body);
    });
  });
};

const getGroups = () => {
  return makeRequest({
    uri: `${groupr_api_url}/groups`,
    method: 'GET',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

const updateNextDate = groupId => {
  return makeRequest({
    uri: `${groupr_api_url}/groups/${groupId}/actions/skipDate`,
    method: 'POST',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

const updateNextLocation = groupId => {
  return makeRequest({
    uri: `${groupr_api_url}/groups/${groupId}/actions/skipLocation`,
    method: 'POST',
    auth: {
      bearer: groupr_api_auth_token,
    },
  });
};

const postGroupLocation = groupId => {
  return makeRequest({
    uri: `${groupr_api_url}/groups/${groupId}/actions/post`,
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
        updateNextLocation(groupId)
      }, error => {
        console.log(error);
      });
    } else if (is4DaysBeforeNextGroup) {
      console.log('Now posting next group location to social media channels');
      console.log(`Group ${groupId}`);
      postGroupLocation(groupId).catch(error => {
        console.log(error);
      });
    }
  });
});
