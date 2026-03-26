const jwt = require("jsonwebtoken");

function generateToken(id) {
  return jwt.sign({ userId: id }, process.env.JWT_ACCESS_TOKEN_SECRET);
}

module.exports = { generateToken };