const express = require("express");
const projects = express.Router();
const { projectsM } = require("../models/projectsM");
const { ProjectMembersM } = require("../models/project.membersM");
const { usersM } = require("../models/usersM");
const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const { body, validationResult } = require("express-validator");
const { projectAttachmentsM } = require("../models/project.attachmentsM");

const multer = require("multer");
const storage = multer.diskStorage({
  // this gives us full control of file storing
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

projects.post("/testing", upload.single("file"), async (req, res) => {
  return res.status(200).send(req.file.path);
});

projects.get(
  "/projects",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
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
  }
);

projects.post(
  "/project/add",
  upload.single("file"),
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
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const {
      name,
      owned_by,
      status,
      budget,
      priority,
      progress,
      file,
      url,
      description,
      start_date,
      end_date,
      deadline,
    } = req.body;

    const isExist = await projectsM.findOne({
      where: {
        name: name,
      },
    });

    if (isExist) {
      return res.status(409).json({ message: "Project already exists" });
    }

    try {
      const newProject = await projectsM.create({
        name: name,
        created_by: user.id,
        owned_by: owned_by,
        status: status,
        budget: budget,
        progress: progress,
        description: description,
        start_date: start_date,
        end_date: end_date,
        deadline: deadline,
      });
      try {
        await projectAttachmentsM.create({
          project_id: newProject.id,
          url: url,
          file: req.file.path,
        });
      } catch (err) {
        return res.status(500).json({
          message: "project attachment error: " + err,
        });
      }
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
  upload.single("file"),
  [body("id").notEmpty().withMessage("please provide the project id")],
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    // const user = req.user;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      // created_by,
      // owned_by,
      id,
      name,
      status,
      budget,
      progress,
      url,
      file,
      description,
      type,
      start_date,
      end_date,
      deadline,
    } = req.body;

    await projectsM.update(
      {
        name,
        // created_by,
        // owned_by,
        status,
        budget,
        progress,
        description,
        start_date,
        end_date,
        deadline,
      },
      { where: { id } }
    );

    await projectAttachmentsM
      .update(
        {
          url,
          file: req.file.path,
        },
        { where: { project_id: id } }
      )
      .catch((err) => {
        return res
          .status(500)
          .json({ message: "error in updating project attachments " + err });
      });

    return res.status(200).json({ message: "Project Updated" });
  }
);

projects.delete(
  "/project/delete",
  body("id").notEmpty().withMessage("please provide the project id"),
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { id } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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
  checkInAuthenticator,
  async (req, res) => {
    const { status, id } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
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
  checkInAuthenticator,
  async (req, res) => {
    const { id, userId } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    console.log(userId + " " + id);

    const alreadyExist = await ProjectMembersM.findOne({
      where: {
        project_id: id,
        user_id: userId,
      },
    });
    if (alreadyExist) {
      return res.status(200).send("User is already assigned to this project");
    }

    const getProject = await projectsM.findOne({
      where: { id: id },
    });
    const getUser = await usersM.findOne({ where: { id: userId } });

    try {
      console.log(getProject.id + " " + getUser.id);

      await ProjectMembersM.create({
        project_id: getProject.id,
        user_id: getUser.id,
        // user_type: getUser.role,
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

