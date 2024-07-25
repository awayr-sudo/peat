const express = require("express");
const auth = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { usersM } = require("../models/usersM");
const {
  user_authenticator,
  key_authenticator,
} = require("../middlewares/user_authenticator");

auth.post("/login", user_authenticator, async (req, res) => {
  user = req.user;
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
});

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
    const { username, key, newPass } = req.body;

    const user = await usersM.findOne({ where: { full_name: username } });

    if (!user || user.forget_code !== key) {
      return res.status(401).send("Invalid username or key");
    }

    const salt = 12;
    const hashPass = await bcrypt.hash(newPass, salt);

    await usersM.update({ password: hashPass }, { where: { id: user.id } });

    await usersM.update({ forget_code: "null" }, { where: { id: user.id } });

    res.status(200).send("Password changed successfully");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = auth;
