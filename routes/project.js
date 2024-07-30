const express = require("express");
const projects = express.Router();
const { projectsM } = require("../models/projectsM");
const { ProjectMembersM } = require("../models/project.membersM");
const { usersM } = require("../models/usersM");
const { keyAuthenticator } = require("../middlewares/key.authenticator");
const { body, validationResult } = require("express-validator");

projects.get("/projects", keyAuthenticator, async (req, res, next) => {
  const user = req.user;

  try {
    const user_projects = await user.getProjects();
    const assigned_projects = await ProjectMembersM.findAll({
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

projects.post(
  "/project/add",
  [
    body("name").notEmpty().withMessage("enter project name"),
    body("owned_by").notEmpty().withMessage("enter who own the project"),
    body("type")
      .notEmpty()
      .withMessage(
        "enter project type, is it internal, external or a client project"
      ),
  ],
  keyAuthenticator,
  async (req, res, next) => {
    const user = req.user;
    const {
      name,
      created_by,
      owned_by,
      status,
      budget,
      priority,
      progress,
      attachments,
      description,
      type,
      start_date,
      end_date,
      deadline,
    } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await projectsM.create({
        name: name,
        created_by: user.id,
        owned_by: owned_by,
        type: type,
      });
      // const user_projects = await user.getProjects();    // getting the projects this user has
      // res.status(200).json({ message: user_projects });
      return res.status(201).json({ message: "project was added" });
    } catch (error) {
      console.error("Error creating project:", error);
      return res.status(500).send("Error creating project");
    }
  }
);

projects.post("/project/edit", keyAuthenticator, (req, res, next) => {
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

projects.delete("/project/delete", keyAuthenticator, async (req, res, next) => {
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
});

projects.post("/project/status", keyAuthenticator, async (req, res, next) => {
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

projects.post("/project/assign", keyAuthenticator, async (req, res, next) => {
  const { id, userId } = req.body;
  console.log(userId + " " + id);
  const getProject = await projectsM.findOne({
    where: { id: id },
  });
  const getUser = await usersM.findOne({ where: { id: userId } });

  try {
    ProjectMembersM.create({
      project_id: getProject.id,
      user_id: getUser.id,
      owned_by: getUser.role,
    }).then(() => {
      return res.status(200).send("User Assigned");
    });
  } catch (error) {
    res.status(500).send("Assigning User to Project Error");
  }
});

module.exports = projects;
