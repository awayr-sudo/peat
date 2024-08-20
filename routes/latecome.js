const express = require("express");
const latecome = express.Router();
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { Op } = require("sequelize");

const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const { body, validationResult } = require("express-validator");
const AttendanceM = require("../models/attendanceM");


// latecome.get("/latecome", keyAuthenticator, async (req, res) => {
//     const {startDate,endDate}= req.body
//     const userId = req.user.id;

//     const newEndDate = endDate + " 23:59:59";
//     // const officialStartTime= "10:00"
//     // const officeTime = moment(officialStartTime, 'HH:mm');
//     // console.log(officeTime)
//     try{
//         const employeeTime= await AttendanceM.findAll({
//             where:{
//                 user_id:userId,
//                 created_at: {
//                     [Op.between]: [new Date(startDate), new Date(newEndDate)],
//                   },
//             }
//         })
//       return res.status(200).json({ report: employeeTime });

//     }
   
//      catch (error) {
//       console.log("errror", error);
//       res
//         .status(500)
//         .json({ error: "An error occurred while fetching the report." });
//     }


// });
// module.exports = latecome;
