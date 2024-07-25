const passport = require("passport");

const user_authenticator = (req, res, next) => {
  passport.authenticate("validation", async (err, user, info) => {
    if (err) {
      return res.status(500).send("Error During Authentication" + err);
    }
    if (!user) {
      return res.status(401).json(info);
    }
    req.user = user;
    next();
  })(req, res, next);
};

const key_authenticator = (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, info) => {
      try {
        if (err) {
          return res.status(500).send("Error During Authentication" + err);
        }
        if (!user) {
          // extracting our message from info

          if (!info.match("error_description")) {
            return res.status(401).json({ message: "Invalid Token" });
          }

          let auth_error = info.split(", ")[2].split("=")[1].split('"')[1];
          return res.status(401).send(auth_error);
        }
        req.user = user;
        next();
      } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).send("Server Error");
      }
    }
  )(req, res, next);
};

module.exports = { user_authenticator, key_authenticator };
