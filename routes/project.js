const express = require("express");
const projects = express.Router();
const { projectsM } = require("../models/projectsM");
const { ProjectMembersM } = require("../models/project.membersM");
const { usersM } = require("../models/usersM");
const { keyAuthenticator } = require("../middlewares/key.authenticator");
const { body, validationResult } = require("express-validator");

// not allow null
// name does not allow null
// created_by does not allow null
// owned_by does not allow null
// type does not allow null

// allow null
// status allows null
// budget allows null
// priority allows null
// progress allows null
// start_date allows null
// end_date allows null
// deadline allows null
// attachments allows null
// description allows null

projects.get("/projects", keyAuthenticator, async (req, res) => {
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
    return res.status(500).json({
      error: error,
    });
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
  async (req, res) => {
    const user = req.user;
    const {
      name,
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
        status: status,
        budget: budget,
        priority: priority,
        progress: progress,
        attachments: attachments,
        description: description,
        start_date: start_date,
        end_date: end_date,
        deadline: deadline,


      });
      // const user_projects = await user.getProjects();    // getting the projects this user has
      // res.status(200).json({ message: user_projects });
      return res.status(201).json({ message: "project was added" });
    } catch (error) {
      return res.status(500).json({
        message: "Error creating project",
        error: error,
      });
    }
  }
);

projects.post(
  "/project/edit",
  [body("id").notEmpty().withMessage("please provide the project id")],
  keyAuthenticator,
  (req, res) => {
    // const user = req.user;
    const { id, name } = req.body;

    const {
      // created_by,
      // owned_by,
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

    projectsM
      .update(
        {
          name,
          // created_by,
          // owned_by,
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
        },
        { where: { id } }
      )
      .then(() => {
        return res.status(200).json({ message: "Project Updated" });
      })
      .catch((error) => {
        return res
          .status(500)
          .json({ message: "Error updating project", error: error });
      });
  }
);

projects.delete(
  "/project/delete",
  body("id").notEmpty().withMessage("please provide the project id"),
  keyAuthenticator,
  async (req, res) => {
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
        return res
          .status(500)
          .json({ message: "Error deleting project", error: error });
      });
  }
);

projects.post(
  "/project/status",

  body("id").notEmpty().withMessage("please provide the project id"),
  body("status").notEmpty().withMessage("please provide the project status"),
  keyAuthenticator,
  async (req, res) => {
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
      res
        .status(500)
        .json({ message: "Error Changing the status", error: error });
    }
  }
);

projects.post(
  "/project/assign",
  body("id").notEmpty().withMessage("please provide the project id"),

  body("userId").notEmpty().withMessage("please provide the user Id"),

  keyAuthenticator,
  async (req, res) => {
    const { id, userId } = req.body;
    console.log(userId + " " + id);
    const getProject = await projectsM.findOne({
      where: { id: id },
    });
    const getUser = await usersM.findOne({ where: { id: userId } });

    try {
      await ProjectMembersM.create({
        project_id: getProject.id,
        user_id: getUser.id,
        user_type: getUser.role,
      }).then(() => {
        return res.status(200).send("User Assigned");
      });
    } catch (error) {
      res.status(500).json({
        message: "Assigning User to Project Error",
        error: error,
      });
    }
  }
);

module.exports = projects;
