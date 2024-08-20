const { DataTypes, DATE, DATEONLY } = require("sequelize");
const { usersM } = require("./usersM");
const { dbCon } = require("../db/db");
const moment = require("moment");

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
    track_time: {
      type: DataTypes.VIRTUAL,
      get() {
        const startTime = this.getDataValue("check_in");

        const endTime = this.getDataValue("check_out");

        if (startTime && endTime) {
          const timeTrack = new Date(endTime - startTime); // duration in (hh:mm:ss) format

          return timeTrack;
        }

        return null;
      },
    },
    late_come: {
      type: DataTypes.VIRTUAL,
      get() {
        const startTime = this.getDataValue("check_in");
        const officialStartTime = "10:00:00";
        const officeTime = moment(officialStartTime, "HH:mm A");
        const lateCome = new Date(startTime - officeTime);
        return lateCome;
      },
    },
    attendance_status: {
      type: DataTypes.VIRTUAL,
      get() {
        const startTime = this.getDataValue("check_in");
        const officialStartTime = "10:00:00";
        const officeTime = moment(officialStartTime, "HH:mm");
        const lateCome = moment(startTime - officeTime);
        const halfHour = "00:30:00";

        if (lateCome <= halfHour) {
          return "Present";
        } else {
          return "Late";
        }
        return null;
      },
    },
    // extra_Hours: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     const companyHours = 9;
    //     const companyHoursInMilisecs = companyHours * 60 * 60 * 1000;

    //     const trackTimeInMilisecs = AttendanceM.track_time;
    //     if (companyHoursInMilisecs < trackTimeInMilisecs) {
    //       return res.json({
    //         extraHours:
    //           (trackTimeInMilisecs - companyHoursInMilisecs) / (1000 * 60 * 60),
    //       });
    //     } else {
    //       return res.json({
    //         message: "no extra hours",
    //       });
    //     }
    //     // const regularWorkingHours = 8
    //     // const startTime = this.getDataValue("check_in");
    //     // const endTime= this.getDataValue("check_out")
    //     // const workedHours= new Date(endTime- startTime)
    //     // const extraHours =(endTime- workedHours)
    //     // ? workedHours - regularWorkingHours : 0;
    //     // const extraHours= new Date(workedHours-regularWorkingHours)
    //     //   if(extraHours)
    //     //   {

    //     //   return extraHours
    //     // }
    //   },
    // },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

AttendanceM.belongsTo(usersM, {
  foreignKey: "user_id",
});

AttendanceM.sync({ alter: true })
  .then(() => {
    console.log("Attendance table synced successfully!");
  })
  .catch((error) => {
    console.error("Unable to sync table : ", error);
  });

module.exports = AttendanceM;
