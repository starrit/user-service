const UserService = require("./UserService");

/**
 * Implementation of User Service GRPC endpoints.
 */
class UserAPI {

  /**
   * Creates an instance of the User API.
   */
  constructor(logger) {
    this.userService = new UserService(logger);
  };

  /**
   * Implements the CreateUser RPC method.
   */
  createUserCall(call, callback) {
    const self = this;
    self.userService.createUser(call.request)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        callback(err, null);
      })
  };

  /**
   * Implements the GetUser RPC method.
   */
  getUserCall(call, callback) {
    const self = this;
    self.userService.getUser(call.request.id)
      .then(user => {
        callback(null, user);
      })
      .catch(err => {
        callback(err, null);
      })
  };


}

module.exports = UserAPI;
