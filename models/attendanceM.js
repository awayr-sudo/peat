const { DataTypes, Sequelize, literal } = require("sequelize");
const { usersM } = require("./usersM");
const { dbCon } = require("../db/db");

const moment = require("moment");
const { SELECT } = require("sequelize/lib/query-types");

const AttendanceM = dbCon.define(
  "Attendance",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    check_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },

  
    // late_come: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     const startTime = this.getDataValue("check_in");
    //     const startTimeSeconds = startTime.getUTCSeconds(); //Getting seconds
    //     const startTimeMinutes = startTime.getUTCMinutes(); //Getting minutes
    //     const startTimeHours = startTime.getUTCHours(); //Getting hours
    //     const lateCome =
    //       startTimeHours + ":" + startTimeMinutes + ":" + startTimeSeconds;
    //     const officeStartTime = "05:00:00";
    //     const lateComeTime = parseInt(lateCome) - parseInt(officeStartTime);
    //     return lateComeTime;
    //   },
    // },

    
    // attendance_status: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     const startTime = this.getDataValue("check_in");
    //     const startTimeSeconds = startTime.getUTCSeconds();
    //     const startTimeMinutes = startTime.getUTCMinutes();
    //     const startTimeHours = startTime.getUTCHours();
    //     const lateCome =
    //       startTimeHours + ":" + startTimeMinutes + ":" + startTimeSeconds;

    //     const maxLateTime = "05:30:00";
    //     const lateComeTime = parseInt(maxLateTime) - parseInt(lateCome);

    //     if (lateCome > maxLateTime) {
    //       return "You are Late";
    //     } else if (lateCome < maxLateTime) {
    //       return "You are on Time";
    //     }
    //     return lateComeTime;
    //   },
    // },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

AttendanceM.belongsTo(usersM, {
  foreignKey: "user_id",
});

AttendanceM.sync()
  .then(() => {
    console.log("Attendance table synced successfully!");
  })
  .catch((error) => {
    console.error("Unable to sync table : ", error);
  });

module.exports = AttendanceM;
