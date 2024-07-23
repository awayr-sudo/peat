const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");
const { ProjectsM } = require("./projectsM");

const AssignedUsers = dbCon.define("assigned_users", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ProjectsM,
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
});

ProjectsM.belongsToMany(usersM, {
  through: AssignedUsers,
  foreignKey: "project_id",
});
usersM.belongsToMany(ProjectsM, {
  through: AssignedUsers,
  foreignKey: "user_id",
});

// Sync the model
AssignedUsers.sync({ alter: true })
  .then(() => console.log("AssignedUsers table synced"))
  .catch((err) => console.log("Error syncing AssignedUsers table", err));

module.exports = { AssignedUsers };
