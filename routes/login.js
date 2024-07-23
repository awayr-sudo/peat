const express = require("express");
const login = express.Router();
const passport = require("passport");
const { v4: uuidv4 } = require("uuid");
const { usersM } = require("../models/usersM");

login.post("/login", (req, res, next) => {
  console.log(req.body.username);
  console.log(req.body.password);
  passport.authenticate(
    "validation",
    { session: false },
    async (err, user, info) => {
      if (user) {
        const token = uuidv4();
        const tokenExpiration = new Date(Date.now() + 9000000);

        try {
          await usersM.update(
            { access_key: token, expire_time: tokenExpiration },
            { where: { id: user.id } }
          );
        } catch (err) {
          console.log(err);
        }
        res.status(200).json({
          name: user.full_name,
          user_token: token,
        });
      } else {
        res.status(403).send("Invalid username or password");
      }
    }
  )(req, res, next);
});

// this route is the homepage
login.get("/success", (req, res, next) => {
  passport.authenticate("bearer", { session: false }, (err, user) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user) {
      res.json({
        message: "Welcome, " + user.full_name + " " + user.access_key,
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  })(req, res, next);
});

module.exports = login;
