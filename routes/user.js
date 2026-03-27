const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { jwtDecode } = require("jwt-decode");
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

router.post("/signup", async (req, res) => {
  try {
    console.log("signup");
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

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res
        .status(401)
        .json({ error: "Something went wrong with Google account" });
    }
    const userCredentials = jwtDecode(token.credential);
    let existingUser = await User.findOne({ email: userCredentials.email });
    if (!existingUser) {
      const user = new User({
        firstName: userCredentials.given_name,
        lastName: userCredentials.family_name,
        email: userCredentials.email,
      });
      await user.save();

      console.log("saved");
      existingUser = user.toObject();
    }

    const authToken = generateToken(existingUser._id);
    return res.status(201).json({ userObj: existingUser, token: authToken });
  } catch (error) {
    console.log("mpike catch")
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
