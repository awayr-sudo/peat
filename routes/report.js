const express = require("express");
const report = express.Router();
const { Op } = require("sequelize");

const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const AttendanceM = require("../models/attendanceM");
const BreaksM = require("../models/breaksM");

//Generating Attendance report
report.get("/attendancereport", keyAuthenticator, async (req, res) => {
  const userId = req.user.id;

  const { startDate, endDate } = req.body;

  const newEndDate = endDate + " 23:59:59";


  try {
    const reports = await AttendanceM.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(newEndDate)],
        },
      },
    });

    return res.status(200).json({ report: reports });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while fetching the report.",
      error: error.message,
    });
  }
});

//Generating Break Report
report.get("/breakreport", keyAuthenticator, async (req, res) => {
  const { startDate, endDate } = req.body;
  const userId = req.user.id;
  const newEndDate = endDate + " 23:59:59 ";

  try {
    const breakReport = await BreaksM.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(newEndDate)],
        },
      },
    });

    return res.status(200).json({ report: breakReport });
  } catch (error) {
    // console.log(error)
    res
      .status(500)
      .json({ error: "An error occured while fetching the report." });
  }
});
// Calculating all Breaks Duration
report.get("/allbreaks", keyAuthenticator, async (req, res) => {
  const { startDate, endDate } = req.body;
  const { user_id } = req.body;
  const newEndDate = endDate + " 23:59:59 ";
  try {
    const breakReport = await BreaksM.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(newEndDate)],
        },
      },
    });

    return res.status(200).json({ report: breakReport });
  } catch {}
});
module.exports = report;
