const express = require("express");
const sequelize= require("./db/db")
const userRouter = require("./routes/index");
const passport = require("./middlewares/strategies");
const app = express();
const report= require("./routes/report")
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/", userRouter);
app.use(express.json());
app.use('/api', report);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


const currentdate= new Date()
console.log(currentdate)
