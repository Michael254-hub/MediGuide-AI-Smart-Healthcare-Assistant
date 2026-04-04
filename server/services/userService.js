const userRepository = require('../repositories/userRepository');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');

class UserService {
  async registerUser(userData) {
    const { name, email, password, phone } = userData;

    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      throw new Error('User already exists');
    }

    // role is always 'patient' for self-registration; admins are created via seeding/admin tools
    const user = await userRepository.create({ name, email, password, phone: phone || null, role: 'patient' });
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user.id)
    };
  }

  async authenticateUser(email, password) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      };
    } else {
      throw new Error('Invalid email or password');
    }
  }

  async getUserProfile(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new UserService();
