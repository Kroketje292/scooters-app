'use strict';

const router = require('express').Router();
const bodyParser = require('body-parser');
const spherical = require('spherical-geometry-js');
const request = require('request');
const scootersDbUrl = process.env.SCOOTERSDBURL || 'http://localhost:5001/api/scooters';

router.use(bodyParser.json());

router.get('/', function(req, res) {
  res.send('Scooters server');
});

router.get('/api/monitoring/ping', function(req, res) {
	res.send('PONG!');
});

router.post('/api/closestScooters', function(req, res) {
  
  //console.log(req.body.scooterClosestDesiredCount);
  //console.log(req.body.lat);
  //console.log(req.body.lng);
  //console.log(req.body.distance);

  const scooterClosestDesiredCount = req.body.scooterClosestDesiredCount;
  const lat = req.body.lat;
  const lng = req.body.lng;
  const distance = req.body.distance;

  if (scooterClosestDesiredCount == undefined || 
      lat == undefined ||
      lng == undefined ||
      distance == undefined) {
        console.log("Parameter was not defined");
        res.sendStatus(400);
  } else {
    console.log("Calling " + scootersDbUrl);
    request(scootersDbUrl, function (error, response, body) {
      if (error) {
        console.log("Error returned from " + scootersDbUrl);
        res.sendStatus(500);
      }
      console.log("Received " + body);
      const result = closestScooters(scooterClosestDesiredCount, lat, lng, distance, JSON.parse(body));
      console.log("Returning " + result.length + " closest scooters");
      return res.json(result);
    });
  }
});

// Calculate closest scooters
function closestScooters(scooterClosestDesiredCount, lat, lng, distance, scooters) {
  const pointLatLng = new spherical.LatLng(lat, lng);
  //console.log('*Lat is ' + lat);
  //console.log('*Lng is ' + lng);
  const closestScootersWithDistanceResults = [];
  const scootersLength = scooters.length;

  // Get all scooters which are within the distance
  for (var i = 0; i < scootersLength; i++) {
      var scooter = scooters[i];
      var scooterLatLng = new spherical.LatLng(scooter.position.lat, scooter.position.lng);
      var distanceBetweenScooterAndPoint = spherical.computeDistanceBetween(pointLatLng, scooterLatLng);
      
      if (distanceBetweenScooterAndPoint < distance) {
        console.log('Distance is ' + distanceBetweenScooterAndPoint + ' for ' + scooter.key);
        closestScootersWithDistanceResults.push({scooter: scooterLatLng, distance: distanceBetweenScooterAndPoint});
      }
  }

  // Didn't find any scooters, return empty array
  if (closestScootersWithDistanceResults.length == 0) {
    return closestScootersWithDistanceResults;
  }

  // Found scooters is less than the desired count
  if (closestScootersWithDistanceResults.length <= scooterClosestDesiredCount) {
    return closestScootersWithDistanceResults;
  }

  // Now figure out the closest ones if there are more than scooterClosestDesiredCount
  closestScootersWithDistanceResults.sort((a, b) => a.distance - b.distance);
  //console.log(closestScootersWithDistanceResults);
  return closestScootersWithDistanceResults.slice(0, scooterClosestDesiredCount);
}

module.exports = router;
