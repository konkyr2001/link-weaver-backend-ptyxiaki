const express = require("express");
const router = express.Router();
const SharedProject = require("../models/SharedProject");
const { nanoid } = require("nanoid");
const { verifyCaptcha } = require("../utils/verifyCaptcha");

router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const shared = await SharedProject.findOne({ slug });
    if (shared) {
      return res.status(200).json(shared);
    }
    return res.status(404).json({ error: "Shared project not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectName, urls, userId, captcha } = req.body;
    if (!projectName || !urls || urls.length === 0) {
      return res.status(400).json({ error: "Invalid data passed. " });
    }
    const slug = nanoid(8);
    let expiresAt = null;
    if (!userId) {
      const captchaResult = await verifyCaptcha(
        process.env.GENERATE_URL_RECAPTCHA_SECRET_KEY,
        captcha,
      );
      if (!captchaResult.success) {
        return res.status(400).json({ error: "Captcha verification failed" });
      }
      expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    } else {
      // get user by id
      // check if user has premium
      // if user has premium = expireDate = null;
    }
    const newSharedProject = new SharedProject({
      slug,
      projectName,
      urls,
      expiresAt,
      userId,
    });
    await newSharedProject.save();
    console.log("saved: ", newSharedProject);
    return res.status(201).json({ slug });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
