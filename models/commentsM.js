const { DataTypes, Op } = require("sequelize");
const { dbCon } = require("../db/db");
const { tasksM } = require("./tasksM");
const { subTaskM } = require("./sub.tasksM");

const commentsM = dbCon.define(
  "comments",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    domain: {
      // like project, task or sub task
      type: DataTypes.STRING,
      allowNull: false,
    },
    object: {
      // that domain id
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_pinned: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    comment_id: {
      // sub comments like replies
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
  }
);

commentsM
  .sync()
  .then(() => console.log("comments table created"))
  .catch((err) => console.log("error syncing comments table: " + err));

module.exports = { commentsM };
