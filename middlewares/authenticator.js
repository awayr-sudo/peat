const passport = require("passport");
const AttendanceM = require("../models/attendanceM");

const keyAuthenticator = (req, res, next) => {
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

const checkInAuthenticator = async (req, res, next) => {
  const userCheckIn = await AttendanceM.findOne({
    where: {
      user_id: req.user.id,
      check_out: null,
    },
  });

  if (userCheckIn !== null) {
    next();
  } else {
    return res.status(401).send("you need to be checked in to do this action");
  }
  req, res, next;
};

module.exports = { keyAuthenticator, checkInAuthenticator };
