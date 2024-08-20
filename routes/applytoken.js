const express = require("express");
const applyleave = express.Router();
const jwt = require("jsonwebtoken");
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
  const { userId } = req.body;

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
  
    // const workedMinutes = workedTime.getUTCMinutes();
    // console.log(workedMinutes)
    // const workedSeconds = workedTime.getUTCSeconds();
    // console.log(workedSeconds)
    // const employeeworkingHours =
    //   workedHours + ":" + workedMinutes + ":" + workedSeconds;
    // //Offical working hours
    const officeWorkingHours = 9;
    const extraHours = workedHours - officeWorkingHours;
    return res.status(200).json({
      Attendance_Record: AttendanceRecord,
      working_hours: officeWorkingHours,
      you_worked: workedHours,
      extra_Hours: extraHours,
    });
  }
 
  addExtraHours(AttendanceRecord);
}),
  applyleave.post("/apply-token", keyAuthenticator, async (req, res) => {
    const { userId, reason, leave_approval } = req.body;
    const AttendanceRecord = await AttendanceM.findOne({
      where: {
        user_id: userId,
        // id: AttendanceRecord.id,
      },
    });
    const officeWorkingHours = 9;
    const workedTime = new Date(AttendanceRecord.track_time);
    
    const workedHours = workedTime.getUTCHours();
    const extraHours = workedHours - officeWorkingHours;
    try {
      const userattendance = await AttendanceM.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.between]: [],
          },
          
        },
      });

     
      if (userattendance) {
        const extraTime = await applyTokenM.create({
          user_id: userId,
          attendance_id: AttendanceRecord.id,
          reason,
          leave_approval,
          extra_hours: extraHours,
        });
        return res.status(200).json(extraTime);
      }
      // return res.status(200).json(attendance);
      // console.log(attendance);
    } catch (error) {
      console.log({ error: error.message });
    }
  });
module.exports = applyleave;
