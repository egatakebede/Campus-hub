require("dotenv").config();
require("./src/services/expiryCron");

const express = require("express");
const cors = require("cors");
const app = express();

const ALLOWED_ORIGINS = [
  "https://campus-hub2026.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Telegram WebView)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

// Routes
const usersRouter = require("./src/routes/users");
const authRouter = require("./src/routes/auth");
const categoriesRouter = require("./src/routes/admin/categories");
const adminUsersRouter = require("./src/routes/admin/users");
const adminReportsRouter = require("./src/routes/admin/reports");
const adminContentRouter = require("./src/routes/admin/content");
const listingRoutes = require("./src/routes/listings");
const bookmarkRoutes = require("./src/routes/bookmarks");
const reportRoutes = require("./src/routes/reports");
const searchRoutes = require("./src/routes/search");
const servicesRoutes = require("./src/routes/services");

app.use(express.json());

// Register routes
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/admin/categories", categoriesRouter);
app.use("/admin/users", adminUsersRouter);
app.use("/admin/reports", adminReportsRouter);
app.use("/admin", adminContentRouter);
app.use("/listings", listingRoutes);
app.use("/bookmarks", bookmarkRoutes);
app.use("/reports", reportRoutes);
app.use("/search", searchRoutes);
app.use("/services", servicesRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
