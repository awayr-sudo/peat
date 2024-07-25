const express = require("express");
const Index = require("./routes/index");
const passport = require("./middlewares/strategies");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/", Index);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
