//sql database
var sqlite3 = require('sqlite3').verbose();
if(process.env.depsat == 'test'){
  var db = new sqlite3.Database('timeTrackV0Test.db');
}else{
  var db = new sqlite3.Database('timeTrackV1.db');
}

//express framework
var express = require('express');
var app = express();

//http basic auth
var basicAuth = require('express-basic-auth');

//body parser
var bodyParser = require('body-parser');

//input validator
var validator = require('validator');

//get server ip
var ip = require("node-ip");

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
         "StartTime  INTEGER          NOT NULL,"+
         "EndTime    INTEGER          NOT NULL,"+
         "Time       INTEGER          NOT NULL,"+
         "Comment    TEXT                     ,"+
         "FOREIGN KEY (Job) REFERENCES Jobs(JobID) ON DELETE NO ACTION ON UPDATE NO ACTION,"+
         "FOREIGN KEY (User) REFERENCES Users(Usersname) ON DELETE NO ACTION ON UPDATE NO ACTION);"
}

// function to authentic with http basic auth
function myAuthorizer(username, password, callback) {
  db.serialize(function(){
    db.get("SELECT * FROM Users WHERE Username=?;",[username], function (err, row) {
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

// functionn to produce next id number
function nextId(id){
  var num = id.slice(1);
  num++;
  return id.slice(0,1)+num;
}

// routes
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/v1/login', function(req, res){
  console.log('Login request');
  myAuthorizer(req.body.Username, req.body.Password, function(err, val){
    if(val){
      res.status(200).send({'Login': 'Success', 'User': req.body.Username});
    }else{
      (req.body.Username && req.body.Password) ? (res.status(401).send({'Login': 'Failed', 'User': + req.body.Username})) : res.status(401).send({'Login': 'Failed', 'User': 'No credentials provided'})
    }
  });
});

//authentication for all urls below this point
app.use(basicAuth({
  authorizer: myAuthorizer,                         //authentication function
   authorizeAsync: true,                            //authentication is asyn
  unauthorizedResponse: badAuth                     //if authentication function
}));

// post functions
app.post('/v1/users', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  // check that propper data was submitted
  if(req.body.Username && req.body.Password && req.body.Name && validator.isAlpha(req.body.Username)){
    // check for conflicts
    db.serialize(function(){
      db.get("SELECT * FROM Users WHERE Username=?;", [req.body.Username], function(err, row){
        if(row){
          res.status(401).send({'Error': 'User already exsits'});
        } else {
          // if no other problems then actually add the user
          db.serialize(function() {
            db.run("INSERT INTO Users VALUES (?, ?, ?);", [req.body.Username, validator.trim(req.body.Password), validator.trim(req.body.Name)], function(){
              res.set('Location', '/v1/users/'+req.body.Username);
              res.status(201).send({'UserCreated': req.body.Username});
            });
          });
        }
      });
    });
  } else {
    res.status(400).send({'Error': 'Incorrect user information'});
  }
});

app.post('/v1/clients', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    // get highest id
    db.get("SELECT ClientID FROM Clients ORDER BY ClientID DESC LIMIT 1;", function(err, row){
      if(!row){
        var nextID = 'c0';
      } else{
        var nextID = nextId(row.ClientID);
      }
      // check that propper data was submitted
      if(req.body.ClientName){
        db.serialize(function() {
          db.run("INSERT INTO Clients VALUES (?, ?);", [nextID, validator.trim(req.body.ClientName)], function(){
            res.set('Location', '/v1/clients/'+nextID);
            res.status(201).send({'Client Created': nextID});
          });
        });
      } else {
        res.status(400).send({'Error': 'Invalid client info submitted'});
      }
    });
  });
});

app.post('/v1/jobs', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    //get next id
    db.get("SELECT JobID FROM Jobs ORDER BY JobID DESC LIMIT 1;", function(err, row){
      if(!row){
        var nextID = 'j0';
      } else{
        var nextID = nextId(row.JobID);
      }
    //check input data
    //step 1: validate refrences to other table
    if(req.body.Client && req.body.Status && req.body.StartDate){
      db.serialize(function(){
        db.get("SELECT ClientID FROM Clients WHERE ClientID=?;", [req.body.Client], function(err, row) {
          if(row){
            //step 2: see what else we got
            var vals = [nextID];
            var insertStr = "JobID";
            var qmStr = "?"
            if(req.body.Title){
              vals.push(req.body.Title);
              insertStr+=', Title';
              qmStr+=', ?';
            }
            vals.push(req.body.Client, req.body.Status, req.body.StartDate);
            insertStr+=', Client, Status, StartDate';
            qmStr+=', ?, ?, ?';
            if(req.body.Description){
              vals.push(req.body.Description);
              insertStr+=', Description';
              qmStr+=', ?';
            }
            if(req.body.InvNum){
              vals.push(req.body.InvNum);
              insertStr+=', InvNum';
              qmStr+=', ?';
            }
            //actually add the stuff
            db.serialize(function() {
              db.run("INSERT INTO Jobs ("+insertStr+") VALUES ("+qmStr+")", vals, function(){
                res.set('Location', '/v1/jobs/'+nextID);
                res.status(201).send({'Job created': nextID});
              });
            });
          } else {
            res.status(400).send({'Error': 'Client not found'});
          }
        });
      });
    } else {
      res.status(400).send({'Error': 'Required data missing'});
    }
    });
  });
});

