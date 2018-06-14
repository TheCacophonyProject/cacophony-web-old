var express = require('express');
var path = require('path');
var http = require('http');

try {
  var config = require('./config/config');
} catch (error) {
  console.log("Config file is not setup. Read README.md for config setup.");
  return;
}

var log = require('./logging');

if (config.server.api.slice(-1) === '/') {
  config.server.api = config.server.api.slice(0,-1);
}

log.info('Starting Full Noise.');
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
log.addExpressApp(app);

require('./router')(app);

log.info("API: " + config.server.api);
log.info("Starting service listening to port " + config.server.port);
http.createServer(app).listen(config.server.port);
