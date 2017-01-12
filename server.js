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
//function to setup the inital enviroment
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
}

// sql create statments
// function to create Users TABLE ....1
function createUsersTbl(){
  return "CREATE TABLE IF NOT EXISTS Users("+
         "UserID   TEXT PRIMARY KEY NOT NULL,"+
         "UserName TEXT             NOT NULL,"+
         "Password TEXT             NOT NULL);"
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
         "Title    TEXT                        ,"+
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
         "FOREIGN KEY (User) REFERENCES Users(UsersID) ON DELETE NO ACTION ON UPDATE NO ACTION);"
}


setup()
