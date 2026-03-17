const User = require('../models/User');

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findById(id) {
    return await User.findById(id).select('-password');
  }

  async countAll() {
    return await User.countDocuments();
  }
}

module.exports = new UserRepository();
