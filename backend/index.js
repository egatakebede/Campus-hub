require("dotenv").config();

const express = require("express");
const usersRouter = require("./src/routes/users");

const app = express();
const PORT = process.env.PORT || 4000;

// Parse JSON request bodies
app.use(express.json());

// Register user routes
app.use("/users", usersRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
