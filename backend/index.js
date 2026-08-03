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
const listingRoutes = require("./src/routes/listings");

app.use(express.json());

// Register routes
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/admin/categories", categoriesRouter);
app.use("/listings", listingRoutes);

const listingRoutes = require('./src/routes/listings');
const servicesRoutes = require('./src/routes/services');
app.use('/listings', listingRoutes);
app.use('/services', servicesRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});