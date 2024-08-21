const express = require("express");
const subTask = express.Router();
const {
  keyAuthenticator,
  checkInAuthenticator,
  validationAuthenticator,
} = require("../middlewares/authenticator");
const { body } = require("express-validator");
const { subTaskM } = require("../models/sub.tasksM");

const multer = require("multer");
const { projectActivityM } = require("../models/project.activity");
const { tasksM } = require("../models/tasksM");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const subTaskProjectActivity = async (
  path,
  user,
  action,
  subTaskModule,
  subMainProject,
  subMainTaskName,
  assign
) => {
  const subTaskActivity = assign
    ? `${path} with name ${subTaskModule.name} ${action} by ${user.full_name} in ${subMainTaskName} of ${subMainProject.name} to ${assign}`
    : `${path} with name ${subTaskModule.name} ${action} by ${user.full_name} in ${subMainTaskName} of ${subMainProject.name}`;

  try {
    await projectActivityM.create({
      project_id: subMainProject.id,
      user_id: user.id,
      activity: action,
      details: subTaskActivity,
    });
  } catch (err) {
    console.log(err.message);
  }
};

const countFields = async (project, task) => {
  if (project) {
    const taskCount = await tasksM.count({
      where: { project_id: project.id },
    });

    await project.update({ all_tasks: taskCount });
    return taskCount;
  } else if (task) {
    const subTaskCount = await subTaskM.count({
      where: { parent_task_id: task.id },
    });

    await task.update({ sub_tasks: subTaskCount });
    return subTaskCount;
  }
  return null;
};

const countComments = async (task, subTask) => {
  if (task) {
    const taskCommentCount = await commentsM.count({
      where: { task_id: task.id, sub_task_id: null },
    });

    await tasksM.update(
      {
        comments: taskCommentCount,
      },
      {
        where: {
          id: task.id,
        },
      }
    );
  } else if (subTask) {
    const subTaskCommentsCount = await commentsM.count({
      where: {
        task_id: subTask.parent_task_id,
        sub_task_id: subTask.id,
      },
    });
    await subTaskM.update(
      {
        comments: subTaskCommentsCount,
      },
      {
        where: {
          id: subTask.id,
        },
      }
    );
  }
};

// working correctly
subTask.get(
  "/sub-task/:id",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { id } = req.params;
    const allSubTasks = await subTaskM.findAll({
      where: { parent_task_id: id },
    });
    return res.status(200).json(allSubTasks);
  }
);

