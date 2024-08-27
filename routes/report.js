const express = require("express");
const report = express.Router();
const { Op, Sequelize } = require("sequelize");

const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const AttendanceM = require("../models/attendanceM");
const BreaksM = require("../models/breaksM");

//Generating Attendance report
report.get("/userreport", keyAuthenticator, async (req, res) => {
  const userId = req.user.id;

  const { startDate, endDate } = req.body;

  const newEndDate = endDate + " 23:59:59";


  try {
    const attendanceReport = await AttendanceM.findAll({
      attributes: {
        include: [
          [
            // Note the wrapping parentheses in the call below!
            Sequelize.literal(`
                        TIMEDIFF(check_out,check_in)  `),
            "track_time",
          ],
          [
            // Note the wrapping parentheses in the call below!

            Sequelize.literal('TIMEDIFF(TIME(check_in), "10:00:00")'),
      'late_come',
        
          ],
          // [
          //   Sequelize.literal(`
              
          //     `)
          // ]
        ],
      },

      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(newEndDate)],
        },
      },
    });
    const breakReport = await BreaksM.findAll({
      attributes: {
        include: [
          [
            // Note the wrapping parentheses in the call below!
            Sequelize.literal(`
                        TIMEDIFF(end_break,start_break)  `),
            "break_duration",
          ],
        ],
      },

      where: {
        user_id: userId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(newEndDate)],
        },
      },
    });

    return res.status(200).json({ attendanceReport, breakReport });
  } catch (error) {
    console.log("errror", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the report." });
  }
});

// Generating Break Report
// report.get("/breakreport", keyAuthenticator, async (req, res) => {
//   const { startDate, endDate } = req.body;
//   const userId = req.user.id;
//   const newEndDate = endDate + " 23:59:59 ";

//   try {
//     const breakReport = await BreaksM.findAll({
//       attributes: {
//         includes: [
//           [
//             Sequelize.literal(`
//                   TIMEDIFF(end_break,start_break)
//                   `),
//             "break_duration",
//           ],
//         ],
//       },
//       where: {
//         user_id: userId,
//         created_at: {
//           [Op.between]: [new Date(startDate), new Date(newEndDate)],
//         },
//       },
//     });

//     return res.status(200).json({ breakReport });
//   } catch (error) {
//     // console.log(error)
//     res
//       .status(500)
//       .json({ error: "An error occured while fetching the report." });
//   }
// });

module.exports = report;
