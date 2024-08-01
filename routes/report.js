const express = require("express");
// const router= express.Router() 
const report = express.Router();
const { Op } = require("sequelize");

const {
    keyAuthenticator,
    checkInAuthenticator,
  } = require("../middlewares/authenticator");
const AttendanceM = require("../models/attendanceM");
  
//This is the function
const getMonthlyReport = async (userId, month, year) => {
  const start_date = new Date(year, month-1, 1, 1);
  const end_date = new Date(year, month, 0);
  const reports = await AttendanceM.findAll({
    where: {
      user_id:userId,
      created_at: {
        [Op.between]: [start_date, end_date],
      },
    },
  });
  return reports
};


//Here we are generating the report
report.get(
  "/userreport/:Id/:month/:year",
  keyAuthenticator,
  async (req, res) => {
    const {month, year}= req.params;
    const userId = req.user.id;
console.log('data', userId, month, year)
    
    try {
        const reports= await getMonthlyReport(userId,month,year)
        res.json(reports)
    } catch (error) {
        console.log('errror', error)
        res.status(500).json({ error: 'An error occurred while fetching the report.'});
    }
  }
);
module.exports= report;
// module.exports= router