// working correctly
subTask.post(
  "/create-sub-task/:id", // parent task / sub task id  1 | 6
  [
    body("name").isEmpty().withMessage("Enter task name"),
    body("estimatedDate").isEmpty().withMessage("Enter estimated date"),
    body("dueDate").isEmpty().withMessage("Enter due date"),
  ],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,

  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    const parentTaskId = req.params.id;
    const {
      name,
      status,
      progress,
      estimatedDate,
      dueDate,
      description,
      subTaskId, // parent_task_id of sub task ? then the creation is of sub task and in self table
    } = req.body;
    const parentTaskExist = subTaskId
      ? await subTaskM.findOne({
          where: { id: parentTaskId, parent_task_id: subTaskId },
        })
      : await tasksM.findOne({
          where: { id: parentTaskId },
        });
    if (!parentTaskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    try {
      const subTaskAdded = await subTaskM.create({
        parent_task_id: subTaskId ? null : parentTaskId,
        parent_sub_task_id: subTaskId ? parentTaskExist.id : null,
        name: name,
        status: status,
        progress: progress,
        estimated_date: estimatedDate,
        due_date: dueDate,
        file: req.file ? req.file.path : null,
        description: description,
      });

      /*       countFields(null, parentTaskExist);
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "created"),
        subTaskAdded,
        (subMainTaskProject = await parentTaskExist.getProject()),
        (subMainTaskName = parentTaskExist.name)
      ); */
      return res.status(201).json({
        message: "sub task created",
        subTaskId: subTaskAdded.id,
        file: subTaskAdded.file,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

subTask.delete(
  "/delete-sub-task/:id",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res
        .status(404)
        .json({ message: "sub task does not exist with this id" });
    }
    const mainProject = await (await subTaskExist.getTasks()).getProject();
    const assignedUsers = [
      subTaskExist.assigned_user1,
      subTaskExist.assigned_user2,
      subTaskExist.assigned_user3,
    ];

    if (user.id != mainProject.created_by && !assignedUsers.includes(user.id)) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this sub task" });
    }
    try {
      await subTaskExist.destroy();

      await countFields(null, await subTaskExist.getTasks());
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "deleted"),
        subTaskExist,
        (subMainTaskProject = await (
          await subTaskExist.getTasks()
        ).getProject()),
        (subMainTaskName = (await subTaskExist.getTasks()).name)
      );

      return res.status(200).json({
        message: "sub task deleted",
        parent_task: (await subTaskExist.getTasks()).id,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// working correctly
subTask.post(
  "/sub-task-isdone/:id",
  keyAuthenticator,
  checkInAuthenticator,
  [body("isDone").notEmpty().withMessage("select a valid action")],
  validationAuthenticator,
  async (req, res) => {
    const subTaskId = req.params.id;
    const { isDone } = req.body;
    const user = req.user;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });

    if (!subTaskExist) {
      return res.status(404).json({ message: "No task found with this id" });
    }

    const mainProject = await (await subTaskExist.getTasks()).getProject();
    const assignedUsers = [
      subTaskExist.assigned_user1,
      subTaskExist.assigned_user2,
      subTaskExist.assigned_user3,
    ];

    if (user.id != mainProject.created_by && !assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "you are not authorized to change task state",
      });
    }

    if (subTaskExist.is_done == isDone) {
      return res.status(409).json({
        message: `task id: ${subTaskId} is already marked as ${isDone}`,
      });
    }

    try {
      subTaskExist.update({ is_done: isDone });
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = isDone == 0 ? "marked as undone" : "marked as done"),
        subTaskExist.name,
        (subTaskModule = await subTaskExist.getTasks())
      );
      return res
        .status(200)
        .json({ message: `task id: ${subTaskId} marked as ${isDone}` });
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }
);

// working correctly
subTask.post(
  "/sub-task-priority/:id",
  [body("priority").notEmpty().withMessage("Please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const { priority } = req.body;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res.status(404).json({ message: "No task found with this id" });
    }
    const assignedUsers = [
      subTaskExist.assigned_user1,
      subTaskExist.assigned_user2,
      subTaskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res
        .status(401)
        .json({ message: "You are not authorized to change task state" });
    }
    try {
      await subTaskExist.update({ priority: priority });
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = `priority marked as ${priority}`),
        subTaskExist.name,
        (subTaskModule = await subTaskExist.getTasks())
      );
      return res
        .status(200)
        .json({ message: `task id: ${subTaskId} marked as ${priority}` });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// working correctly
subTask.post(
  "/sub-task-status/:id",
  [body("status").notEmpty().withMessage("Please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const { status } = req.body;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res.status(404).json({ message: "No task found with this id" });
    }

    const assignedUsers = [
      subTaskExist.assigned_user1,
      subTaskExist.assigned_user2,
      subTaskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "You are not authorized to change task state",
      });
    }

    if (subTaskExist.status == status) {
      return res.status(409).json({
        message: `sub task id: ${subTaskId} is already marked as ${status}`,
      });
    }

    try {
      await subTaskExist.update({ status: status });
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = `status changed to ${status}`),
        subTaskExist.name,
        (subTaskModule = await subTaskExist.getTasks())
      );
      return res.status(200).json({
        message: `sub task id: ${subTaskId} marked as ${status}`,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// working correctly
subTask.post(
  "/add-sub-task-tag/:id",
  [body("tag").notEmpty().withMessage("Please provide a tag.")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const subTaskId = req.params.id;
    const user = req.user;
    const { tag } = req.body;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    if (subTaskExist.tag != null) {
      return res.status(404).json({
        message: "this task already has an existing tag",
      });
    }

    const assignedUsers = [
      subTaskExist.assigned_user1,
      subTaskExist.assigned_user2,
      subTaskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "You are not authorized to change task state",
      });
    }

    try {
      await subTaskExist.update({ tag: tag });
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "tagged"),
        subTaskExist,
        (subMainTaskProject = await subTaskExist.getTasks()),
        subTaskExist.parent_task_id
      );
      return res
        .status(200)
        .json({ message: `successfull tagged task id: ${subTaskId}` });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
);

