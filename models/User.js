const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      default: null,
    },
    premium: {
      type: Boolean,
      default: null,
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null,
      }
    ]
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("User", userSchema);
