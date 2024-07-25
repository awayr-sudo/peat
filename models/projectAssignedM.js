const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");
const { projectsM } = require("./projectsM");

const Projects_Assigned = dbCon.define("project_assigned", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: projectsM,
      key: "id",
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: usersM,
      key: "id",
    },
  },
  user_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

projectsM.belongsToMany(usersM, {
  through: Projects_Assigned,
  foreignKey: "project_id",
});
usersM.belongsToMany(projectsM, {
  through: Projects_Assigned,
  foreignKey: "user_id",
});

Projects_Assigned.sync({ alter: true })
  .then(() => console.log("Projects_Assigned table synced"))
  .catch((err) => console.log("Error syncing Projects_Assigned table", err));

module.exports = { Projects_Assigned };
