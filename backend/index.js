require("dotenv").config();
require('./src/services/expiryCron');


const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "localhost";

const usersRouter = require("./src/routes/users");
const categoriesRouter = require("./src/routes/admin/categories");
const listingRoutes = require('./src/routes/listings');
const bookmarkRoutes = require('./src/routes/bookmarks');
app.use(express.json());
app.use("/users", usersRouter);
app.use("/admin/categories", categoriesRouter);
app.use('/listings', listingRoutes);
app.use('/bookmarks', bookmarkRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
