/*
 * NB the line at the top sets up the enviroment so that a testing database is used
 * NB This database has a user un: test pw: test, the user is needed to get through the http basic authentication on all request except login
 * NB do not delete the testing database else you need to re add the test user. the code to do this is at the very bottom of server.js
 */

 /*
  * NB the fist block for each routes tests that all routs work. the second block tests with bad data
  */

process.env.depsat = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
chai.use(chaiHttp);
var expect = chai.expect;
var apiVersion = '/v1';

/*
 *  Test the /v1/login
 *  Test 1 allowed user
 *  Test 2 not allowed user
 *  Test 3 no credentials provided
 */
 // Test 1
 describe('/login endpoint tests', function() {
   var baseEndpoint = apiVersion+'/login';
   it('test login with correct credentails', function(done){
     chai.request(server)
         .post(baseEndpoint)
         .set('content-type', 'application/x-www-form-urlencoded')
         .send('Username=test')
         .send('Password=test')
         .end(function(err, res){
           expect(res).to.have.status(200);
           expect(res).to.be.json;
           expect(res.body).to.eql({'Login': 'Success', 'User': 'test'});
           done();
         });
   });
   it('test login with incorrect credentails', function(done){
     chai.request(server)
         .post(baseEndpoint)
         .set('content-type', 'application/x-www-form-urlencoded')
         .send('Username=hakk3R69')
         .send('Password=noscope360')
         .end(function(err, res){
           expect(res).to.have.status(401);
           expect(res).to.be.json;
           expect(res.body).to.eql({'Login': 'Failed', 'User': 'hakk3R69'});
           done();
         });
   });
   it('test login with no credentails', function(done){
     chai.request(server)
         .post(baseEndpoint)
         .end(function(err, res){
           expect(res).to.have.status(401);
           expect(res).to.be.json;
           expect(res.body).to.eql({'Login': 'Failed', 'User': 'No credentials provided'});
           done();
         });
   });
 });

/*
 * Test the user routes
 * Block 1 performs CRUD (Create, Read, Update, Delete) on a single user and test get all users
 * Block 2 performs tests with bad data
 */
describe('Users endpoint tests', function() {
  var baseEndpoint = apiVersion+'/users';
  /*
   *  Block 1
   *  Section(1) sould work correctly. tests basic crud operations
   *  Section(2) should test get all users
   */
  // Section 1
  describe('CRUD actions on a single user', function() {
      // Test data {username: testuser, password: 123456789, name: bob }
      it('/POST Create a user', function(done) {
        chai.request(server)
            .post(baseEndpoint)
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('Username=testuser')
            .send('Password=123456789')
            .send('Name=bob')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.have.header('Location', baseEndpoint+'/testuser');
                expect(res).to.be.json;
              done();
            });
      });
      it('/GET get a user', function(done) {
        chai.request(server)
            .get(baseEndpoint+'/testuser')
            .auth('test', 'test')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.eql({'Username': 'testuser', 'Name': 'bob'});
              done();
            });
      });
      //old password = 123456789 new password = 987654321
      it('/PATCH update a user\'s password', function(done) {
        chai.request(server)
            .patch(baseEndpoint+'/testuser')
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('Password=987654321')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql({'success': 'testuser modified'});
              done();
            });
      });
      it('/DELETE delte a user', function(done) {
        chai.request(server)
            .delete(baseEndpoint+'/testuser')
            .auth('test', 'test')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql({'Deleted User': 'testuser'});
              done();
            });
      });
  });
  // Section 2
  describe('get action on multiple user', function() {
    it('checking /GET all users', function(done){
      chai.request(server)
          .get(baseEndpoint)
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body).to.eql([{'Username': 'test', 'Name': 'testUser'}]);
            done();
          });
    });
    //u:temp n:joe
    it('/POST Create user 1', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('Username=temp')
          .send('Password=21')
          .send('Name=joe')
          .end(function (err, res) {
              expect(res).to.have.status(201);
              expect(res).to.have.header('Location', baseEndpoint+'/temp');
              expect(res).to.be.json;
            done();
          });
    });
      //u:carl n:soap
    it('/POST Create a user 2', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('Username=carl')
          .send('Password=12')
          .send('Name=soap')
          .end(function (err, res) {
              expect(res).to.have.status(201);
              expect(res).to.have.header('Location', baseEndpoint+'/carl');
              expect(res).to.be.json;
            done();
          });
    });

    it('checking /GET all users', function(done){
      chai.request(server)
          .get(baseEndpoint)
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql([{'Username': 'test', 'Name': 'testUser'}, {'Username': 'temp', 'Name': 'joe'}, {'Username': 'carl', 'Name': 'soap'}]);
            done();
          });
    });

    it('/DELETE delte a user 1', function(done) {
      chai.request(server)
          .delete(baseEndpoint+'/temp')
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql({'Deleted User': 'temp'});
            done();
          });
    });

    it('/DELETE delte a user 2', function(done) {
      chai.request(server)
          .delete(baseEndpoint+'/carl')
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql({'Deleted User': 'carl'});
            done();
          });
    });
  });
  /*
   *  Block 2
   *  test with bad data
   */
  describe('test user functions with bad data', function(){
    it('/POST with no data', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .end(function(err, res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.eql({'Error': 'Incorrect user information'});
            done();
      });
    });
    it('/POST with conflict data', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('Username=test')
          .send('Password=123456789')
          .send('Name=bob')
          .end(function(err, res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.eql({'Error': 'User already exsits'});
            done();
      });
    });
    it('/POST with bad data', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('Username=test123')
          .send('Password=123456789')
          .send('Name=bob')Incorrect user information
          .end(function(err, res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.eql({'Error': 'Incorrect user information'});
            done();
      });
    });
  });
});

