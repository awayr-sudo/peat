const LocalStrategy = require("passport-local").Strategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const { usersM } = require("../models/usersM");
const bcrypt = require("bcryptjs");
const passport = require("passport");

// Local DB Username and Password Strategy
passport.use(
  "validation",
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        console.log(email + " " + password);
        const user = await usersM.findOne({ where: { email: email } });
        if (!user) {
          return done(null, false, {
            message: "Incorrect email address.",
          });
        }
        const match_pass = await bcrypt.compare(password, user.password);
        if (!match_pass) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Bearer token strategy to check users when they use get requests
passport.use(
  new BearerStrategy((token, done) => {
    const user = usersM.findOne({ where: { access_key: token } });
    if (!user) return done(null, false);
    // return done(null, user);
    if (token == null || undefined) {
      return done(null, false, { message: "No access key defined" });
    }
    usersM
      .findOne({ where: { access_key: token } })
      .then((user) => {
        if (!user) {
          return done(null, false, { message: "Invalid access key" });
        }

        const current_time = new Date().getTime();
        const expire_time = new Date(user.expire_time).getTime();

        if (current_time > expire_time) {
          return done(null, false, { message: "access key expired" });
        }

        return done(null, user);
      })
      .catch((err) => {
        return done(err);
      });
  })
);

module.exports = passport;
