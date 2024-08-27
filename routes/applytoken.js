const express = require("express");
const applyleave = express.Router();
const { Sequelize } = require("sequelize");
// const jwt = require("jsonwebtoken");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const { usersM } = require("../models/usersM");
const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const { body, validationResult } = require("express-validator");
const AttendanceM = require("../models/attendanceM");
const { Op, STRING } = require("sequelize");
const applyTokenM = require("../models/applyTokenM");

applyleave.post("/extra-hours", keyAuthenticator, async (req, res) => {
  const userId = req.user.id;
  // return res.send(userId);

  const AttendanceRecord = await AttendanceM.findOne({
    where: {
      user_id: userId,
    },
  });
  //Function: To calculate Extra Hours
  function addExtraHours(AttendanceRecord) {
    const workedTime = new Date(AttendanceRecord.track_time);
    const workedHours = workedTime.getUTCHours();
    // workedHours.forEach(element => {
    //   sum+=element
    // });
    // console.log(sum)

    const workedMinutes = workedTime.getUTCMinutes();
    console.log(workedMinutes)
    const workedSeconds = workedTime.getUTCSeconds();
    console.log(workedSeconds)
    const employeeworkingHours =
      workedHours + ":" + workedMinutes + ":" + workedSeconds;
    //Offical working hours
    // const token_hours = 2;
    const officeWorkingHours = 9;

    const extraHours = employeeworkingHours - officeWorkingHours;
    return res.status(200).json({
      Attendance_Record: AttendanceRecord,
      working_hours: officeWorkingHours,
      you_worked: workedHours,
      extra_Hours: extraHours,
      // token_hours: token_hours,
    });
  }

  addExtraHours(AttendanceRecord);
}),
  applyleave.post("/apply-token", keyAuthenticator, async (req, res) => {
    const { startDate, endDate } = req.body;

    const newEndDate = endDate + " 23:59:59";
    const { reason, leave_approval } = req.body;
    const officeWorkingHours = 9;
    
    try {
      const allUsers = await usersM.findAll();
      const results = await Promise.all(
        allUsers.map(async (user) => {
          const userId = user.id;
          const attendanceReports = await AttendanceM.findAll({
            where: {
              user_id: userId,
              created_at: {
                [Op.between]: [new Date(startDate), new Date(newEndDate)],
              },
            },
          });
          if (attendanceReports) {
            let totalWorkedTime = 10
            

            // Summing up all worked time for the user within the date range
            // attendanceReports.forEach((report) => {
            //   totalWorkedTime += report.track_time;
            // });
            const extraHours =
              totalWorkedTime - officeWorkingHours;

            const extraTime = await applyTokenM.create({
              user_id: userId,
              reason,
              leave_approval,
              extra_hours:extraHours,
            });
            // if(extraTime){
              
            //   return "You can apply token"
            // }
            return extraTime;
            
          }
        
          return null;
        })
      ); 
      // return res.status(200).json(results.filter(result => result !== null));
      return res.status(200).json(results);
      
      // const userattendance = await AttendanceM.findAll({
      //   where: {
      //     user_id: userId,
      //     created_at: {
      //       [Op.between]: [new Date(startDate), new Date(newEndDate)],
      //     },
      //   },
      // });

      // if (attendanceReport.length > 0) {
      //   let totalWorkedTime = 0;

      //   // Summing up all worked time for the user within the date range
      //   attendanceReport.forEach((report) => {
      //     totalWorkedTime += report.track_time;
      //   });

      //   if (userattendance) {
      //     const extraTime = await applyTokenM.create({
      //       user_id: userId,
      //       // attendance_id: AttendanceRecord.id,
      //       reason,
      //       leave_approval,
      //       extra_hours: extraHours,
      //     });
      //     return res.status(200).json(extraTime);
      //   }
      // }
    } catch (error) {}
  });
module.exports = applyleave;
