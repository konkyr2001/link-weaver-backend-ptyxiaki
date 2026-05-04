const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { jwtDecode } = require("jwt-decode");
const { verifyCaptcha } = require("../utils/verifyCaptcha");
const { generateToken, verifyToken } = require("../utils/token");

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
    if (user.authProvider === "google") {
      return res.status(400).json({ error: "Please sign in with Google" });
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
    const { firstName, lastName, email, password, recaptcha } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }
    const recaptchaData = await verifyCaptcha(
      process.env.RECAPTCHA_VISIBLE_SECRET_KEY,
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
      authProvider: "local",
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
        authProvider: "google",
      });
      await user.save();

      existingUser = user.toObject();
    }

    const authToken = generateToken(existingUser._id);
    return res.status(201).json({ userObj: existingUser, token: authToken });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) {
      return res.status(401).json({ error: "No token" });
    }
    const token = authToken.split(" ")[1];
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const user = await User.findById(userId).populate("projects");
    return res.status(201).json({ projects: user.projects });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/updateProfile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const { firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        firstName,
        lastName,
      },
      { new: true },
    ).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/changePassword", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.authProvider === "google") {
      return res
        .status(400)
        .json({ error: "Google accounts cannot change password" });
    }
    const checkPassword = await bcrypt.compare(currentPassword, user.password);
    if (!checkPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const { password } = req.body;
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.authProvider === "google") {
      return res
        .status(400)
        .json({ error: "Use Google delete route for this account" });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({ error: "Password is incorrect" });
    }
    await Project.deleteMany({ userId: user._id });
    await user.deleteOne();
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/google/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.authProvider !== "google") {
      return res.status(400).json({ message: "This is not a Google account" });
    }
    await Project.deleteMany({ userId: user._id });
    await user.deleteOne();
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
