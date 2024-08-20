const express = require("express");
const tasks = express.Router();
const { tasksM } = require("../models/tasksM");
const { projectsM } = require("../models/projectsM");
const { commentsM } = require("../models/commentsM");
const {
  keyAuthenticator,
  checkInAuthenticator,
  validationAuthenticator,
} = require("../middlewares/authenticator");
const { body } = require("express-validator");
const { subTaskM } = require("../models/sub.tasksM");

const multer = require("multer");
const { projectActivityM } = require("../models/project.activity");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const taskProjectActivity = async (
  path,
  user,
  action,
  taskName,
  taskProject,
  assign
) => {
  console.log(path, user, action, taskName);

  const assignActivity = assign
    ? `${path} with table name ${taskName} ${action} by ${user.full_name} to ${assign}`
    : `${path} with table name ${taskName} ${action} by ${user.full_name}`;

  /*     const module = path.split("-")[1];

    const assignActivity = assign
      ? `${module} with ${taskName} ${action} ${user.full_name} to ${assign}`
      : `${module} with name ${taskName} ${action} by ${user.full_name}`;
 */

  try {
    await projectActivityM.create({
      project_id: taskProject.id,
      user_id: user.id,
      activity: action,
      details: assignActivity,
    });
  } catch (err) {
    console.log(err.message);
  }

  /* const activity1 = assign
    ? `${path} with ${taskName} ${action} ${user} to ${assign}`
    : `${path} with name ${taskName} ${action} by ${user}`;
  const totalActivity = taskProject.activity
    ? `${taskProject.activity}, ${activity}`
    : `${activity}`;
  await taskProject.update({ activity: totalActivity }); */
};

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
tasks.get(
  "/project/task/:id",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { id } = req.params;
    const allTasks = await tasksM.findAll({ where: { project_id: id } });
    return res.status(200).json(allTasks);
  }
);

// working correctly
tasks.get(
  "/project/sub-task/:id",
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
tasks.post(
  "/project/add-task",
  [
    body("name").isEmpty().withMessage("Enter task name"),
    body("estimatedDate").isEmpty().withMessage("Enter estimated date"),
    body("dueDate").isEmpty().withMessage("Enter due date"),
    body("tag").isEmpty().withMessage("Enter a tag"),
  ],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;

    const {
      projectId,
      name,
      status,
      progress,
      estimatedDate,
      dueDate,
      description,
      tag,
    } = req.body;
    const project = await projectsM.findOne({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ message: "project not found" });
    }
    const taskAdded = await tasksM.create({
      project_id: projectId,
      name: name,
      status: status,
      progress: progress,
      estimated_date: estimatedDate,
      due_date: dueDate,
      file: req.file ? req.file.path : null,
      description: description,
      tag: tag,
    });
    taskProjectActivity(
      req.path.split("/")[2],
      user,
      (action = "created"),
      taskAdded.name,
      (taskProject = project)
    );
    countFields(project, null);

    return res.status(201).json({
      message: "task created",
      taskId: taskAdded.id,
      file: taskAdded.file,
    });
  }
);

// working correctly
tasks.post(
  "/project/add-sub-task",
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

    const {
      parentTaskId,
      name,
      status,
      progress,
      estimatedDate,
      dueDate,
      description,
    } = req.body;
    const parentTaskExist = await tasksM.findOne({
      where: { id: parentTaskId },
    });
    if (!parentTaskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    try {
      const subTaskAdded = await subTaskM.create({
        parent_task_id: parentTaskId,
        name: name,
        status: status,
        progress: progress,
        estimated_date: estimatedDate,
        due_date: dueDate,
        file: req.file ? req.file.path : null,
        description: description,
      });

      countFields(null, parentTaskExist);
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "created"),
        subTaskAdded,
        (subMainTaskProject = await parentTaskExist.getProject()),
        (subMainTaskName = parentTaskExist.name)
      );
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

tasks.post(
  "/project/delete-task",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { taskId } = req.body;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }
    const assignedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];
    if (!assignedUsers.includes(user.id)) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this task" });
    }

    try {
      await taskExist.destroy();

      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "deleted"),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      countFields(await taskExist.getProject());
      return res.status(200).json({ message: "task deleted" });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
);

