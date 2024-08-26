const express = require("express");
const projects = express.Router();
const { projectsM } = require("../models/projectsM");
const { ProjectMembersM } = require("../models/project.membersM");
const { usersM } = require("../models/usersM");
const {
  keyAuthenticator,
  checkInAuthenticator,
  validationAuthenticator,
} = require("../middlewares/authenticator");
const { body } = require("express-validator");
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
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;

    const {
      name,
      owned_by,
      status,
      budget,
      progress,
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

      if (url || req.file) {
        try {
          await projectAttachmentsM.create({
            project_id: newProject.id,
            url: url ? url : null,
            file: req.file ? req.file.path : null,
          });
        } catch (err) {
          return res.status(500).json({
            message: "project attachment error: " + err,
          });
        }
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
  "/project/update",
  upload.single("file"),
  [body("id").notEmpty().withMessage("please provide the project id")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    // const user = req.user;

    const {
      // created_by,
      // owned_by,
      id,
      name,
      status,
      budget,
      progress,
      url,
      description,
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
        file: req.file ? req.file.path : null,
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
          file: req.file ? req.file.path : null,
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
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
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
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
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
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { id, userId } = req.body;

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

projects.get("/project/report/:id", async (req, res) => {
  // project details
  // user involvement
  // tasks and details

  const id = req.params.id;
  const project = await projectsM.findOne({ where: { id: id } });
  const task = await project.getTasks(); // number of tasks
  var taskCompleted = "";
  task.forEach((element) => {
    element.status == 2 ? ++taskCompleted : "";
    // console.log(element.status);
  });
  const projectMembersCount = (await project.getUsers()).length;

  return res.json({
    projectDetails: project,
    projectMembers: projectMembersCount,
    taskCount: task.length,
    tasksCompleted: "completed: " + taskCompleted,
  });

  return res.send(projectMembers);
});

module.exports = projects;
