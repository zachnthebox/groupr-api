const express = require('express');
const RSVP = require('rsvp');
const request = require('request');
const JWT = require('jsonwebtoken');

const router = express.Router();

const firebase_api_key = process.env.firebase_api_key;

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

const generateToken = (data, expiresIn) => {
  const token = JWT.sign({
    data,
  }, process.env.jwt_secret, {
      expiresIn,
    });
  return token;
};

router.post('/', function (req, res) {
  const session = req.body.session;
  const email = session.email;
  const password = session.password;
  const expiresIn = session.expiresIn || '1h';
  makeRequest({
    uri: `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${firebase_api_key}`,
    method: 'POST',
    json: {
      email,
      password,
    },
  }).then(response => {
    const token = generateToken({
      email,
    }, expiresIn);

    res.json({
      session: {
        email,
        token,
        password: '',
      },
    });
  }, err => {
    res.sendStatus(401);
  });
});

module.exports = router
