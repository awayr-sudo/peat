const { DataTypes } = require("sequelize");
const { usersM } = require("./usersM");
const { dbCon } = require("../db/db");

const AttendanceM = dbCon.define(
  "Attendance",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },

    checkIn: {
      type: DataTypes.DATE,
    },
    checkOut: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "Attendance",
  }
);

AttendanceM.belongsTo(usersM, {
  foreignKey: "userId",
});

AttendanceM.sync({ alter: true })
  .then(() => {
    console.log("User table created successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });
module.exports = AttendanceM;
