const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const allowedOrigins = [
  `${process.env.LOCAL_FRONTEND_URL}`,
  `${process.env.PRODUCTION_FRONTEND_URL}`,
  `${process.env.GOOGLE_EXTENSION_URL}`,
  `${process.env.PRODUCTION_VERCEL_FRONTEND_URL}`,
  `${process.env.PTIXIAKI_PRODUCTION_FRONTEND_URL}`,
  `${process.env.PTIXIAKI_PRODUCTION_VERCEL_FRONTEND_URL}`,
];

app.use(express.json());
app.use(cors({
  origin: allowedOrigins
}));


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
const projectRoutes = require("./routes/project");
const userRoutes = require("./routes/user");
app.use("/api/project", projectRoutes);
app.use("/api/user", userRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