/*
 * Test the client routes
 * Block 1 performs CRUD (Create, Read, Update, Delete) on a single client
 *
 */
describe('Client endpoint tests', function() {
  var baseEndpoint = apiVersion+'/clients';
  /*
   *  Block 1
   *  Section(1) sould work correctly. tests basic crud operations
   *  Section(2) should test get all clients as well as the get all clients
   */
  // Section 1
  describe('CRUD actions on a single client', function() {
      // Test data {ClientName: testclient, clientid: c000}
      it('/POST Create a client', function(done) {
        chai.request(server)
            .post(baseEndpoint)
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('ClientName=testclient')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.have.header('Location', baseEndpoint+'/c0');
                expect(res).to.be.json;
              done();
            });
      });
      it('/GET get a client', function(done) {
        chai.request(server)
            .get(baseEndpoint+'/c0')
            .auth('test', 'test')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.eql({'ClientID': 'c0', 'ClientName': 'testclient'});
              done();
            });
      });
      //old password = 123456789 new password = 987654321
      it('/PATCH update a client\'s name', function(done) {
        chai.request(server)
            .patch(baseEndpoint+'/c000')
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('ClientName=difffName')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql({'success': 'c000 modified'});
              done();
            });
      });
      it('/DELETE delete a client', function(done) {
        chai.request(server)
            .delete(baseEndpoint+'/c000')
            .auth('test', 'test')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql({'Deleted Client': 'c000'});
              done();
            });
      });
  });
  // Section 2
  describe('get action on multiple clients', function() {
    it('checking /GET all users', function(done){
      chai.request(server)
          .get(baseEndpoint)
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body).to.eql([]);
            done();
          });
    });
    it('/POST Create client 1', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('ClientName=Facebook')
          .end(function (err, res) {
              expect(res).to.have.status(201);
              expect(res).to.have.header('Location', baseEndpoint+'/c0');
              expect(res).to.be.json;
            done();
          });
    });
    it('/POST Create a client 2', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('ClientName=Google')
          .end(function (err, res) {
              expect(res).to.have.status(201);
              expect(res).to.have.header('Location', baseEndpoint+'/c1');
              expect(res).to.be.json;
            done();
          });
    });

    it('checking /GET all clients', function(done){
      chai.request(server)
          .get(baseEndpoint)
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql([{'ClientID': 'c0', 'ClientName': 'Facebook'}, {'ClientID': 'c1', 'ClientName': 'Google'}]);
            done();
          });
    });

    it('/DELETE delete client 1', function(done) {
      chai.request(server)
          .delete(baseEndpoint+'/c0')
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql({'Deleted Client': 'c000'});
            done();
          });
    });

    it('/DELETE delete client 2', function(done) {
      chai.request(server)
          .delete(baseEndpoint+'/c001')
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql({'Deleted Client': 'c001'});
            done();
          });
    });
  });
});
/*
 * Test the jobs routes
 * Block 1 performs CRUD (Create, Read, Update, Delete) on a single job
 *
 */
