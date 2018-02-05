const express = require('express');
const RSVP = require('rsvp');
const request = require('request');

const router = express.Router();

const firebase_url = process.env.firebase_url;
const firebase_auth_token = process.env.firebase_auth_token;
const firebaseBaseUrl = `${firebase_url}/groups.json?auth=${firebase_auth_token}`;

const makeRequest = options => {
  return new RSVP.Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      const json = body && JSON.parse(body);
      if (!error && response.statusCode == 200) {
        resolve(json);
      }
      reject(json);
    });
  });
};

router.get('/', function(req, res, next) {
  const uri = `${firebaseBaseUrl}`;
  makeRequest({
    uri,
  }).then(response => {
    const groups = [];
    if (response && typeof response === 'object') {
      Object.keys(response).forEach(id => {
        const group = response[id];
        group.id = id;
        groups.push(group);
      });
    }
    res.json({
      groups,
    });
  }, error => {
    next(error);
  });
});

module.exports = router
