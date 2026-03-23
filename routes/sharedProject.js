const express = require("express");
const router = express.Router();
const SharedProject = require("../models/SharedProject");
const { nanoid } = require("nanoid");

router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const shared = await SharedProject.findOne({ slug });
    console.log("get by id: ", shared);
    if (shared) {
      res.status(200).json(shared);
    }
    console.log("shared project not found: ");
    res.status(404).json({error: "Shared project not found"});
  } catch (error) {
    console.log("error");
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { projectName, urls, userId } = req.body;
    if (!projectName || !urls || urls.length === 0) {
      return res.status(400).json({ error: "Invalid data passed. " });
    }
    const slug = nanoid(8);
    let expiresAt = null;
    if (!userId) {
      expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    } else {
      // get user by id
      // check if user has premium
      // if user has premium = expireDate = null;
    }
    const sharedProject = new SharedProject({
      slug,
      projectName,
      urls,
      expiresAt,
      userId,
    });
    await sharedProject.save();
    console.log("saved: ", sharedProject);
    res.status(201).json({ slug });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
