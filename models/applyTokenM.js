const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const AttendanceM = require("./attendanceM");

const applyTokenM = dbCon.define("leavetokens", {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  attendance_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // leave_token: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // },
  extra_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  leave_approval: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
  },
});

applyTokenM
  .sync()
  .then(() => console.log("Synced successfully"))
  .catch((error) => console.log("Could not sync the db:", error));
module.exports = applyTokenM;
