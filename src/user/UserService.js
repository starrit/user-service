var User = require('./UserModel');

/**
 * Class for performing operations on User objects.
 */
class UserService {

  constructor(logger) {
    this.logger = logger;
  }

  getUser(id) {
    return User.UserModel.findById(id)
      .then(user => {
        return this.createUserObject(user);
      })
      .catch(err => {
        this.logger.error({err}, "Error obtaining User by Id");
        throw new Error("Error obtaining User by Id");
      })
  }

  createUser(params) {
    const newUser = new User.UserModel(this.createUserObject(params));
    newUser.save();
    return Promise.resolve(this.createUserObject(newUser));
  }

  createUserObject(result) {
    const userObject = {};
    User.UserFields.forEach(field => {
      userObject[field] = result[field]
    });
    return userObject;
  }

}

module.exports = UserService;
