const express = require("express");
const Index = express.Router();
const Auth = require("./auth");
const Projects = require("./project");
const User = require("./user");
const Report = require("./report");

Index.use(express.json()); // for parsing application/json
Index.use("/", Auth);
Index.use("/", Projects);
Index.use("/", User);
Index.use("/", Report);

module.exports = Index;
