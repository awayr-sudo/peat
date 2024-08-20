const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { projectsM } = require("./projectsM");

const tasksM = dbCon.define(
  "tasks",
  {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: projectsM,
        key: "id",
      },
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
    progress: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // defaultValue: {
      // }
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sub_tasks: {
      type: DataTypes.INTEGER,
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
    is_done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

tasksM.belongsTo(projectsM, {
  foreignKey: "project_id",
  onDelete: "CASCADE",
  as: "project",
});

projectsM.hasMany(tasksM, {
  foreignKey: "project_id",
  onDelete: "CASCADE",
});

tasksM
  .sync()
  .then(() => console.log("tasks table synced"))
  .catch((err) => console.log(err));

module.exports = { tasksM };
