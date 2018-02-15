const express = require('express');
const moment = require('moment');
const RSVP = require('rsvp');
const request = require('request');
const bodyParser = require('body-parser');
const expressJWT = require('express-jwt');
const mongoose = require('mongoose');
const API = require('json-api');

const sessionRouteHandler = require('./routes/session');

const uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/groupr';
mongoose.connect(uristring);

const models = {
  'Location': require('./models/location'),
  'Group': require('./models/group')
};

function remove(array, element) {
  const index = array.map(item => item.toJSON()).indexOf(element.id);
  if (index !== -1) {
      array.splice(index, 1);
  }
}

models.Location.schema.pre('remove', function (next) {
  const location = this;
  const groupId = location.group.toJSON();
  return models.Group.findById(groupId).then(group => {
    const nextLocationId = group.nextLocation && group.nextLocation.toJSON();
    if (group.locations.length === 1) {
      group.nextLocation = null;
    } else if (nextLocationId === location.id) {
      return skipLocation(group).then(() => {
        remove(group.locations, location);
        return group.save().then(() => {
          next();
        });
      });
    }
    remove(group.locations, location);
    return group.save().then(() => {
      next();
    });
  });
});

function isLocationActive(locationId, locations) {
  return locations.some(location => location._id === locationId);
}

function getActiveLocations(group) {
  return models.Location.where({
    active: true,
    group: group._id.toJSON(),
  });
}

function skipLocation(group) {
  let nextLocationId = group.nextLocation && group.nextLocation.toJSON();
  return getActiveLocations(group).then(activeLocations => {
    const activeLocationsIds = activeLocations.map(activeLocation => activeLocation._id.toJSON());
    const index = activeLocationsIds.indexOf(nextLocationId);
    if (activeLocationsIds.length === 1 && index !== -1 && activeLocationsIds[index] === nextLocationId) {
      return;
    }
    do {
      if (index === activeLocationsIds.length - 1) {
        nextLocationId = activeLocationsIds[0];
      } else {
        nextLocationId = activeLocationsIds[index + 1];
      }
    } while (isLocationActive(nextLocationId, activeLocations))
    group.nextLocation = nextLocationId;
    return group.save();
  });
}

const dbAdapter = new API.dbAdapters.Mongoose(models);
const registry = new API.ResourceTypeRegistry({
  locations: {
    urlTemplates: {
      self: '/api/locations/{id}',
    },
    beforeSave(resource) {
      return resource;
    },
    beforeRender(location, request) {
      const isPostRequest = request.method === 'POST';
      if (isPostRequest) {
        const groupId = location._attrs.group;
        return models.Group.findById(groupId).then(group => {
          if (!group.locations.length) {
            return skipLocation(group).then(() => {
              group.locations.push(location);
              group.save();
              return location;
            });
          }
          group.locations.push(location);
          group.save();
          return location;
        });
      }
      return location;
    },
  },
  groups: {
    urlTemplates: {
      self: '/api/groups/{id}',
    },
    beforeSave(resource) {
      if (!resource._attrs.nextDate) {
        const dayOfWeek = resource._attrs.dayOfWeek;
        const time = resource._attrs.time;
        const date = moment().add(1, 'week').isoWeekday(dayOfWeek).format('L');
        resource._attrs.nextDate = moment(`${date} ${time}`, 'L LT').toDate();
      }
      return resource;
    },
  },
}, {
    dbAdapter,
  });

// Initialize the automatic documentation.
const DocsController = new API.controllers.Documentation(registry, {
  name: 'Groupr API',
});

// Set up our controllers
const APIController = new API.controllers.API(registry);
const Front = new API.httpStrategies.Express(APIController, DocsController);
const requestHandler = Front.apiRequest.bind(Front);

const port = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());
app.use(expressJWT({
  secret: process.env.SECRET,
}).unless({
  path: ['/api/auth/sessions']
}));
app.use('/api/auth/sessions', sessionRouteHandler);

app.get("/", Front.docsRequest.bind(Front));
app.get("/api/:type(groups|locations)", requestHandler);
app.get("/api/:type(groups|locations)/:id", requestHandler);
app.post("/api/:type(groups|locations)", requestHandler);
app.patch("/api/:type(groups|locations)/:id", requestHandler);
app.delete("/api/:type(groups|locations)/:id", requestHandler);

app.use(function clientErrorHandler(err, req, res, next) {
  res.status(500).send({
    error: err
  });
})


app.listen(port, () => console.log('App listening on port 3000!'));
