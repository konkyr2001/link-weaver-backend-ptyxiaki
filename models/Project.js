const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    projectName: {
      type: String,
      required: true,
    },
    urls: [
      {
        url: String,
        domain: String,
      },
    ],
    expiresAt: {
      type: Date,
      default: null,
      index: { expires: 0 },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

module.exports = mongoose.model("Project", projectSchema);
