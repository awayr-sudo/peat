const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { tasksM } = require("./tasksM");

const subTaskM = dbCon.define("sub_tasks", {
  parent_task_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  parent_sub_task_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0,
  },
  estimated_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  priority: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 0, // 0 = general, 1 = medium, 2 = high
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  assigned_user1: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assigned_user2: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assigned_user3: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_done: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 0,
  },
  comments: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

subTaskM.belongsTo(tasksM, {
  foreignKey: "parent_task_id",
  onDelete: "CASCADE",
  as: "tasks",
});

tasksM.hasMany(subTaskM, {
  foreignKey: "parent_task_id",
  onDelete: "CASCADE",
  as: "subTasks",
});

// have to make association so that the api is allowed to make a sub task of another sub task

subTaskM.belongsTo(subTaskM, {
  foreignKey: "parent_sub_task_id",
  onDelete: "CASCADE",
  as: "parentSubTask",
});

subTaskM.hasMany(subTaskM, {
  foreignKey: "parent_sub_task_id",
  onDelete: "CASCADE",
  as: "treeSubTasks",
});

subTaskM
  .sync()
  .then(() => console.log("sub_tasks table created"))
  .catch((err) => console.log("error syncing sub_tasks table: " + err));

module.exports = { subTaskM };