app.post('/v1/Activities', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    //get next id
    db.get("SELECT ActivityID FROM Activities ORDER BY ActivityID DESC LIMIT 1;", function(err, row){
      if(!row){
        var nextID = 'a0';
      } else{
        var nextID = nextId(row.ActivityID);
      }
      //validate data
      //step 1: check referances
      if(req.body.Job && req.body.User){
        db.serialize(function(){
          var ref = false;
          db.get("SELECT JobID FROM Jobs WHERE JobID=?;", [req.body.Job], function(err, row){
            if(row){ref=true}
            else{res.status(400).send({'Error': 'Bad Job referance'});}
          });
          db.get("SELECT Username FROM Users WHERE Username=?;", [req.body.User], function(err, row){
            if(row && ref && req.body.StartTime && req.body.EndTime && req.body.Time){
              var vals = [nextID, req.body.Job, req.body.User, req.body.StartTime, req.body.EndTime, req.body.Time];
              var insertStr = "ActivityID, Job, User, StartTime, EndTime, Time";
              var qmStr = "?, ?, ?, ?, ?, ?"
              if(req.body.Comment){vals.push(req.body.Comment);insertStr+=" ,Comment";qmStr+=", ?"}
              db.serialize(function() {
                db.run("INSERT INTO activities ("+insertStr+") VALUES ("+qmStr+");", vals, function(){
                  res.set('Location', '/v1/activities/'+nextID);
                  res.status(201).send({'Activity created': nextID});
                });
              });
            }else{
              res.status(400).send({'Error': 'Invalid data submitted'});
            }
          });
        });
      } else {
        res.status(400).send({'Error': 'Invalid data submitted'});
      }
    });
  });
});

