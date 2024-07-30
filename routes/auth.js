const express = require("express");
const auth = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { usersM } = require("../models/usersM");
const { keyAuthenticator } = require("../middlewares/key.authenticator");
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
      return res.status(500).json({
        message: "Error logging in",
        error: err,
      });
    }
    return res.status(200).json({
      name: user.full_name,
      user_token: token,
    });
  }
);

// this route is the homepage, only gives that user details ( for check purpose )
auth.get("/success", keyAuthenticator, async (req, res) => {
  const user = req.user;
  res.status(400).json({ message: { user } });
});

auth.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Enter Username"),
    body("email")
      .notEmpty()
      .isEmail()
      .withMessage("Use a correct email address"),
    body("password").notEmpty().withMessage("Enter Password"),
    body("role").notEmpty().withMessage("Enter Role"),
    body("forgotCode").notEmpty().withMessage("Enter Forgot Code"),
    body("primaryNumber").notEmpty().withMessage("Enter primary phone number"),
    body("primaryAddress").notEmpty().withMessage("Enter primary address"),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      username,
      email,
      password,
      role,
      forgotCode,
      primaryNumber,
      secondaryNumber,
      primaryAddress,
      secondaryAddress,
    } = req.body;
    // return res.status(200).json(parseInt(phoneNumber, 10));

    try {
      const user = await usersM.findOne({ where: { email: email } });
      if (user) {
        return res.status(409).send("user already exists");
      }

      const hashPass = await bcrypt.hash(password, 10);
      await usersM.create({
        full_name: username,
        email: email,
        password: hashPass,
        role: role,
        forget_code: forgotCode,
        primary_number: parseInt(primaryNumber, 10),
        secondary_number: parseInt(secondaryNumber, 10),
        primary_address: primaryAddress,
        secondary_address: secondaryAddress,
      });
      return res.status(200).json({
        message: `user '${username}' created`,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error: " + err,
      });
    }
  }
);

auth.post(
  "/forgot",
  [
    body("email").isEmail().withMessage("Use a correct email address"),
    body("newPass").notEmpty().withMessage("enter a new password"),
    body("forgotCode").notEmpty().withMessage("enter the forgot code"),
  ],
  async (req, res) => {
    try {
      const { email, forgotCode, newPass } = req.body;

      const user = await usersM.findOne({ where: { email: email } });

      if (!user || user.forget_code !== forgotCode) {
        return res.status(401).send("Invalid email or forgot code");
      }

      const salt = 12;
      const hashPass = await bcrypt.hash(newPass, salt);

      await usersM.update({ password: hashPass }, { where: { id: user.id } });

      res.status(200).send("Password changed successfully");
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).send("Internal server error");
    }
  }
);

module.exports = auth;
