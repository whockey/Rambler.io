
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api');
  fs = require('fs');

var app = module.exports = express();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// HAProxy Health Check
app.options('/', function(req, res) {
  res.json({success:true});
});

// Routes

app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API

app.get('/api/transactions', api.transactions);
app.get('/api/onboard', api.onboard);
app.get('/api/geocode', api.geocode);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Start server


//Keys for SSL
var options = {
  key: fs.readFileSync('./keys/rambler.io.pem'),
  cert: fs.readFileSync('./keys/rambler.io.crt'),
  ca: fs.readFileSync('./keys/gd_bundle.crt')
};

var http = require('http'); var https = require('https');

if(process.env.NODE_ENV=='production'){
  http.createServer(app).listen(80, function(){
    console.log("Rambler App listening on port %d in %s mode", 80, app.get('env') );
  });

  https.createServer(options, app).listen(443, function(){
    console.log("Rambler App listening on port %d in %s mode", 443, app.get('env') );
  });
} else {
    http.createServer(app).listen(80, function(){
    console.log("Rambler App listening on port %d in %s mode", 80, app.get('env') );
  });

  https.createServer(options, app).listen(443, function(){
    console.log("Rambler App listening on port %d in %s mode", 443, app.get('env') );
  });
}
/*
app.listen(80, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
*/