// working correctly
subTask.post(
  "/edit-sub-task-tag/:id",
  [body("tag").notEmpty().withMessage("Please provide a tag.")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const { tag } = req.body;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    try {
      await subTaskExist.update({ tag: tag });
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "update tag"),
        subTaskExist,
        (subMainTaskProject = await subTaskExist.getTasks()),
        subTaskExist.parent_task_id
      );
      return res
        .status(200)
        .json({ message: `successfull tagged task id: ${subTaskId}` });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
);

// working correctly
subTask.delete(
  "/delete-sub-task-tag/:id",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }
    if (subTaskExist.tag == null) {
      return res.status(404).json({
        message: "this task does not have any tag",
      });
    }
    await subTaskExist.update({ tag: null });
    subTaskProjectActivity(
      req.path.split("/")[2],
      user,
      (action = "removed tag"),
      (subTaskModule = subTaskExist),
      (subMainProject = await (await subTaskExist.getTasks()).getProject()),
      (subMainTaskName = (await subTaskExist.getTasks()).name)
    );
    return res.status(200).json({
      // subTask: await subTaskExist.getTasks(),
      message: `successfull removed tag from task id: ${subTaskId}`,
    });
  }
);

// working correctly
subTask.post(
  "/update-sub-task/:id",
  keyAuthenticator,
  checkInAuthenticator,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const {
      name,
      status,
      progress,
      estimatedDate,
      dueDate,
      description,
      tag,
      priority,
      isDone,
    } = req.body;
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res
        .status(404)
        .json({ message: "sub-task does not exist with this id" });
    }

    const project = await (await subTaskExist.getTasks()).getProject();
    try {
      await subTaskM.update(
        {
          name: name,
          status: status,
          progress: progress,
          estimated_date: estimatedDate,
          due_date: dueDate,
          description: description,
          tag: tag,
          priority: priority,
          is_done: isDone,
          file: req.file ? req.file.path : subTaskExist.file,
        },
        {
          where: {
            id: subTaskId,
          },
        }
      );

      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "updated"),
        subTaskExist,
        project,
        subTaskExist.parent_task_id
      );

      res
        .status(200)
        .json({ message: `successfull updated task id: ${subTaskId}` });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
);

// working correctly
subTask.post(
  "/sub-task-assign/:id",
  [
    body("assignedTo")
      .notEmpty()
      .withMessage("please provide a user id to assign"),
  ],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const subTaskId = req.params.id;
    const { assignedTo } = req.body;
    // return res.send(req.body);
    const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
    if (!subTaskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    const assingedUsers = [
      subTaskExist.assigned_user1,
      subTaskExist.assigned_user2,
      subTaskExist.assigned_user3,
    ];

    if (assingedUsers.includes(parseInt(assignedTo))) {
      return res

        .status(409)
        .json({ message: "user already assigned to this task" });
    }

    const mainTask = await subTaskExist.getTasks();

    try {
      let condition = null || undefined;
      if (subTaskExist.assigned_user1 == condition) {
        await subTaskExist.update({ assigned_user1: assignedTo });
        subTaskProjectActivity(
          req.path.split("/")[2],
          user,
          (action = "assigned"),
          subTaskExist,
          (subMainTaskProject = await mainTask.getProject()),
          (subMainTaskName = mainTask.name),
          (assign = "1")
        );
        return res.status(200).json({ message: "user assigned to 1" });
      } else if (subTaskExist.assigned_user2 == condition) {
        await subTaskExist.update({ assigned_user2: assignedTo });
        subTaskProjectActivity(
          req.path.split("/")[2],
          user,
          (action = "assigned"),
          subTaskExist,
          (subMainTaskProject = await mainTask.getProject()),
          (subMainTaskName = mainTask.name),
          (assign = "2")
        );
        return res.status(200).json({ message: "user assigned to 2" });
      } else if (subTaskExist.assigned_user3 == condition) {
        await subTaskExist.update({ assigned_user3: assignedTo });
        subTaskProjectActivity(
          req.path.split("/")[2],
          user,
          (action = "assigned"),
          subTaskExist,
          (subMainTaskProject = await mainTask.getProject()),
          (subMainTaskName = mainTask.name),
          (assign = "3")
        );
        return res.status(200).json({ message: "user assigned to 3" });
      } else {
        return res
          .status(409)
          .json({ message: "task already assigned to multiple users" });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = subTask;