tasks.post(
  "/project/delete-sub-task",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { subTaskId } = req.body;
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
tasks.post(
  "/project/task-isdone",
  keyAuthenticator,
  checkInAuthenticator,
  [body("isDone").notEmpty().withMessage("select a valid action")],
  validationAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { taskId, isDone } = req.body;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res.status(404).json({ message: "No task found with this id" });
    }
    const mainProject = await taskExist.getProject();
    const assignedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];
    if (user.id != mainProject.created_by && !assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "you are not authorized to change task state",
      });
    }
    if (taskExist.is_done == isDone) {
      return res.status(409).json({
        message: `task id: ${taskId} is already marked as ${isDone}`,
      });
    }

    try {
      taskExist.update({ is_done: isDone });
      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = isDone == 0 ? "marked as undone" : "marked as done"),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      return res
        .status(200)
        .json({ message: `task id: ${taskId} marked as ${isDone}` });
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }
);

// working correctly
tasks.post(
  "/project/sub-task-isdone",
  keyAuthenticator,
  checkInAuthenticator,
  [body("isDone").notEmpty().withMessage("select a valid action")],
  validationAuthenticator,
  async (req, res) => {
    const { subTaskId, isDone } = req.body;
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
tasks.post(
  "/project/task-priority",
  [body("priority").notEmpty().withMessage("please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { taskId, priority } = req.body;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res.status(404).json({ message: "No task found with this id" });
    }
    const assignedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "You are not authorized to change task state",
      });
    }
    try {
      await taskExist.update({ priority: priority });
      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = `marked as ${priority}`),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      return res
        .status(200)
        .json({ message: `task id: ${taskId} marked as ${priority}` });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// working correctly
tasks.post(
  "/project/sub-task-priority",
  [body("priority").notEmpty().withMessage("Please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { subTaskId, priority } = req.body;
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
        (action = `marked as ${priority}`),
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
tasks.post(
  "/project/task-status",
  [body("status").notEmpty().withMessage("Please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { taskId, status } = req.body;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res.status(404).json({ message: "No task found with this id" });
    }
    const assignedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "You are not authorized to change task state",
      });
    }

    if (taskExist.status == status) {
      return res
        .status(409)
        .json({ message: `task id: ${taskId} is already marked as ${status}` });
    }

    try {
      taskExist.update({ status: status });
      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = `status changed to ${status}`),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      return res
        .status(200)
        .json({ message: `task id: ${taskId} marked as ${status}` });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

// working correctly
tasks.post(
  "/project/sub-task-status",
  [body("status").notEmpty().withMessage("Please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { subTaskId, status } = req.body;
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
tasks.post(
  "/project/comment",
  [
    body("comment").notEmpty().withMessage("please provide a comment"),
    body("taskId")
      .if(body("subTaskId").not().exists())
      .notEmpty()
      .withMessage("please provide a valid task Id"),
    body("subTaskId")
      .if(body("taskId").not().exists())
      .notEmpty()
      .withMessage("please provide a valid sub task Id"),
  ],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;

    const { taskId, subTaskId, comment } = req.body;

    if (taskId) {
      const taskExist = await tasksM.findOne({ where: { id: taskId } });
      if (!taskExist) {
        return res.status(200).json({ message: "Task id does not exists" });
      } else {
        const assignedUsers = [
          taskExist.assigned_user1,
          taskExist.assigned_user2,
          taskExist.assigned_user3,
        ];

        if (!assignedUsers.includes(user.id)) {
          return res.status(200).json({
            message: "User is not assigned to this task",
          });
        }
        try {
          const addedComment = await commentsM.create({
            task_id: taskId,
            user_id: user.id,
            comment: comment,
          });
          countComments(taskExist, null);
          taskProjectActivity(
            req.path.split("/")[2],
            user,
            (action = "commented"),
            taskExist.name,
            (taskModule = await taskExist.getProject())
          );
          return res.status(201).json({ comment: addedComment });
        } catch (error) {
          return res.status(500).json(error.message);
        }
      }
    }

    if (subTaskId && taskId == undefined) {
      const subTaskExist = await subTaskM.findOne({ where: { id: subTaskId } });
      if (!subTaskExist) {
        return res.status(200).json({ message: "Sub Task id does not exists" });
      } else {
        const assignedUsers = [
          subTaskExist.assigned_user1,
          subTaskExist.assigned_user2,
          subTaskExist.assigned_user3,
        ];

        if (!assignedUsers.includes(user.id)) {
          return res.status(200).json({
            message: "User is not assigned to this task",
          });
        }

        try {
          const subCommentAdded = await commentsM.create({
            task_id: subTaskExist.parent_task_id,
            sub_task_id: subTaskId,
            user_id: user.id,
            comment: comment,
          });
          countComments(null, subTaskExist);
          subTaskProjectActivity(
            req.path.split("/")[2],
            user,
            (action = "commented"),
            subTaskExist,
            (subMainTaskProject = await (
              await subTaskExist.getTasks()
            ).getProject()),
            (subMainTaskName = (await subTaskExist.getTasks()).name)
          );
          return res.status(201).json({ comment: subCommentAdded });
        } catch (err) {
          return res.status(500).json({ sub_task: err });
        }
      }
    }
  }
);

/* tasks.post("/project/test", async (req, res) => {
  // const project = await projectsM.findOne({where:{id: 6}})
  await projectsM.truncate({ force: true });
}); */

// working correctly
tasks.post(
  "/project/update-comment",
  [body("comment").notEmpty().withMessage("Please provide a comment.")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { commentId, comment } = req.body;

    if (commentId) {
      const commentExist = await commentsM.findOne({
        where: { id: commentId },
      });

      /*     return res.json({
      taskExist: await taskExist.getTask(),
      taskCom: await taskCom.getTaskCount(),
    }); */
      if (!commentExist) {
        return res.status(200).json({ message: "comment id does not exists" });
      }

      if (commentExist.user_id != user.id) {
        return res
          .status(401)
          .json({ message: "You are not authorized to delete this comment" });
      }

      try {
        await commentExist.update({
          comment: comment,
          is_edited: comment
            ? parseInt(commentExist.is_edited) + 1
            : commentExist.is_edited,
        });

        subTaskProjectActivity(
          req.path.split("/")[2],
          user,
          (action = "update comment"),
          commentExist,
          (subMainTaskProject = await commentExist.getTask()),
          (subMainTaskName = (await commentExist.getTask()).name)
        );

        return res.status(200).json({ comment: commentExist.comment });
      } catch (error) {
        return res.status(500).json(error.message);
      }
    }
  }
);

tasks.post(
  "/project/delete-comment",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { commentId } = req.body;
    const user = req.user;
    const commentExist = await commentsM.findOne({ where: { id: commentId } });
    if (!commentExist) {
      return res.status(200).json({ message: "comment id does not exists" });
    }
    // return res.send((await (await commentExist.getTask()).getTaskCount()));

    if (commentExist.user_id != user.id) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this comment" });
    }
    try {
      await commentExist.destroy();
      if (commentExist.task_id != null) {
        countComments(await commentExist.getTask());
      }
      if (commentExist.sub_task_id != null) {
        countComments(null, await commentExist.getSubTask());
      }
      subTaskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "deleted comment"),
        commentExist,
        (subMainTaskProject = await commentExist.getTask()),
        (subMainTaskName = (await commentExist.getTask()).name)
      );
      return res.status(200).json({ message: "comment deleted" });
    } catch (error) {
      return res.status(500).json(error.message);
    }
  }
);

// working correctly
tasks.post(
  "/project/add-task-tag",
  [body("tag").notEmpty().withMessage("Please provide a tag")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { taskId, tag } = req.body;
    const user = req.user;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }
    if (taskExist.tag != null) {
      return res.status(404).json({
        message: "this task already has an existing tag",
      });
    }

    const assignedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "You are not authorized to change task state",
      });
    }

    try {
      await taskExist.update({ tag: tag });
      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "tagged"),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      countFields(taskExist);
      return res
        .status(200)
        .json({ message: `successfull tagged task id: ${taskId}` });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// working correctly
