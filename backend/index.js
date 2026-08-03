require("dotenv").config();

const express = require("express");
const usersRouter = require("./src/routes/users");
const authRouter = require("./src/routes/auth");

const app = express();
const PORT = process.env.PORT || 4000;

// Parse JSON request bodies
app.use(express.json());

// Register routes
app.use("/users", usersRouter);
app.use("/auth", authRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
