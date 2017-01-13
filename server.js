//Imports
//sql database
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('timeTrackV0.db');

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
    console.log('listening on port 3000');
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
         "Title       TEXT                        ,"+
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
  console.log('BAD authentication');
  //TODO should return json with error and details
  return req.auth ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected') : 'No credentials provided';
}


// routes

//authentication
app.use(basicAuth({
  authorizer: myAuthorizer,                         //authentication function
   authorizeAsync: true,                            //authentication is asyn
  unauthorizedResponse: badAuth                     //if authentication function
}));
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//post fnctions
app.post('/v1/users', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("INSERT INTO Users VALUES (?, ?, ?)", [req.body.Username, req.body.Password, req.body.Name], function(){
      res.set('Location', '/v1/users/'+req.body.Username);
      res.status(201).send('User added: '+req.body.Username);
    });
  });
});

app.post('/v1/clients', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("INSERT INTO Clients VALUES (?, ?)", [req.body.ClientID, req.body.ClientName], function(){
      res.set('Location', '/v1/clients/'+req.body.ClientID);
      res.status(201).send('client added: '+req.body.ClientName);
    });
  });
});



//get functions
app.get('/v1/users', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
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
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.get("SELECT Username, Name FROM Users WHERE Username=?",[req.params.username], function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/clients', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
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
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.get("SELECT * FROM Clients WHERE ClientID=?",[req.params.clientid], function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});



//patch fucntions
app.patch('/v1/users/:username', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("UPDATE Users SET Password=? WHERE Username=?",[req.body.Password, req.params.username], function (err, row) {
      res.status(200).send({'success': req.params.username+' modified'});
      });
  });
});

app.patch('/v1/clients/:clientid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("UPDATE Clients SET ClientName=? WHERE ClientID=?",[req.body.ClientName, req.params.clientid], function (err, row) {
      res.status(200).send({'success': req.params.clientid+' modified'});
      });
  });
});


//delete functions
app.delete('/v1/users/:username', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("DELETE FROM Users WHERE Username=?", [req.params.username], function(){
      res.status(200).send('Deleted User: '+req.params.username);
    });
  });
});

app.delete('/v1/clients/:clientid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("DELETE FROM Clients WHERE ClientID=?", [req.params.clientid], function(){
      res.status(200).send('Deleted client: '+req.params.username);
    });
  });
});



//actual run area
setup();
//temp code for deval perpuses
//add a user
// db.serialize(function(){
//   db.run("INSERT INTO Users VALUES (?, ?, ?)", ['admin', 'supersecret', 'devUser']);
// });
