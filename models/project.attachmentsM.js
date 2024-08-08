const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { projectsM } = require("./projectsM");

const projectAttachmentsM = dbCon.define(
  "project_attachments",
  {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: projectsM,
        key: "id",
      },
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    underscored: true,
    timestamps: true,
  }
);

projectsM.hasOne(projectAttachmentsM, {
  foreignKey: "project_id",
  onDelete: "CASCADE",
});

projectAttachmentsM.belongsTo(projectsM, {
  foreignKey: "project_id",
});

projectAttachmentsM
  .sync()
  .then(() => console.log("Synced successfully"))
  .catch((err) => console.log("project attachment error: " + err));

module.exports = { projectAttachmentsM };