//get functions
app.get('/v1/users', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.all("SELECT Username, Name FROM Users;", function (err, rows) {
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
    db.get("SELECT Username, Name FROM Users WHERE Username=?;",[req.params.username], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(row){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/clients', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.all("SELECT * FROM Clients ORDER BY ClientName;", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){
          res.set('Content-Type','application/json');
          res.status(200).send(rows);
        }
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/clients/:clientid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.get("SELECT * FROM Clients WHERE ClientID=?;",[req.params.clientid], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(row){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.all("SELECT * FROM Jobs;", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs/active', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.all("SELECT * FROM Jobs WHERE Status = 'True';", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs/inactive', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.all("SELECT * FROM Jobs WHERE Status = 'False';", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/jobs/:jobid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.get("SELECT * FROM Jobs WHERE JobID=?",[req.params.jobid], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(row){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/activities', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.all("SELECT * FROM activities", function (err, rows) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(rows){res.status(200).send(rows);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

app.get('/v1/activities/u/:userid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
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

app.get('/v1/activities/j/:jobid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
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

app.get('/v1/activities/t', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  if(req.query.to && req.query.from){
    db.serialize(function(){
      db.all("SELECT * FROM activities WHERE StartTime > ? AND StartTime < ?", [req.query.from, req.query.to], function (err, rows) {
        //TODO the error part
        if(err){res.status(400).send('error'+err);}
        else{
          if(rows){res.status(200).send(rows);}
          else {res.status(404).send({'error': 'resroce not found'});}}
      });
    });
  } else{
    res.status(400).send({'error': 'resroce not found 1'});
  }
});

app.get('/v1/activities/:activityid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function(){
    db.get("SELECT * FROM activities WHERE ActivityID=?",[req.params.activityid], function (err, row) {
      //TODO the error part
      if(err){res.status(400).send('error');}
      else{
        if(row){res.status(200).send(row);}
        else {res.status(404).send({'error': 'resroce not found'});}}
    });
  });
});

//patch fucntions
app.patch('/v1/users/:username', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  //cheack for user
  db.serialize(function(){
    db.get("SELECT Username, Name FROM Users WHERE Username=?;",[req.params.username],function(err,row){
      if(row && req.body.Password){
        db.serialize(function() {
          db.run("UPDATE Users SET Password=? WHERE Username=?",[req.body.Password, req.params.username], function (err, row) {
            res.set('Content-Type','application/json');
            res.status(200).send({'success': req.params.username+' modified'});
            });
        });
      } else {
        res.status(400).send({'Error': 'User does not exist'});
      }
    });
  });
});

app.patch('/v1/clients/:clientid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  //cheack for client
  db.serialize(function(){
    //check client
    db.get("SELECT * FROM Clients WHERE ClientID=?;",[req.params.clientid],function(err,row){
      if(row && req.body.ClientName){
        db.serialize(function() {
          //update the record
          db.run("UPDATE Clients SET ClientName=? WHERE ClientID=?",[req.body.ClientName, req.params.clientid], function (err, row) {
            res.set('Content-Type','application/json');
            res.status(200).send({'success': req.params.clientid+' modified'});
            });
        });
      } else {
        res.status(400).send({'Error': 'Incorrect info provided'});
      }
    });
  });
});

app.patch('/v1/jobs/:jobid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  //cheack for job
  db.serialize(function(){
    db.get("SELECT * FROM Jobs WHERE JobID=?;",[req.params.jobid],function(err,row){
      if(row && (req.body.Title || req.body.Description || req.body.InvNum)){
        db.serialize(function() {
          //update the record
          var vals = [];
          var set = [];
          if(req.body.Title){
            vals.push(req.body.Title);
            set.push('Title=?');
          }
          if(req.body.Description){
            vals.push(req.body.Description);
            set.push('Description=?');
          }
          if(req.body.InvNum){
            vals.push(req.body.InvNum);
            set.push('InvNum=?');
          }
          vals.push(req.params.jobid);
          db.run("UPDATE Jobs SET "+set.toString()+" WHERE JobID=?", vals, function (err, row) {
            res.status(200).send({'success': req.params.jobid+' modified'});
            });
        });
      } else {
        res.status(400).send({'Error': 'Incorrect info provideds'});
      }
    });
  });
});

app.patch('/v1/jobs/active/:jobid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  //cheack for job
  db.serialize(function(){
    db.get("SELECT * FROM Jobs WHERE JobID=?;",[req.params.jobid],function(err,row){
      if(row){
        db.serialize(function() {
          //update the record
          db.run("UPDATE Jobs SET Status=? WHERE JobID=?",['True', req.params.jobid], function (err, row) {
            res.status(200).send({'success': req.params.jobid+' modified'});
            });
        });
      } else {
        res.status(400).send({'Error': 'Job does not exist'});
      }
    });
  });
});

app.patch('/v1/jobs/inactive/:jobid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  //cheack for job
  db.serialize(function(){
    db.get("SELECT * FROM Jobs WHERE JobID=?;",[req.params.jobid],function(err,row){
      if(row){
        db.serialize(function() {
          //update the record
          db.run("UPDATE Jobs SET Status=? WHERE JobID=?",['False', req.params.jobid], function (err, row) {
            res.status(200).send({'success': req.params.jobid+' modified'});
            });
        });
      } else {
        res.status(400).send({'Error': 'Job does not exist'});
      }
    });
  });
});

app.patch('/v1/activities/:activityid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  //cheack for activity
  db.serialize(function(){
    db.get("SELECT * FROM Activities WHERE ActivityID=?;",[req.params.activityid],function(err,row){
      if(row && req.body.Comment){
        db.serialize(function() {
          //update the record
          db.run("UPDATE Activities SET Comment=? WHERE ActivityID=?",[req.body.Comment, req.params.activityid], function (err, row) {
            res.status(200).send({'success': req.params.activityid+' modified'});
            });
        });
      } else {
        res.status(400).send({'Error': 'Activity does not exist'});
      }
    });
  });
});

//delete functions
app.delete('/v1/users/:username', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("DELETE FROM Users WHERE Username=?", [req.params.username], function(){
      res.status(200).send({'Deleted User': req.params.username});
    });
  });
});

app.delete('/v1/clients/:clientid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("DELETE FROM Clients WHERE ClientID=?", [req.params.clientid], function(){
      res.status(200).send({'Deleted Client': req.params.clientid});
    });
  });
});

app.delete('/v1/jobs/:jobid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("DELETE FROM Jobs WHERE JobID=?", [req.params.jobid], function(err, row){
      res.status(200).send({'Deleted Job': req.params.jobid});
    });
  });
});

app.delete('/v1/activities/:activityid', function(req, res){
  console.log(req.method+' request on '+req.originalUrl);
  db.serialize(function() {
    db.run("DELETE FROM Activities WHERE ActivityID=?", [req.params.activityid], function(){
      res.status(200).send({'Deleted activity': req.params.activityid});
    });
  });
});

//actual run area
setup();
module.exports = app;       //for test purpuses
//temp code for deval perpuses
//add a user
// db.serialize(function(){
//   db.run("INSERT INTO Users VALUES (?, ?, ?)", ['temp', 'test', 'devUser']);
// });
// // db.serialize(function() {
//   db.run("INSERT INTO Users VALUES (?, ?, ?)", ['test', 'test', 'testUser'], function(){
//     console.log('test user added');
//   });
// });
