const BearerStrategy = require("passport-http-bearer").Strategy;
const { usersM } = require("../models/usersM");
const passport = require("passport");

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
