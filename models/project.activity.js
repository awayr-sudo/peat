const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");

const projectActivityM = dbCon.define(
  "project_activity",
  {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

projectActivityM
  .sync()
  .then(() => console.log("syned the project activity table"))
  .catch((error) => {
    console.log("could not sync the project activity table", error);
  });

module.exports = { projectActivityM };
