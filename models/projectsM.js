const { DataTypes, Sequelize } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");

// name does not allow null
// created_by does not allow null
// owned_by does not allow null
// status allows null
// budget allows null
// priority allows null
// progress allows null
// attachments allows null
// description allows null
// type does not allow null
// start_date allows null
// end_date allows null
// deadline allows null

const projectsM = dbCon.define(
  "projects",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: true,
      validate: {
        min: 0,
        max: 10,
      },
      defaultValue: 0,
    },
    budget: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    all_tasks: {
      type: DataTypes.INTEGER,
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
  }
);

projectsM.belongsTo(usersM, {
  foreignKey: "created_by",
});

usersM.hasMany(projectsM, {
  foreignKey: "created_by",
});

projectsM
  .sync()
  .then(() => {
    console.log("Project Table Synced");
  })
  .catch((err) => console.log("Error syncing Project table", err));

module.exports = { projectsM };
