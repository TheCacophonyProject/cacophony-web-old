var path = require('path');
var config = require('../config/config')

module.exports = function(app) {

  app.get('/', function(req, res) {
    res.render('home.pug', {
      'api': config.server.api,
    });
  });

  app.get('/get_audio_recordings', function(req, res) {
    res.render('getAudioRecordings.pug', {
      'api': config.server.api,
    });
  });

  app.get('/get_recordings', function(req, res) {
    res.render('getRecordings.pug', {
      'api': config.server.api,
    });
  });

  app.get('/register', function(req, res) {
    console.log(config.server.api);
    res.render('register.pug', {
      'api': config.server.api,
    });
  });

  app.get('/ping', function(req, res) {
    res.end("pong...");
  });

  app.get('/login', function(req, res) {
    res.render('login.pug', {
      'api': config.server.api,
      'next': req.query.next
    });
  });

  app.get('/new_group', function(req, res) {
    res.render('newGroup.pug', {
      'api': config.server.api,
    });
  });

  app.get('/view_audio_recording/:id', function(req, res) {
    res.render('viewAudioRecording.pug', {
      'api': config.server.api,
      'id': req.params.id,
    });
  });

  app.get('/view_recording/:id', (request, response) => {
    response.render('viewRecording.pug', {
      'api': config.server.api,
      'id': request.params.id,
    });
  });

  app.get('/groups', (request, response) => {
    response.render('groups.pug', {
      'api': config.server.api,
    });
  });

  app.get('/devices', (request, response) => {
    response.render('devices.pug', {
      'api': config.server.api,
    });
  });

  app.get('/setup_audio', (request, response) => {
    response.render('setupAudio.pug', {
      'api': config.server.api,
    });
  });

  app.get('/new_audio', (request, response) => {
    response.render('newAudioBaitFile.pug', {
      'api': config.server.api,
    });
  });
};
