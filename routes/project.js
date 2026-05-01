const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const { nanoid } = require("nanoid");
const { verifyCaptcha } = require("../utils/verifyCaptcha");
const { verifyToken } = require("../utils/token");

router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const project = await Project.findOne({ slug });
    if (project) {
      return res.status(200).json(project);
    }
    return res.status(404).json({ error: "Shared project not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectName, urls, userToken, captcha } = req.body;
    if (!projectName || !urls || urls.length === 0) {
      return res.status(400).json({ error: "Invalid data passed. " });
    }
    const slug = nanoid(8);
    let expiresAt = null;
    let userId = null;
    if (!userToken) {
      const captchaResult = await verifyCaptcha(
        process.env.GENERATE_URL_RECAPTCHA_SECRET_KEY,
        captcha,
      );
      if (!captchaResult.success) {
        return res.status(400).json({ error: "Captcha verification failed" });
      }
      expiresAt = new Date(Date.now() + process.env.NO_ACCOUNT_PROJECT_EXPIRATION_DAY * 24 * 60 * 60 * 1000);
    } else {
      const decoded = verifyToken(userToken);
      userId = decoded.userId;
      expiresAt = new Date(Date.now() + process.env.ACCOUNT_PROJECT_EXPIRATION_DAY * 24 * 60 * 60 * 1000);
    }
    const newProject = new Project({
      slug,
      projectName,
      urls,
      expiresAt,
      userId,
    });
    await newProject.save();
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $push: { projects: newProject._id }
      });
    }
    return res.status(201).json({ slug });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
