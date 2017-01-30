var PROTO_PATH = __dirname + '/user-service.proto';

var grpc = require('grpc');
var proto = grpc.load(PROTO_PATH).users;

var client = new proto.UserService('0.0.0.0:50051',
  grpc.credentials.createInsecure());

client.createUserCall({name: 'kristen'}, function(err, response) {
  console.log('Greeting:', response);
});

