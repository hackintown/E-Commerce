const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ msg: "This is Example" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server Is Running");
});

app.use("/user", require("./routes/userRoutes"));

// connect mongoDB
const URL = process.env.MONGODB_URL;
mongoose
  .connect(URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));
