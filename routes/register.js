const express = require("express");
const { usersM } = require("../models/usersM");
const bcrypt = require("bcryptjs");
const register = express.Router();

register.post("/register", async (req, res) => {
  const { username, email, password, role, key } = req.body;
  // using promise here because we don't know how many requests could be sent to db
  // and eventually might drop or cause stop of db
  try {
    const hashPass = await bcrypt.hash(password, 10);
    const user = await usersM.findOne({ where: { full_name: username } });
    if (user) {
      return res.send("user already exists");
    } else {
      await usersM.create({
        full_name: username,
        email: email,
        password: hashPass,
        role: role,
        forget_code: key,
      });
    }
  } catch (err) {
    console.log(err);
  }
  res.status(200).json({
    message: `hello ${req.body.username} with '${req.body.password}' password and role of ${req.body.role} and secret key ${req.body.secretKey}`,
  });
});

register.post("/find", (req, res) => {
  const username = req.body.username;
  usersM.findOne({ where: { name: username } }).then((user) => {
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(403).send("user not found");
    }
  });
});

register.post("/forgot", async (req, res) => {
  try {
    const { username, key, newPass } = req.body;

    // may need proper validation on almost all the routes

    // Find user by full_name (consider using email instead for better security)
    const user = await usersM.findOne({ where: { full_name: username } });

    // Check if user exists and forget_code matches
    if (!user || user.forget_code !== key) {
      return res.status(401).send("Invalid username or key"); // Avoid revealing specific error
    }

    // Validate new password strength (optional but highly recommended)
    // Implement a password strength check using a library like zxcvbn

    // Hash the new password with a secure hashing algorithm
    const salt = 12;
    const hashedPassword = await bcrypt.hash(newPass, salt);

    // Update user password in the database
    await usersM.update(
      { password: hashedPassword },
      { where: { id: user.id } }
    );

    // Invalidate the forget_code to prevent reuse
    await usersM.update({ forget_code: "null" }, { where: { id: user.id } });

    res.status(200).send("Password changed successfully"); 
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Internal server error"); 
  }
});

module.exports = register;
