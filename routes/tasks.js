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
const { tagsM } = require("../models/tagsM");
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
tasks.post(
  "/create-task/:id",
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
    const projectId = req.params.id;

    const { name, status, progress, estimatedDate, dueDate, description, tag } =
      req.body;
    const project = await projectsM.findOne({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ message: "project not found" });
    }
    try {
      const taskAdded = await tasksM.create({
        project_id: projectId,
        name: name,
        status: status,
        progress: progress,
        estimated_date: estimatedDate,
        due_date: dueDate,
        file: req.file ? req.file.path : null,
        description: description,
      });

      tag
        ? await tagsM.create({
            object_id: taskAdded.id,
            tag: tag,
          })
        : "";

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
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

tasks.post(
  "/delete-task/:id",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const taskId = req.params.id;
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

// working correctly
tasks.post(
  "/task-isdone/:id",
  keyAuthenticator,
  checkInAuthenticator,
  [body("isDone").notEmpty().withMessage("select a valid action")],
  validationAuthenticator,
  async (req, res) => {
    const user = req.user;
    const taskId = req.params.id;
    const { isDone } = req.body;
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
  "/task-priority/:id",
  [body("priority").notEmpty().withMessage("please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const taskId = req.params.id;
    const user = req.user;
    const { priority } = req.body;
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
        (action = `priority marked as ${priority}`),
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
  "/project/task-status",
  [body("status").notEmpty().withMessage("Please select a valid action")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const taskId = req.params.id;
    const { status } = req.body;
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
  "/update-comment/:id",
  [body("comment").notEmpty().withMessage("Please provide a comment.")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const commentId = req.params.id;
    const { comment } = req.body;

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
  "/delete-comment/:id",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const commentId = req.params.id;
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
  "/add-task-tag/:id",
  [body("tag").notEmpty().withMessage("Please provide a tag")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const taskId = req.params.id;
    const { tag, tagId } = req.body;
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
      // await taskExist.update({ tag: tag });
      await tagsM.update({ where: { id: tagId, object_id: taskExist.id } });
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
  "/edit-task-tag/:id",
  [body("tag").notEmpty().withMessage("Please enter a tag")],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const taskId = req.params.id;
    const { tag } = req.body;
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
tasks.delete(
  "/delete-task-tag",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    const taskId = req.params.id;
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

// UPDATE ROUTES

// working correctly
tasks.post(
  "/update-task/:id",
  keyAuthenticator,
  checkInAuthenticator,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    const taskId = req.params.id;
    const {
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

// ASSIGN ROUTES

// working correctly
tasks.post(
  "/task-assign/:id",
  [
    body("assignedTo")
      .notEmpty()
      .withMessage("Please provide a assigned to id"),
  ],
  validationAuthenticator,
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const taskId = req.params.id;
    const { assignedTo } = req.body;
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

module.exports = tasks;
