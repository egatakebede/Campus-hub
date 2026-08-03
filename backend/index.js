require("dotenv").config();
<<<<<<< HEAD
const express = require("express");
const usersRouter = require("./src/routes/users");
const listingRoutes = require("./src/routes/listings");

=======

const express = require('express');
>>>>>>> b2e2e5740def294a8c12f9c2f38f1f2ef27ecc6b
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

<<<<<<< HEAD
=======
const usersRouter = require("./src/routes/users");
>>>>>>> b2e2e5740def294a8c12f9c2f38f1f2ef27ecc6b
app.use("/users", usersRouter);
app.use("/listings", listingRoutes);

<<<<<<< HEAD
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
=======
const listingRoutes = require('./src/routes/listings');
app.use('/listings', listingRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
>>>>>>> b2e2e5740def294a8c12f9c2f38f1f2ef27ecc6b
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});