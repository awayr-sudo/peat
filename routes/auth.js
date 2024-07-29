const express = require("express");
const auth = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { usersM } = require("../models/usersM");
const { key_authenticator } = require("../middlewares/user_authenticator");
const { body, validationResult } = require("express-validator");

auth.post(
  "/login",
  [
    body("email").isEmail().withMessage("please use correct email address"),
    body("password").notEmpty().withMessage("Enter Password"),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await usersM.findOne({ where: { email: email } });
    if (!user) {
      res.status(401).send("no user with this email found");
    }

    const match_pass = await bcrypt.compare(password, user.password);
    if (!match_pass) {
      res.status(401).send({ message: "Incorrect password." });
    }

    const token = uuidv4();
    const tokenExpiration = new Date(Date.now() + 3600000);

    try {
      await usersM.update(
        { access_key: token, expire_time: tokenExpiration },
        { where: { id: user.id } }
      );
    } catch (err) {
      console.log(err);
    }
    return res.status(200).json({
      name: user.full_name,
      user_token: token,
    });
  }
);

// this route is the homepage, only gives that user details ( for check purpose )
auth.get("/success", key_authenticator, async (req, res) => {
  const user = req.user;
  res.status(400).json({ message: { user } });
});

auth.post("/register", async (req, res) => {
  const { username, email, password, role, forgotCode } = req.body;
  if ((username || email || password || role || forgotCode) == undefined) {
    return res.status(403).json({ message: "Please fill out all the fields" });
  }
  try {
    const hashPass = await bcrypt.hash(password, 10);
    const user = await usersM.findOne({ where: { email: email } });
    if (user) {
      return res.send("user already exists");
    }
    await usersM.create({
      full_name: username,
      email: email,
      password: hashPass,
      role: role,
      forget_code: forgotCode,
    });
  } catch (err) {
    console.log(err);
  }
  res.status(200).json({
    message: `hello ${username} with '${password}' password and role of ${role} and secret key ${forgotCode}`,
  });
});

auth.post("/forgot", async (req, res) => {
  try {
    const { email, forgotCode, newPass } = req.body;

    const user = await usersM.findOne({ where: { email: email } });

    if (!user || user.forget_code !== forgotCode) {
      return res.status(401).send("Invalid email or forgot code");
    }

    const salt = 12;
    const hashPass = await bcrypt.hash(newPass, salt);

    await usersM.update({ password: hashPass }, { where: { id: user.id } });

    // await usersM.update({ forget_code: "null" }, { where: { id: user.id } });

    res.status(200).send("Password changed successfully");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = auth;
