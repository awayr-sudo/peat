const express = require("express");
const { usersM } = require("../models/usersM");
const auth = express.Router();
const register = require("./register");
const login = require("./login");
const Projects = require("./project");
const user = require("./user");

auth.use("/", login);
auth.use("/", register);
auth.use("/", Projects);
auth.use("/", user);

auth.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/success");
  } else {
    res.render("login", { title: "Login page" });
  }
});

auth.post("/forgot", async (req, res) => {
  const username = req.body.username;
  const isUser = await usersM.findOne({ where: { name: username } });
  if (isUser) {
    res.send("user exists");
  } else {
    res.send("user does not exist");
  }
});

module.exports = auth;
