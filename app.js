const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const dotenv = require("dotenv");
dotenv.config();
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 8080;

const mongoose = require("mongoose");
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Database is connected successfully.");
    console.log("DB NAME:", mongoose.connection.name);
  })
  .catch((error) => {
    console.error("Database connection error: ", error);
  });

  app.use("/ping", (req, res) => {
    res.send("pong");
  });
const sharedProjectRoutes = require("./routes/sharedProject");
const userRoutes = require("./routes/user");
app.use("/api/shared", sharedProjectRoutes);
app.use("/api/user", userRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
