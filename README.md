# time-tracker-server
This is the server component of my time tracking application.
Interacting with this server is done through accessing exposed endpoints over http.

## Installation
This server is available through npm with the following command 

`npm i -g time-tracker-server`

## Endpoints
Most endpoints require basic http authentication to access.

### Get
Each endpoint returns the specified value or set of values as json formatted data.

/v1/users - returns all users

/v1/users/:username - returns a user with the specified username

/v1/clients - returns all clients

/v1/clients/:clientid - returns the specified client

/v1/jobs - returns all jobs
 
/v1/jobs/active - returns all jobs that have an active status

/v1/jobs/inactive - returns all jobs that have an inactive status

/v1/jobs/:jobid - returns a specific job

/v1/activities - returns all the activities

/v1/activities/u/:userid - returns all activites that were completed by a specified user

/v1/activities/j/:jobid - returns all activites that are associated with a certain job

/v1/activities/:activityid - returns the activity matching the parameter

### Post
Each endpoint returns a header pointing the the location of the newly created item.

/v1/users - create a new user

/v1/clients - create a new client

/v1/jobs - create a new job

/v1/activities - create a new activity

### Patch
All updating of items is done through a patch request.

/v1/users/:username - update a user

/v1/clients/:clientid - update a client

/v1/jobs/:jobid - update a job

/v1/jobs/active/:jobid - make a job active

/v1/jobs/inactive/:jobid - make a job inactive

/v1/activities/:activityid - update an activity

### Delete
The parameter at the end of the url is used to find the resource to delete.

/v1/users/:username - delete a user

/v1/clients/:clientid - delete a client

/v1/jobs/:jobid - delete a job

/v1/activities/:activityid - delete an activity