describe('Job endpoint tests', function() {
  var baseEndpoint = apiVersion+'/jobs';
  /*
   *  Block 1
   *  Section(1) sould work correctly. tests basic crud operations
   *  Section(2) should test get all clients as well as the get all jobs
   */
  // Section 1
  describe('CRUD actions on a single job', function() {
      // Test data {ClientName: testclient, clientid: c000}
      it('/POST Create a client', function(done) {
        chai.request(server)
            .post(baseEndpoint)
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('ClientName=testclient')
            .send('ClientID=c000')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.have.header('Location', baseEndpoint+'/c000');
                expect(res).to.be.json;
              done();
            });
      });
      it('/POST Create a job', function(done) {
        chai.request(server)
            .post(baseEndpoint)
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('JobID=j000')
            .send('Title=testjob')
            .send('Client=c000')
            .send('Status=active')
            .send('StartDate=today')
            .send('Description=the test job')
            .send('InvNum=in0000a1')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.have.header('Location', baseEndpoint+'/j000');
                expect(res).to.be.json;
              done();
            });
      });
      it('/GET get a job', function(done) {
        chai.request(server)
            .get(baseEndpoint+'/j000')
            .auth('test', 'test')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body).to.eql({'ClientID': 'c000', 'ClientName': 'testclient'});
              done();
            });
      });
      //old password = 123456789 new password = 987654321
      it('/PATCH update a client\'s name', function(done) {
        chai.request(server)
            .patch(baseEndpoint+'/c000')
            .auth('test', 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send('ClientName=difffName')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql({'success': 'c000 modified'});
              done();
            });
      });
      it('/DELETE delete a client', function(done) {
        chai.request(server)
            .delete(baseEndpoint+'/c000')
            .auth('test', 'test')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.eql({'Deleted Client': 'c000'});
              done();
            });
      });
  });
  // Section 2
  describe('get action on multiple clients', function() {
    it('checking /GET all users', function(done){
      chai.request(server)
          .get(baseEndpoint)
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res.body).to.eql([]);
            done();
          });
    });
    it('/POST Create client 1', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('ClientID=c000')
          .send('ClientName=Facebook')
          .end(function (err, res) {
              expect(res).to.have.status(201);
              expect(res).to.have.header('Location', baseEndpoint+'/c000');
              expect(res).to.be.json;
            done();
          });
    });
    it('/POST Create a client 2', function(done) {
      chai.request(server)
          .post(baseEndpoint)
          .auth('test', 'test')
          .set('content-type', 'application/x-www-form-urlencoded')
          .send('ClientID=c001')
          .send('ClientName=Google')
          .end(function (err, res) {
              expect(res).to.have.status(201);
              expect(res).to.have.header('Location', baseEndpoint+'/c001');
              expect(res).to.be.json;
            done();
          });
    });

    it('checking /GET all clients', function(done){
      chai.request(server)
          .get(baseEndpoint)
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql([{'ClientID': 'c000', 'ClientName': 'Facebook'}, {'ClientID': 'c001', 'ClientName': 'Google'}]);
            done();
          });
    });

    it('/DELETE delete client 1', function(done) {
      chai.request(server)
          .delete(baseEndpoint+'/c000')
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql({'Deleted Client': 'c000'});
            done();
          });
    });

    it('/DELETE delete client 2', function(done) {
      chai.request(server)
          .delete(baseEndpoint+'/c001')
          .auth('test', 'test')
          .end(function (err, res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.eql({'Deleted Client': 'c001'});
            done();
          });
    });
  });
});
