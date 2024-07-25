const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");

const projectsM = dbCon.define(
  "Projects",
  {
    name: {
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
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Not Set",
    },
    edited_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: usersM,
        key: "id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { timestamps: false }
);

projectsM.belongsTo(usersM, {
  foreignKey: "user_id",
});

usersM.hasMany(projectsM, {
  foreignKey: "user_id",
});

projectsM
  .sync({ alter: true })
  .then(async () => {
    console.log("Project Table Synced");
  })
  .catch((err) => console.log("Error syncing Project table", err));

module.exports = { projectsM };
