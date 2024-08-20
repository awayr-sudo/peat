const { DataTypes, Op } = require("sequelize");
const { dbCon } = require("../db/db");
const { tasksM } = require("./tasksM");
const { subTaskM } = require("./sub.tasksM");

const commentsM = dbCon.define(
  "comments",
  {
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: tasksM,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    sub_task_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: subTaskM,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_edited: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

commentsM.belongsTo(tasksM, {
  foreignKey: "task_id",
  onDelete: "CASCADE",
  as: "task",
});

tasksM.hasMany(commentsM, {
  foreignKey: "task_id",
  onDelete: "CASCADE",
  as: "task_comments",
});

commentsM.belongsTo(subTaskM, {
  foreignKey: "sub_task_id",
  onDelete: "CASCADE",
  as: "subTask",
});

subTaskM.hasMany(commentsM, {
  foreignKey: "sub_task_id",
  onDelete: "CASCADE",
  as: "sub_task_comments",
});

commentsM
  .sync()
  .then(() => console.log("comments table created"))
  .catch((err) => console.log("error syncing comments table: " + err));

module.exports = { commentsM };
