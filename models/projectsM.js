const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");

const ProjectsM = dbCon.define("Projects", {
  p_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: usersM,
      key: "id",
    },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Not Set",
  },
  edited_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: usersM,
      key: "id",
    },
  },
});

ProjectsM.belongsTo(usersM, {
  foreignKey: "user_id",
});

usersM.hasMany(ProjectsM, {
  foreignKey: "user_id",
});

ProjectsM.sync({ alter: true })
  .then(async () => {
    console.log("Project Table Synced");
  })
  .catch((err) => console.log("Error syncing Project table", err));

module.exports = { ProjectsM };
