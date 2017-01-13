/*
 * NB the line at the top sets up the enviroment so that a testing database is userid
 * NB This database has a user un: test pw: test, they are needed to get through the http basic authentication on all request except login
 * NB do not delete the testing database else you need to re add the test user
 */
process.env.depsat = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
chai.use(chaiHttp);

var apiVersion = '/v1';

/*
 * Test the user routes
 * Block 1 performs CRUD (Create, Read, Update, Delete) on a single user
 * Block 2 adds 3 usres and test bulk and login functions
 */
describe('Users endpoint tests', function() {
  var baseEndpoint = apiVersion+'/users';
/*
 *  Block 1
 *  Section(1) sould work correctly
 *  Section(2) should test bad, incomplete and wrong data
 */
  describe('CRUD actions on a single user', function() {
      // Section 1
      // Test data {username: testuser, password: 123456789, }
      it('Create a user', function(done) {
        chai.request(server)
            .get('/v1/users')
            .auth('test', 'test')
            .end(function (err, res) {
                res.should.have.status(200);
              done();
            });
      });
  });

});
