const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");
const { projectsM } = require("./projectsM");

const ProjectMembersM = dbCon.define("project_members", {
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
  // user type which was assigned or added in the project
  user_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

projectsM.belongsToMany(usersM, {
  through: ProjectMembersM,
  foreignKey: "project_id",
});
usersM.belongsToMany(projectsM, {
  through: ProjectMembersM,
  foreignKey: "user_id",
});

ProjectMembersM.sync({ alter: true })
  .then(() => console.log("ProjectMembersM table synced"))
  .catch((err) => console.log("Error syncing ProjectMembersM table", err));

module.exports = { ProjectMembersM };
