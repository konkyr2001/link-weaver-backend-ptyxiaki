const jwt = require("jsonwebtoken");
const SECRET_TOKEN = process.env.JWT_ACCESS_TOKEN_SECRET
function generateToken(id) {
  return jwt.sign({ userId: id }, SECRET_TOKEN);
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_TOKEN);
}

module.exports = { generateToken, verifyToken };