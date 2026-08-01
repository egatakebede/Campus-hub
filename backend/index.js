require("dotenv").config();

const express = require("express");
const usersRouter = require("./src/routes/users");
const categoriesRouter = require("./src/routes/admin/categories");

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

// Parse JSON request bodies
app.use(express.json());

// Register user routes
app.use("/users", usersRouter);
app.use("/admin/categories", categoriesRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
