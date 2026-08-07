require("dotenv").config();
require("./src/services/expiryCron");

const express = require("express");
const app = express();

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

// Routes
const usersRouter = require("./src/routes/users");
const authRouter = require("./src/routes/auth");
const categoriesRouter = require("./src/routes/admin/categories");
const adminUsersRouter = require("./src/routes/admin/users");
const adminReportsRouter = require("./src/routes/admin/reports");
const listingRoutes = require("./src/routes/listings");
const bookmarkRoutes = require("./src/routes/bookmarks");
const reportRoutes = require("./src/routes/reports");
const searchRoutes = require("./src/routes/search");

app.use(express.json());

// Register routes
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/admin/categories", categoriesRouter);
app.use("/admin/users", adminUsersRouter);
app.use("/admin/reports", adminReportsRouter);
app.use("/listings", listingRoutes);
app.use("/bookmarks", bookmarkRoutes);
app.use("/reports", reportRoutes);
app.use("/search", searchRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
