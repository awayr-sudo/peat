const express = require("express");
const Index = express.Router();
const Auth = require("./auth");
const Projects = require("./project");
const User = require("./user");
const Report = require("./report");
const Tasks = require("./tasks");

Index.use(express.json()); // for parsing application/json
Index.use("/", Auth);
Index.use("/", Projects);
Index.use("/", User);
Index.use("/", Report);
Index.use("/", Tasks);

// if the tables are not made in the db
// then it can be because of some deadlock
// or related errors causing the execution to hold

module.exports = Index;
