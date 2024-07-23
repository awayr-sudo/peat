const { DataTypes } = require("sequelize");
const { usersM } = require("./usersM");
const { dbCon } = require("../db/db");
const LunchBreakM = dbCon.define(
  "LunchBreak",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    startBreak: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endBreak: {
      type: DataTypes.DATE,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "LunchBreaks",
  }
);

LunchBreakM.belongsTo(
  usersM,
  {
    foreignKey: "userId",
  },
  { onDelete: "cascade" }
);

LunchBreakM.sync({ alter: true })
  .then(() => {
    console.log("User table created successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

module.exports = LunchBreakM;
