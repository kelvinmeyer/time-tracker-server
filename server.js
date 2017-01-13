//Imports
//sql database
var sqlite3 = require('sqlite3').verbose();
if(process.env.depsat == 'test'){
  var db = new sqlite3.Database('timeTrackV0Test.db');
}else{
  var db = new sqlite3.Database('timeTrackV0.db');
}
var logging = process.argv[3];

//express framework
var express = require('express');
var app = express();

//http basic auth
var basicAuth = require('express-basic-auth');

//body parser
var bodyParser = require('body-parser');

// functions of the server
// function to setup the inital enviroment
function setup(){
  db.serialize(function(){
      db.run(createUsersTbl(), function(err, stmt){
        if(err){
          console.error(err);
        }
      });

      db.run(createClientsTbl(), function(err, stmt){
        if(err){
          console.error(err);
        }
      });

      db.run(createJobsTbl(), function(err, stmt){
        if(err){
          console.error(err);
        }
      });

      db.run(createActivitiesTbl(), function(err, stmt){
        if(err){
          console.error(err);
        }
      });
  });
  app.listen(3000, function(){
    if(logging){console.log('listening on port 3000')};
  });
}

// sql create statments
// function to create Users TABLE ....1
function createUsersTbl(){
  return "CREATE TABLE IF NOT EXISTS Users("+
         "Username TEXT PRIMARY KEY NOT NULL,"+
         "Password TEXT             NOT NULL,"+
         "Name TEXT             NOT NULL);"
}

// function to create Clients TABLE ....2
function createClientsTbl(){
  return "CREATE TABLE IF NOT EXISTS Clients("+
         "ClientID   TEXT PRIMARY KEY NOT NULL,"+
         "ClientName TEXT             NOT NULL);"
}

// function to create Jobs TABLE ....3
function createJobsTbl(){
  return "CREATE TABLE IF NOT EXISTS Jobs("+
         "JobID       TEXT PRIMARY KEY NOT NULL,"+
         "Title       TEXT                     ,"+
         "Client      TEXT             NOT NULL,"+
         "Status      TEXT             NOT NULL,"+
         "StartDate   TEXT             NOT NULL,"+
         "Description TEXT                     ,"+
         "InvNum      TEXT                     ,"+
         "FOREIGN KEY(Client) REFERENCES Clients(ClientID) ON DELETE NO ACTION ON UPDATE NO ACTION);"
}

// function to create Activities TABLE ....4
function createActivitiesTbl(){
  return "CREATE TABLE IF NOT EXISTS Activities("+
         "ActivityID TEXT PRIMARY KEY NOT NULL,"+
         "Job        TEXT             NOT NULL,"+
         "User       TEXT             NOT NULL,"+
         "StartTime  TEXT             NOT NULL,"+
         "EndTime    TEXT             NOT NULL,"+
         "Time       TEXT             NOT NULL,"+
         "Comment    TEXT                     ,"+
         "FOREIGN KEY (Job) REFERENCES Jobs(JobID) ON DELETE NO ACTION ON UPDATE NO ACTION,"+
         "FOREIGN KEY (User) REFERENCES Users(Usersname) ON DELETE NO ACTION ON UPDATE NO ACTION);"
}

// function to authentic with http basic auth
function myAuthorizer(username, password, callback) {
  db.serialize(function(){
    db.get("SELECT * FROM Users WHERE Username=?",[username], function (err, row) {
      if(row && password == row.Password){
        return callback(null, true);
      }
      else {
          return callback(null, false);
      }
    });
  });
}

// function to return if user is not in db
function badAuth(req){
  if(logging){console.log('BAD authentication')};
  //TODO should return json with error and details
  return req.auth ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected') : 'No credentials provided';
}


// routes
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/v1/login', function(req, res){
  if(logging){console.log('Login request')};
  myAuthorizer(req.body.Username, req.body.Password, function(err, val){
    if(val){
      res.status(200).send({'login': 'success', 'User': req.body.Username});
    }else{
      res.status(401).send({'login': 'failed', 'User': req.body.Username});
    }
  });
});

//authentication for all urls below this point
app.use(basicAuth({
  authorizer: myAuthorizer,                         //authentication function
   authorizeAsync: true,                            //authentication is asyn
  unauthorizedResponse: badAuth                     //if authentication function
}));

//post fnctions
app.post('/v1/users', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("INSERT INTO Users VALUES (?, ?, ?)", [req.body.Username, req.body.Password, req.body.Name], function(){
      res.set('Location', '/v1/users/'+req.body.Username);
      res.status(201).send('User created: '+req.body.Username);
    });
  });
});

