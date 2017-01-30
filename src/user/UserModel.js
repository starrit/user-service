const DBSetup = require('../general/DBSetup');

const mongoose = new DBSetup().mongoose;
const Schema = mongoose.Schema;

const UserFields = ["id", "name", "nickname", "bio", "location", "age", "website"];

/**
 * Schema for our User object.
 */
const userSchema = new Schema({
  name: String,
  nickname: String,
  bio: String,
  location: String,
  age: Number,
  website: String,
  created_at: Date,
  updated_at: Date
});

// Make sure to set the updated_at and possibly the created_at with each save.
userSchema.pre('save', function(next) {
  const currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at)
    this.created_at = currentDate;
  next();
});

userSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true
});

const UserModel = mongoose.model('User', userSchema);

module.exports = {
  UserFields,
  UserModel
};
