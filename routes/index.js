const express = require("express");
const index = express.Router();
const Auth = require("./auth");
const Projects = require("./project");
const User = require("./user");

index.use("/", Auth);
index.use("/", Projects);
index.use("/", User);

module.exports = index;
