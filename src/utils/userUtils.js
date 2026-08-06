const bcrypt = require("bcryptjs");

// 1. Password Hash garne helper function
exports.hashPassword = async (password) => {
  if (!password) return null;
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// 2. Plain password ra hashed password match garne function
exports.comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};