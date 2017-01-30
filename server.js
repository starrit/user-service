// Creation of Logger.
const bunyan = require('bunyan');
const logger = bunyan.createLogger({name: 'User'});
const logResponseBody = process.env.DEBUG;

const DBSetup = require("./src/general/DBSetup");
const MongoService = new DBSetup(logger);

MongoService.start()
  .then(() => {
    const middleware = require("./src/general/Middleware");
    const UserAPI = require("./src/user/UserAPI");
    const grpc = require('grpc');
    const protoDescriptor = grpc.load(__dirname + '/user-service.proto').users;

    const server = new grpc.Server();

    const userAPI = middleware(new UserAPI(logger), logger, logResponseBody);
    server.addProtoService(protoDescriptor.UserService.service, userAPI);

    server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    server.start();
  })
  .catch(ex => {
    logger.fatal("Error starting service", ex);
  });

