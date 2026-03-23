const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
        
    }
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("User", userSchema);
