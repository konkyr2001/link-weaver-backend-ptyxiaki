const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { verifyCaptcha } = require("../utils/verifyCaptcha");
const { generateToken } = require("../utils/token");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User doesn't exist" });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({ error: "Invalid email or password " });
    }
    const userObj = user.toObject();
    delete userObj.password;
    const token = generateToken(user._id);
    return res.status(200).json({ userObj, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, recaptcha } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }
    const recaptchaData = await verifyCaptcha(
      process.env.SIGNUP_RECAPTCHA_SECRET_KEY,
      recaptcha,
    );
    if (!recaptchaData.success) {
      return res.status(400).json({ error: "Captcha verification failed" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,

      password: hashedPassword,
    });
    await newUser.save();
    const userObj = newUser.toObject();
    delete userObj.password;
    const token = generateToken(userObj._id);
    return res.status(201).json({ userObj, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
