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
    tags: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sub_tasks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // assigned_to: {
    //   type: DataTypes.JSON,
    //   allowNull: true,
    // },
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
});

projectsM.hasMany(tasksM, {
  foreignKey: "project_id",
  onDelete: "CASCADE",
});

tasksM
  .sync({ alter: true })
  .then(() => console.log("tasks table synced"))
  .catch((err) => console.log(err));

module.exports = { tasksM };
