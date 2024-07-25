const express = require("express");
const passport = require("passport");
const projects = express.Router();
const { projectsM } = require("../models/projectsM");
const { Projects_Assigned } = require("../models/projectAssignedM");
const { usersM } = require("../models/usersM");
const { key_authenticator } = require("../middlewares/user_authenticator");

projects.get("/projects", key_authenticator, async (req, res, next) => {
  /* 
        if (user.role === "manager") {
          const user_projects = await user.getProjects();
          return res.json({
            message: "Welcome, " + user.full_name,
            projects: user_projects,
          });
        }

        if (user.role === "employee") {
          const assigned_projects = await Projects_Assigned.findAll({
            where: { user_id: user.id },
          });
          return res.json({
            message: "Welcome, " + user.full_name,
            projects: assigned_projects,
          });
        }
         */
  const user = req.user;

  try {
    const user_projects = await user.getProjects();
    const assigned_projects = await Projects_Assigned.findAll({
      where: {
        user_id: user.id,
      },
    });
    return res.status(200).json({
      message: "Welcome, " + user.full_name,
      assigned_projects: assigned_projects,
      projects: user_projects,
    });
  } catch (error) {
    return console.error(error);
  }
});

projects.post("/project/add", key_authenticator, async (req, res, next) => {
  const user = req.user;
  try {
    await projectsM.create({
      name: req.body.name,
      user_id: user.id,
      user_type: user.role,
    });
    // const user_projects = await user.getProjects();    // getting the projects this user has
    // res.status(200).json({ message: user_projects });
    return res.status(201).json({ message: "project was added" });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).send("Error creating project");
  }
});

projects.post("/project/edit", key_authenticator, (req, res, next) => {
  const user = req.user;
  const { id, name } = req.body;

  projectsM
    .update({ name: name, edited_by: user.id }, { where: { id: id } })
    .then(() => {
      return res.status(200).send("Project Updated");
    })
    .catch((error) => {
      console.error("Error updating project:", error);
      return res.status(500).send("Error updating project");
    });
});

projects.delete(
  "/project/delete",
  key_authenticator,
  async (req, res, next) => {
    const { id } = req.body;

    projectsM
      .destroy({ where: { id: id } })
      .then((done) => {
        if (done) {
          return res.status(200).send("Project Deleted");
        } else {
          return res.status(404).send("Project not found");
        }
      })
      .catch((error) => {
        console.error("Error deleting project:", error);
        return res.status(500).send("Error deleting project");
      });
  }
);

projects.post("/project/status", key_authenticator, async (req, res, next) => {
  const { status, id } = req.body;
  console.log(id);

  const project = await projectsM.findOne({
    where: { id: id },
  });

  try {
    project
      .update({
        status: status,
      })
      .then(() => {
        return res.status(200).send("Status Changed to " + status);
      });
  } catch (error) {
    res.status(500).send("Error Changing the status");
  }
});

projects.post("/project/assign", key_authenticator, async (req, res, next) => {
  const { id, userId } = req.body;
  console.log(userId + " " + id);
  const getProject = await projectsM.findOne({
    where: { id: id },
  });
  const getUser = await usersM.findOne({ where: { id: userId } });

  try {
    Projects_Assigned.create({
      project_id: getProject.id,
      user_id: getUser.id,
      user_type: getUser.role,
    }).then(() => {
      return res.status(200).send("User Assigned");
    });
  } catch (error) {
    res.status(500).send("Assigning User to Project Error");
  }
});

module.exports = projects;
