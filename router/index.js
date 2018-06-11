var path = require('path');
var config = require('../config/config')

module.exports = function(app) {

  let loginCheck = function (req, res, next) {
    if(user.isLoggedIn) {
      next();
    } else {
      res.redirect('/login')
    }
  }

  app.get('/', function(req, res) {
    res.render('home.pug', {
      'api': config.server.api,
    });
  });

  app.get('/get_audio_recordings', loginCheck, function(req, res) {
    res.render('getAudioRecordings.pug', {
      'api': config.server.api,
    });
  });

  app.get('/get_recordings', loginCheck, function(req, res) {
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

  app.get('/user_home', loginCheck, function(req, res) {
    res.render('userHome.pug', {
      'api': config.server.api,
    });
  });

  app.get('/ping', loginCheck, function(req, res) {
    res.end("pong...");
  });

  app.get('/login', function(req, res) {
    res.render('login.pug', {
      'api': config.server.api,
    });
  });

  app.get('/new_group', loginCheck, function(req, res) {
    res.render('newGroup.pug', {
      'api': config.server.api,
    });
  });

  app.get('/view_audio_recording/:id', loginCheck, function(req, res) {
    res.render('viewAudioRecording.pug', {
      'api': config.server.api,
      'id': req.params.id,
    });
  });

  app.get('/view_recording/:id', loginCheck, (request, response) => {
    response.render('viewRecording.pug', {
      'api': config.server.api,
      'id': request.params.id,
    });
  });

  app.get('/groups', loginCheck, (request, response) => {
    response.render('groups.pug', {
      'api': config.server.api,
    });
  });

  app.get('/devices', loginCheck, (request, response) => {
    response.render('devices.pug', {
      'api': config.server.api,
    });
  });

  app.get('/setup_audio', loginCheck, (request, response) => {
    response.render('setupAudio.pug', {
      'api': config.server.api,
    });
  });

  app.get('/new_audio', loginCheck, (request, response) => {
    response.render('newAudioBaitFile.pug', {
      'api': config.server.api,
    });
  });
};
