const express = require("express");
const tasks = express.Router();
const { tasksM } = require("../models/tasksM");
const { projectsM } = require("../models/projectsM");
const { commentsM } = require("../models/commentsM");
const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const { body, validationResult } = require("express-validator");
const { subTaskM } = require("../models/sub.tasksM");

tasks.get("/project/task", async (req, res) => {
  const allTasks = await tasksM.findAll();
  return res.status(200).json(allTasks);
});

tasks.get("/project/sub-task", async (req, res) => {
  const allSubTasks = await subTaskM.findAll();
  return res.status(200).json(allSubTasks);
});

tasks.post("/project/task", async (req, res) => {
  const {
    projectId,
    name,
    status,
    progress,
    estimatedDate,
    dueDate,
    description,
    tags,
    // assignedTo,
  } = req.body;
  const project = await projectsM.findOne({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ message: "project not found" });
  }
  try {
    const task = await tasksM.create({
      project_id: projectId,
      name: name,
      status: status,
      progress: progress,
      estimated_date: estimatedDate,
      due_date: dueDate,
      // file: req.file.path,
      description: description,
      tags: tags,
    });
    return res.status(201).json({ task: task });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

tasks.post("/project/sub-task", async (req, res) => {
  const {
    parentTaskId,
    name,
    status,
    progress,
    estimatedDate,
    dueDate,
    description,
    // assignedTo,
  } = req.body;

  const parentTaskExist = await tasksM.findOne({ where: { id: parentTaskId } });
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
      // file: req.file.path,
      description: description,
    });
    return res.status(201).json({ sub_task: subTaskAdded });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

tasks.post("/project/comment", async (req, res) => {
  const { taskId, subTaskId, projectId, userId, comment, isIssue, isResolved } =
    req.body;

  if (taskId) {
    const taskExist = await tasksM.findOne({ where: { id: taskId } });
    if (!taskExist) {
      return res.status(200).json({ message: "Task id does not exists" });
    } else {
      try {
        const addedComment = await commentsM.create({
          task_id: taskId,
          user_id: userId,
          comment: comment,
        });
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
      try {
        const subCommentAdded = await commentsM.create({
          task_id: subTaskExist.parent_task_id,
          sub_task_id: subTaskId,
          user_id: userId,
          comment: comment,
        });
        return res.status(201).json({ comment: subCommentAdded });
      } catch (err) {
        return res.status(500).json({ sub_task: err });
      }
    }
  }
});

module.exports = tasks;
