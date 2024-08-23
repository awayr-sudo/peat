const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { tasksM } = require("./tasksM");

const tagsM = dbCon.define(
  "tags",
  {
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sub_task_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

tagsM.belongsTo(tasksM, {
  foreignKey: "object_id",
  onDelete: "CASCADE",
  as: "task",
});

tasksM.hasMany(tagsM, {
  foreignKey: "object_id",
  onDelete: "CASCADE",
  as: "tags",
});

tagsM
  .sync()
  .then(() => console.log("Tags table created"))
  .catch((err) => console.log(err.message));

module.exports = { tagsM };
