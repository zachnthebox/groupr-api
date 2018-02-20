const FB = require('fb');

const group_id = process.env.facebook_group_id;
const access_token = process.env.facebook_access_token;

FB.setAccessToken(access_token);

function postToGroup(message, link) {
  FB.api(`/${group_id}/feed`, 'POST', {
    message,
    link,
  }, function (res) {
    if (!res) {
      throw false;
    } else if (res.error) {
      throw res.error;
    }
    console.log('Post Id: ' + res.id);
  });
}

module.exports = {
  postToGroup,
};