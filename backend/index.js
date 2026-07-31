require("dotenv").config();
const express = require("express");
const usersRouter = require("./src/routes/users");
const listingRoutes = require("./src/routes/listings");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/users", usersRouter);
app.use("/listings", listingRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
