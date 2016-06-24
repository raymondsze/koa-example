import mongoose from 'mongoose';
import _bcrypt from 'bcrypt';
import Promise from 'bluebird';

const bcrypt = Promise.promisifyAll(_bcrypt);
const SALT = 10;

/**
 * get the password hash
 * @param  {String} password                - the password
 * @return {String}                         - the password hash
 */
async function getPasswordHash(password) {
  // generate a salt
  const salt = await bcrypt.genSaltAsync(SALT);
  // hash password
  const hash = await bcrypt.hashAsync(password, salt);
  return hash;
}

/**
 * The user mongoose schema
 */
const User = new mongoose.Schema({
  // username
  username: {
    type: String,
    required: true,
    unique: true,
  },
  // email
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // password
  password: {
    type: String,
    required: true,
  },
}, {
  // add createdAt and updateAt
  timestamps: true,
});

/**
 * Pre update hook
 * @param  {Function} cb                    - the callback
 */
User.pre('update', function preUpdate(cb) {
  (async () => {
    const password = this.getUpdate().$set.password;
    // only hash the password if it has been modified (or is new)
    if (password) {
      this.update({},
        { $set: { password: await getPasswordHash(password) } },
        { runValidators: false });
    }
  })().then(cb).catch(cb);
});

/**
 * Pre save hook
 * @param  {Function} cb                    - the callback
 */
User.pre('save', function preSave(cb) {
  const user = this;
  (async () => {
    // only hash the password if it has been modified (or is new)
    if (user.isModified('password')) {
      user.password = await getPasswordHash(user.password);
    }
  })().then(cb).catch(cb);
});

/**
 * Compare user password with the input password
 * @param  {String}   candidatePassword     - the candidate password
 */
User.methods.comparePassword = async function comparePassword(candidatePassword) {
  const isMatch = await bcrypt.compareAsync(candidatePassword, this.password);
  return isMatch;
};

/**
 * The toJson standard method
 * @return {Object}                         - the user json object
 */
User.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', User, 'Users');
