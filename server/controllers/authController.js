const userService = require('../services/userService');

const registerUser = async (req, res, next) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    if (error.message === 'User already exists') {
      res.status(400);
    }
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const user = await userService.authenticateUser(req.body.email, req.body.password);
    res.status(200).json({ success: true, user });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      res.status(401);
    }
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404);
    }
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
