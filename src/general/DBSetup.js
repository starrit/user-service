const Promise = require("bluebird");

const mongoose = require("mongoose");
const mongoTimeout = 360;
const mongoDisconnectedState = 0;

let mongoService;

class MongoService {

  /**
   * Creates a MongoService with all of the necessary configuration pulled from the environment
   * and logging set up for expected connection events.
   * @param logger Logger to be used to log events.
   */
  constructor(logger) {

    if (mongoService) {
      return mongoService
    }

    // Set up parameters defining Mongo instance
    this.MONGO_HOST = process.env.MONGO_HOST;
    this.MONGO_DATABASE = process.env.MONGO_DATABASE;

    this.MONGO_PORT = process.env.MONGO_PORT ? process.env.MONGO_PORT : 27017;
    this.MONGO_USER = process.env.MONGO_USER ? process.env.MONGO_USER : null;
    this.MONGO_PASSWORD = process.env.MONGO_PASSWORD ? process.env.MONGO_PASSWORD : null;
    this.MONGO_REPL_SET = process.env.MONGO_REPL_SET ? process.env.MONGO_REPL_SET : null;
    this.MONGO_KEEP_ALIVE = process.env.MONGO_KEEP_ALIVE ? process.env.MONGO_KEEP_ALIVE : 120;
    this.MONGO_SSL  = process.env.MONGO_SSL ? process.env.MONGO_SSL : false;
    this.MONGO_VALIDATE_SSL = process.env.MONGO_VALIDATE_SSL ? process.env.MONGO_VALIDATE_SSL : false;
    this.MONGO_SHARD_ENABLED = process.env.MONGO_SHARD_ENABLED ? process.env.MONGO_SHARD_ENABLED : false;
    this.MONGO_POOL_SIZE = process.env.MONGO_POOL_SIZE ? process.env.MONGO_POOL_SIZE : 5;
    
    this.created = new Date();
    this.mongoose = mongoose;
    this.mongoose.Promise = require('bluebird').Promise;
    this.timer = 5;
    this.logger = logger;

    this.MONGO_PARAMS = [this.MONGO_REPL_SET ? "replicaSet=" + this.MONGO_REPL_SET : "", (this.MONGO_SSL) ? "ssl=true" : ""]
      .filter(piece =>  { return piece }).join('&');
    this.MONGO_URI = `mongodb://${this.MONGO_HOST}${(this.MONGO_PORT) ? ":" + this.MONGO_PORT : ""}/${this.MONGO_DATABASE}?${this.MONGO_PARAMS}`;

    this.MONGO_OPTIONS = {
      db: { native_parser: true },
      server: {
        poolSize: this.MONGO_POOL_SIZE,
        sslValidate: this.MONGO_VALIDATE_SSL,
        auto_reconnect : true,
        socketOptions: {
          keepAlive: this.MONGO_KEEP_ALIVE
        }
      },
      replset: { rs_name: this.MONGO_REPL_SET },
      mongos: this.MONGO_SHARD_ENABLED,
      user: this.MONGO_USER,
      pass: this.MONGO_PASSWORD
    };

    mongoService = this;

    // Set up logging for all connection events
    this.mongoose.connection.on('open', () => {
      logger.debug({action: "mongoConnectionOpened", mongoHost : mongoService.MONGO_HOST}, `Mongo Connection Opened for ${mongoService.MONGO_HOST}`);
    });

    this.mongoose.connection.on('connected', () => {
      logger.debug({action: "mongoConnectionConnected", mongoHost : mongoService.MONGO_HOST}, `Mongo Connection Established with ${mongoService.MONGO_HOST}`);
    });

    this.mongoose.connection.on('error', (err) => {
      logger.error({action: "mongoConnectionError", mongoHost : mongoService.MONGO_HOST, err}, `Mongo Connection ERROR: ${err}`);
    });

    this.mongoose.connection.on('disconnected', () => {
      logger.error({action: "mongoConnectionDisconnected", mongoHost : mongoService.MONGO_HOST}, `Mongo Connection Closed for ${mongoService.MONGO_HOST}`);
    });

    return mongoService;
  }

  /**
   * Starts the MongoService by connecting to the Mongo database.
   * Will be called recursively if connection fails.
   * @returns {*}
   */
  start(prom) {
    // create a new Promise if this is our first iteration, otherwise pass through.
    const deferred = prom ? prom : Promise.pending();
    const self = this;
    if (self.mongoose.connection.readyState === mongoDisconnectedState) {
      self.mongoose.connect(self.MONGO_URI, self.MONGO_OPTIONS)
        .then(() => {
          self.logger.info({action: "mongoConnectionEstablished", mongoHost: self.MONGO_HOST}, `Now connected to ${self.MONGO_HOST}`);
          deferred.resolve("Connection established");
        })
        .catch(err => {
          if (self.timer < mongoTimeout) {
            self.timer = Math.min(self.timer * 2, 5000);
            self.logger.info({action: "mongoConnectionError", mongoHost: self.MONGO_HOST, err},
              `Error attempting to connect to ${self.MONGO_HOST}, retrying after ${self.timer} ms`);
            setTimeout(() => {
              self.start(deferred);
            }, self.timer);
          } else {
            self.logger.fatal({action: "mongoConnectionFailure", mongoHost: self.MONGO_HOST}, `Unable to connect to ${self.MONGO_HOST} in the timeout period`);
            deferred.reject(`Unable to connect to ${self.MONGO_HOST} within the ${mongoTimeout}ms timeout period`);
          }
        });
    } else {
      self.logger.debug({action: "mongoConnectionInProgress", mongoHost: self.MONGO_HOST}, `Mongo Connection for ${self.MONGO_HOST} already in progress`);
      deferred.reject("Mongo connection already in progress");
    }
    return deferred.promise;
  }

}

module.exports = MongoService;
