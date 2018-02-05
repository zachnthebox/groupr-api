const express = require('express');
const moment = require('moment');
const RSVP = require('rsvp');
const request = require('request');
const bodyParser = require('body-parser');
const expressJWT = require('express-jwt');

const sessionRouteHandler = require('./routes/session');
const groupRouteHandler = require('./routes/group');

const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());
app.use(expressJWT({
  secret: 'shhhhhhared-secret'
}).unless({
  path: ['/api/auth/sessions']
}));
app.use('/api/auth/sessions', sessionRouteHandler);
app.use('/api/firebase/groups', groupRouteHandler);
app.use(function clientErrorHandler(err, req, res, next) {
  res.status(500).send({
    error: err
  });
})


app.listen(port, () => console.log('App listening on port 3000!'));