app.post('/v1/clients', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("INSERT INTO Clients VALUES (?, ?)", [req.body.JobID, req.body.Title, ], function(){
      res.set('Location', '/v1/clients/'+req.body.ClientID);
      res.status(201).send('client created: '+req.body.ClientName);
    });
  });
});

app.post('/v1/jobs', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("INSERT INTO Jobs VALUES (?, ?, ?, ?, ?, ?, ?)", [req.body.JobID, req.body.Title, req.body.Client, req.body.Status, req.body.StartDate, req.body.Description, req.body.InvNum], function(){
      res.set('Location', '/v1/jobs/'+req.body.JobID);
      res.status(201).send('Job created: '+req.body.JobID);
    });
  });
});

app.post('/v1/Activities', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("INSERT INTO Jobs VALUES (?, ?, ?, ?, ?, ?, ?)", [req.body.ActivityID, req.body.Job, req.body.User, req.body.StartTime, req.body.EndTime, req.body.Time, req.body.Comment], function(){
      res.set('Location', '/v1/activities/'+req.body.ActivityID);
      res.status(201).send('Activity created: '+req.body.ActivityID);
    });
  });
});


//get functions
app.get('/v1/users', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT Username, Name FROM Users", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/users/:username', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.get("SELECT Username, Name FROM Users WHERE Username=?",[req.params.username], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(row){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/clients', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT * FROM Clients", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/clients/:clientid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.get("SELECT * FROM Clients WHERE ClientID=?",[req.params.clientid], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(row){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT * FROM Jobs", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs/:jobid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.get("SELECT * FROM Jobs WHERE JobID=?",[req.params.jobid], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs/active', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT * FROM Jobs WHERE Status=?",['active'], function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/activities', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT * FROM activities",[], function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/activities/:userid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT * FROM activities WHERE User=?",[req.params.userid], function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/activities/:jobid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.all("SELECT * FROM activities WHERE Job=?",[req.params.jobid], function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/activities/:activityid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function(){
    db.get("SELECT * FROM activities WHERE ActivityID=?",[req.params.activityid], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});



//patch fucntions
app.patch('/v1/users/:username', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("UPDATE Users SET Password=? WHERE Username=?",[req.body.Password, req.params.username], function (err, row) {
      res.status(200).send({'success': req.params.username+' modified'});
      });
  });
});

app.patch('/v1/clients/:clientid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("UPDATE Clients SET ClientName=? WHERE ClientID=?",[req.body.ClientName, req.params.clientid], function (err, row) {
      res.status(200).send({'success': req.params.clientid+' modified'});
      });
  });
});

app.patch('/v1/jobs/active/:jobid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("UPDATE Jobs SET Status=? WHERE JobID=?",['active', req.params.jobid], function (err, row) {
      res.status(200).send({'success': req.params.jobid+' modified'});
      });
  });
});

app.patch('/v1/jobs/inactive/:jobid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("UPDATE Jobs SET Status=? WHERE JobID=?",['inactive', req.params.jobid], function (err, row) {
      res.status(200).send({'success': req.params.jobid+' modified'});
      });
  });
});

app.patch('/v1/activities/addComment/:activityid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("UPDATE Activities SET Comment=? WHERE ActivityID=?",[ req.body.Comment , req.params.activityid], function (err, row) {
      res.status(200).send({'success': req.params.activityid+' modified'});
      });
  });
});


//delete functions
app.delete('/v1/users/:username', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("DELETE FROM Users WHERE Username=?", [req.params.username], function(){
      res.status(200).send('Deleted User: '+req.params.username);
    });
  });
});

app.delete('/v1/clients/:clientid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("DELETE FROM Clients WHERE ClientID=?", [req.params.clientid], function(){
      res.status(200).send('Deleted client: '+req.params.clientid);
    });
  });
});

app.delete('/v1/jobs/:jobid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("DELETE FROM Jobs WHERE JobID=?", [req.params.jobid], function(){
      res.status(200).send('Deleted Job: '+req.params.jobid);
    });
  });
});

app.delete('/v1/activities/:activityid', function(req, res){
  if(logging){console.log(req.method+' request on '+req.originalUrl)};
  db.serialize(function() {
    db.run("DELETE FROM Activities WHERE ActivityID=?", [req.params.activityid], function(){
      res.status(200).send('Deleted activity: '+req.params.activityid);
    });
  });
});



//actual run area
setup();
module.exports = app;
//temp code for deval perpuses
//add a user
// db.serialize(function(){
//   db.run("INSERT INTO Users VALUES (?, ?, ?)", ['admin', 'supersecret', 'devUser']);
// });
// db.serialize(function() {
//   db.run("INSERT INTO Users VALUES (?, ?, ?)", ['test', 'test', 'testUser'], function(){
//     console.log('test user added');
//   });
// });
