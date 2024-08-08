const express = require("express");
const Index = require("./routes/Index");
const passport = require("./middlewares/strategies");
const app = express();
const port = process.env.PORT;
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());


app.use("/", Index);
app.use(express.json());

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
