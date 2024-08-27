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
const { body, param } = require("express-validator");
const { projectAttachmentsM } = require("../models/project.attachmentsM");

const multer = require("multer");
const { Op } = require("sequelize");
const { projectActivityM } = require("../models/project.activity");
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
  "/project/update/:id",
  upload.single("file"),
  // [param("id").notEmpty().withMessage("please provide the project id")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    // const user = req.user;
    const id = req.params.id;
    const {
      // created_by,
      // owned_by,
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
  "/project/:id/assign",
  param("id").notEmpty().withMessage("please provide the project id"),

  body("userId").notEmpty().withMessage("please provide the user Id"),
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const id = req.params.id;
    const { userId } = req.body;

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
    if (!getUser) {
      return res.status(404).send("User not found");
    }

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
        error: error.message,
      });
    }
  }
);

projects.get("/project/report/:id", async (req, res) => {
  // project details
  // user involvement
  // tasks and details

  const id = req.params.id;
  const { startDate, endDate } = req.body;
  // return res.send(startDate + " " + new Date().toDateString());

  const project = await projectsM.findOne({ where: { id: id } });
  const tasks = await project.getTasks(); // number of tasks
  var taskNotStarted = "";
  var taskInProgress = "";
  var taskCompleted = "";
  var weekCompletedTasks = "";
  var weekNotStartedTasks = "";
  var weekInProgressTasks = "";
  var unassignedTasks = "";
  const weekStartTime = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() - 7,
    23,
    59,
    59
  );
  const generalPriority = [];
  const mediumPriority = [];
  const highPriority = [];
  const weekGeneralPriority = [];
  const weekMediumPriority = [];
  const weekHighPriority = [];

  const startSplit = startDate ? startDate.split("/") : "";
  const endSplit = endDate ? endDate.split("/") : "";
  startSplit[1] != 0 ? --startSplit[1] : "";

  const opBetween = [
    startDate
      ? new Date(startSplit[0], startSplit[1], startSplit[2], 0, 0, 0)
      : weekStartTime,
    endDate
      ? new Date(endSplit[0], endSplit[1], endSplit[2], 23, 59, 59)
      : new Date(),
  ];

  // return res.send(opBetween);

  const createdTasks = await project.getTasks({
    where: {
      created_at: { [Op.between]: opBetween },
    },
  });

  // return res.send(opBetween);

  const dueTasks = await project.getTasks({
    where: {
      due_date: { [Op.between]: opBetween },
    },
  });

  dueTasks.forEach((element) => {
    element.priority == 0 ? weekGeneralPriority.push(element) : "";
    element.priority == 1 ? weekMediumPriority.push(element) : "";
    element.priority == 2 ? weekHighPriority.push(element) : "";
  });

  tasks.forEach((element) => {
    element.status == 0 ? ++taskNotStarted : "";
    element.status == 1 ? ++taskInProgress : "";
    element.status == 2 ? ++taskCompleted : "";
    element.assigned_user1 === null &&
    element.assigned_user2 === null &&
    element.assigned_user3 === null
      ? ++unassignedTasks
      : "";
    element.priority == 0 ? generalPriority.push(element) : "";
    element.priority == 1 ? mediumPriority.push(element) : "";
    element.priority == 2 ? highPriority.push(element) : "";

    // console.log(element.status);
  });

  createdTasks.forEach((element) => {
    element.status == 0 ? ++weekNotStartedTasks : "";
    element.status == 1 ? ++weekInProgressTasks : "";
    element.status == 2 ? ++weekCompletedTasks : "";
  });

  const projectMembersCount = (await project.getUsers()).length;
  const projectActivity = await projectActivityM.findAll({
    where: {
      project_id: id,
    },
    created_at: { [opBetween]: opBetween },
  });

  return res.json({
    projectDetails: project,
    projectMembers: projectMembersCount,
    totalTaskCount: tasks.length,
    totalUnassignedTasks: unassignedTasks,
    totalWorkLoad: {
      notStarted: taskNotStarted ? taskNotStarted : 0,
      inProgress: taskInProgress ? taskInProgress : 0,
    },
    completedTasks: taskCompleted ? taskCompleted : 0,
    totalPriorityTasks: {
      general: generalPriority.length ? generalPriority.length : 0,
      medium: mediumPriority.length ? mediumPriority.length : 0,
      high: highPriority.length ? highPriority.length : 0,
    },
    selectedTimeSpan: [
      { createdTasks: createdTasks.length },
      { dueTasks: dueTasks.length },
      {
        tasksPriority: {
          general: weekGeneralPriority.length ? weekGeneralPriority.length : 0,
          medium: weekMediumPriority.length ? weekMediumPriority.length : 0,
          high: weekHighPriority.length ? weekHighPriority.length : 0,
        },
      },
      {
        tasksStatus: {
          notStarted: weekNotStartedTasks ? weekNotStartedTasks : 0,
          inProgress: weekInProgressTasks ? weekInProgressTasks : 0,
          completed: weekCompletedTasks ? weekCompletedTasks : 0,
        },
      },
    ],
    projectActivity: projectActivity,
  });
});

//   return res.json({
//     projectDetails: project,
//     projectMembers: projectMembersCount,
//     taskCount: tasks.length,

//     unassignedTasks: unassignedTasks,
//     workLoad: {
//       tasksNotStarted: taskNotStarted ? taskNotStarted : 0,
//       tasksInProgress: taskInProgress ? taskInProgress : 0,
//     },
//     tasksCompleted: taskCompleted ? taskCompleted : 0,
//     totalPriorityTasks: {},
//     thisWeek: [
//       { CreatedTasks: createdTasks.length },
//       { DueTasks: dueTasks.length },
//       {
//         thisWeekPriorityTasks: {
//           general: weekGeneralPriority ? weekGeneralPriority : 0,
//           medium: weekMediumPriority ? weekMediumPriority : 0,
//           high: weekHighPriority ? weekHighPriority : 0,
//         },
//       },
//     ],

//     projectActivity: projectActivity,
//   });
// });

module.exports = projects;
