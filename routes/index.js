const express = require("express");
const index = express.Router();
const Auth = require("./auth");
const Projects = require("./project");
const User = require("./user");
const Report = require("./report")


// Middleware setup (if needed)
 index.use(express.json()); // for parsing application/json
index.use("/", Auth);
index.use("/", Projects);
index.use("/", User);
index.use("/",Report)

module.exports = index;
