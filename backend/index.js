require("dotenv").config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const usersRouter = require("./src/routes/users");
app.use("/users", usersRouter);

const listingRoutes = require('./src/routes/listings');
const servicesRoutes = require('./src/routes/services');
app.use('/listings', listingRoutes);
app.use('/services', servicesRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});