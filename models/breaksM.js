const { DataTypes } = require("sequelize");
const { usersM } = require("./usersM");
const { attendanceM } = require("./attendanceM");
const { dbCon } = require("../db/db");
const { duration } = require("moment");

const BreaksM = dbCon.define(
  "Breaks",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    start_break: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_break: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // break_duration: {
    //   type: DataTypes.VIRTUAL,
    //   get() {
    //     const startBreak = this.getDataValue("start_break");
    //     const endBreak = this.getDataValue("end_break");

    //     if (startBreak && endBreak) {
    //       // const breakTrack= this.getDataValue("break_duration")
    //       const breakTrack = new Date(endBreak - startBreak); // duration in (hh:mm:ss) format
    //       const breakTrackSeconds = breakTrack.getUTCSeconds(); //Getting seconds
    //       const breakTrackMinutes = breakTrack.getUTCMinutes(); //Getting minutes
    //       const breakTrackHours = breakTrack.getUTCHours(); //Getting hours
    //       const breakTrackTime =
    //         breakTrackHours + ":" + breakTrackMinutes + ":" + breakTrackSeconds;
    //       return breakTrackTime
    //     } 
    //     // else if(startBreak && endBreak==null){
    //     //   const breakTrackTime= new Date();
    //     //   return breakTrack

    //     // }
    //     // return null;
    //   },
    // },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

BreaksM.belongsTo(usersM, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

BreaksM.sync()
  .then(() => {
    console.log("BreaksM table synced successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

module.exports = BreaksM;
