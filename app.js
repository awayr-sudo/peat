const express = require("express");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const { usersM } = require("./models/usersM");
const auth = require("./routes/auth");
const bcrypt = require("bcryptjs");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Local DB Username and Password Strategy
passport.use(
  "validation",
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await usersM.findOne({ where: { full_name: username } });
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      const matchPass = await bcrypt.compare(password, user.password);
      if (!matchPass) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Bearer token strategy to check users when they use get requests
passport.use(
  new BearerStrategy((token, done) => {
    usersM
      .findOne({ where: { access_key: token } })
      .then((user) => {
        if (!user) {
          return done(null, false, { message: "Invalid token" });
        }

        const currentTime = new Date().getTime();
        const expireTime = new Date(user.expire_time).getTime();

        if (currentTime > expireTime) {
          return done(null, false, { message: "Token expired" });
        }

        return done(null, user);
      })
      .catch((err) => done(err));
  })
);

app.use("/", auth);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