tasks.post(
  "/project/edit-task-tag",
  [body("tag").notEmpty().withMessage("Please enter a tag")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { taskId, tag } = req.body;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    const assignedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];

    if (!assignedUsers.includes(user.id)) {
      return res.status(401).json({
        message: "You are not authorized to change task state",
      });
    }

    try {
      await taskExist.update({ tag: tag });
      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "tagged"),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      return res
        .status(200)
        .json({ message: `successfull tagged task id: ${taskId}` });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
);

// working correctly
tasks.post(
  "/project/add-sub-task-tag",
  [body("tag").notEmpty().withMessage("Please provide a tag.")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { subTaskId, tag } = req.body;
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
tasks.post(
  "/project/edit-sub-task-tag",
  [body("tag").notEmpty().withMessage("Please provide a tag.")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { subTaskId, tag } = req.body;
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
tasks.delete(
  "/project/delete-task-tag",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { taskId } = req.body;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }
    if (taskExist.tag == null) {
      return res.status(404).json({
        message: "this task does not have any tag",
      });
    }
    try {
      await taskExist.update({ tag: null });
      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "removed tag"),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      countFields(await taskExist.getProject());
      return res
        .status(200)
        .json({ message: `successfull removed tag from task id: ${taskId}` });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// working correctly
tasks.delete(
  "/project/delete-sub-task-tag",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const { subTaskId } = req.body;
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
      subTask: await subTaskExist.getTasks(),
      message: `successfull removed tag from task id: ${subTaskId}`,
    });
  }
);

// UPDATE ROUTES

// working correctly
tasks.post(
  "/project/update-task",
  keyAuthenticator,
  checkInAuthenticator,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    const {
      taskId,
      name,
      status,
      progress,
      estimated_date,
      due_date,
      priority,
      description,
      tag,
      isDone,
    } = req.body;

    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }
    try {
      const updatedTask = await tasksM.update(
        {
          name: name,
          status: status,
          progress: progress,
          estimated_date: estimated_date,
          due_date: due_date,
          priority: priority,
          file: req.file ? req.file.path : taskExist.file,
          description: description,
          tag: tag,
          is_done: isDone,
        },
        {
          where: {
            id: taskId,
          },
        }
      );

      taskProjectActivity(
        req.path.split("/")[2],
        user,
        (action = "updated"),
        taskExist.name,
        (taskModule = await taskExist.getProject())
      );
      res
        .status(200)
        .json({ message: `successfull updated task id: ${taskId}` });
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
);

// working correctly
tasks.post(
  "/project/update-sub-task",
  keyAuthenticator,
  checkInAuthenticator,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    const {
      subTaskId,
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

// ASSIGN ROUTES

// working correctly
tasks.post(
  "/project/task-assign",
  [
    body("assignedTo")
      .notEmpty()
      .withMessage("Please provide a assigned to id"),
  ],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const { taskId, assignedTo } = req.body;
    const user = req.user;
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res
        .status(404)
        .json({ message: "task does not exist with this id" });
    }

    const assingedUsers = [
      taskExist.assigned_user1,
      taskExist.assigned_user2,
      taskExist.assigned_user3,
    ];
    // return res.send(assingedUsers.includes(parseInt(assignedTo)));
    // return res.send(assingedUsers)
    if (assingedUsers.includes(parseInt(assignedTo))) {
      return res
        .status(409)
        .json({ message: "user already assigned to this task" });
    }

    try {
      let condition = null || undefined;
      if (taskExist.assigned_user1 == condition) {
        await taskExist.update({ assigned_user1: assignedTo });

        taskProjectActivity(
          req.path.split("/")[2],
          user,
          (action = "assigned"),
          taskExist.name,
          (taskModule = await taskExist.getProject()),
          (assign = "1")
        );
        return res.status(200).json({ message: "user assigned to 1" });
      } else if (taskExist.assigned_user2 == condition) {
        await taskExist.update({ assigned_user2: assignedTo });
        taskProjectActivity(
          req.path.split("/")[2],
          (user = "req.user"),
          (action = "assigned"),
          taskExist.name,
          (taskModule = await taskExist.getProject()),
          (assign = "2")
        );
        return res.status(200).json({ message: "user assigned to 2" });
      } else if (taskExist.assigned_user3 == condition) {
        await taskExist.update({ assigned_user3: assignedTo });
        taskProjectActivity(
          req.path.split("/")[2],
          (user = "req.user"),
          (action = "assigned"),
          taskExist.name,
          (taskModule = await taskExist.getProject()),
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

// working correctly
tasks.post(
  "/project/sub-task-assign",
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
    const { subTaskId, assignedTo } = req.body;
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

module.exports = tasks;
