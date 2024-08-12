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
      allowNull: true, // it will have task id in it for above
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
    is_issue: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    is_resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

commentsM.afterCreate(async (comment, options) => {
  if (comment.task_id) {
    const taskComment = await commentsM.count({
      where: {
        task_id: comment.task_id,
        sub_task_id: null,
      },
    });
    const updatedTaskCount = await tasksM.update(
      {
        comments: taskComment,
      },
      {
        where: {
          id: comment.task_id,
        },
      }
    );
  }

  if (comment.sub_task_id) {
    const subTaskComments = await commentsM.count({
      where: {
        task_id: comment.task_id,
        sub_task_id: {
          [Op.not]: null,
        },
      },
    });

    const updatedSubTasks = await subTaskM.update(
      { comments: subTaskComments },
      {
        where: {
          id: comment.sub_task_id,
        },
      }
    );
  }
});

commentsM.belongsTo(tasksM, {
  foreignKey: "task_id",
  onDelete: "CASCADE",
});

tasksM.hasMany(commentsM, {
  foreignKey: "task_id",
  onDelete: "CASCADE",
  as: "taskCount",
});

commentsM.belongsTo(subTaskM, {
  foreignKey: "sub_task_id",
  onDelete: "CASCADE",
});

subTaskM.hasMany(commentsM, {
  foreignKey: "sub_task_id",
  onDelete: "CASCADE",
  as: "sub_task_comments",
});

commentsM
  .sync({ alter: true })
  .then(() => console.log("comments table created"))
  .catch((err) => console.log("error syncing comments table: " + err));

module.exports = { commentsM };
