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
  const scooterClosestDesiredCount = req.body.scooterClosestDesiredCount;
  const lat = req.body.lat;
  const lng = req.body.lng;
  const distance = req.body.distance;

  if (scooterClosestDesiredCount === undefined || 
      lat === undefined ||
      lng === undefined ||
      distance === undefined) {
    console.log("Parameter was not defined");
    return res.sendStatus(400);
  }

  console.log("Calling " + scootersDbUrl);
  request(scootersDbUrl, function (error, response, body) {
    if (error) {
      console.log("Error returned from " + scootersDbUrl);
      return res.sendStatus(500);
    }
    if (!body) {
      console.log("Empty response received from " + scootersDbUrl);
      return res.sendStatus(500);
    }
    console.log("Received " + body);
    let scooters;
    try {
      scooters = JSON.parse(body);
    } catch (err) {
      console.log("Error parsing JSON: " + err);
      return res.status(500).send("Error parsing JSON response");
    }
    const result = closestScooters(scooterClosestDesiredCount, lat, lng, distance, scooters);
    console.log("Returning " + result.length + " closest scooters");
    return res.json(result);
  });
});

// Calculate closest scooters
function closestScooters(scooterClosestDesiredCount, lat, lng, distance, scooters) {
  const pointLatLng = new spherical.LatLng(lat, lng);
  const closestScootersWithDistanceResults = [];

  for (let i = 0; i < scooters.length; i++) {
    const scooter = scooters[i];
    const scooterLatLng = new spherical.LatLng(scooter.position.lat, scooter.position.lng);
    const distanceBetweenScooterAndPoint = spherical.computeDistanceBetween(pointLatLng, scooterLatLng);
      
    if (distanceBetweenScooterAndPoint < distance) {
      console.log('Distance is ' + distanceBetweenScooterAndPoint + ' for ' + scooter.key);
      closestScootersWithDistanceResults.push({scooter: scooterLatLng, distance: distanceBetweenScooterAndPoint});
    }
  }

  if (closestScootersWithDistanceResults.length === 0 || closestScootersWithDistanceResults.length <= scooterClosestDesiredCount) {
    return closestScootersWithDistanceResults;
  }

  closestScootersWithDistanceResults.sort((a, b) => a.distance - b.distance);
  return closestScootersWithDistanceResults.slice(0, scooterClosestDesiredCount);
}

module.exports = router;
