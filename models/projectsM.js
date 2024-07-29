const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");

const projectsM = dbCon.define(
  "projects",
  {
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
    owned_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      allowNull: true,
      values: [0, 1],
      defaultValue: "0",
    },
    budget: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM,
      values: ["low", "medium", "high"],
      allowNull: true,
      defaultValue: "low",
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    attachments: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM,
      values: ["internal", "external", "client"],
      allowNull: false,
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
  .sync({ alter: true })
  .then(async () => {
    console.log("Project Table Synced");
  })
  .catch((err) => console.log("Error syncing Project table", err));

module.exports = { projectsM };
