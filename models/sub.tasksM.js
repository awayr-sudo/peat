const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { tasksM } = require("./tasksM");

const subTaskM = dbCon.define("sub_tasks", {
  parent_task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  comments: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

subTaskM.belongsTo(tasksM, {
  foreignKey: "parent_task_id",
  onDelete: "CASCADE",
});



tasksM.hasMany(subTaskM, {
  foreignKey: "parent_task_id",
  onDelete: "CASCADE",
  as: "subTasks"
});

subTaskM
  .sync({ alter: true })
  .then(() => console.log("sub_tasks table created"))
  .catch((err) => console.log("error syncing sub_tasks table: " + err));

module.exports = { subTaskM };
