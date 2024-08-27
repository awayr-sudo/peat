const express = require("express");
const Index = require("./routes/index");
const passport = require("./middlewares/strategies");
// const sequelize = require("./db/db");
// const userRouter = require("./routes/index");
const app = express();
// const port = process.env.PORT;
const report = require("./routes/report");
// const applyleave = require("./routes/applytoken");

// const passport= require("passport")

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

app.use("/", Index);
app.use(express.json());
app.use("/api", report);

// app.use('/api',timetrack)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const currentdate = new Date();
console.log(currentdate);
