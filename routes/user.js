const express = require("express");
// const router= express.Router()
const user = express.Router();
const AttendanceM = require("../models/attendanceM");
const BreaksM = require("../models/breaksM");
const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");

//User Check-in
user.post("/checkin", keyAuthenticator, async (req, res) => {
  const user = req.user;

  try {
    const attendance = await AttendanceM.findOne({
      where: { user_id: user.id, check_out: null },
    });
    if (!attendance || attendance == null) {
      const check_in = await AttendanceM.create({
        user_id: user.id,
        check_in: new Date(),
      });
      return res.status(201).json(check_in);
    } else {
      return res.status(201).json({
        message: "you have already checkedin ! Please checkout first",
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//User Check-Out
user.post(
  "/checkout",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    try {
      const attendance = await AttendanceM.findOne({
        where: {
          user_id: user.id,
          check_out: null,
        },
      });

      if (attendance) {
        attendance.check_out = new Date();
        //check_out time shouldn't be before the check_in time

        if (attendance.check_out < attendance.check_in) {
          return res.status(400).json({ error: "Please Check in first" });
        }
        (checkOutTime = attendance.check_out), await attendance.save();
        res.json(attendance);
      } else if (!attendance) {
        res.status(404).json({ error: "No active check-in found for user" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

//Start Break
user.post(
  "/startbreak",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    try {
      const userLunch = await BreaksM.findOne({
        where: {
          user_id: user.id,
          end_break: null,
        },
      });
      if (userLunch) {
        return res
          .status(400)
          .json({ message: "You are already on lunch break" });
      } else {
        const userLunch = await BreaksM.create({
          user_id: user.id,
          start_break: new Date(),
        });
        return res.status(201).json(userLunch);
      }
    } catch (error) {
      res.status(201).json({ error: error.message });
    }
  }
);

//End Break
user.post(
  "/endbreak",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    try {
      const userCheckIn = await AttendanceM.findOne({
        where: {
          user_id: user.id,
          check_out: null,
        },
      });

      if (userCheckIn !== null) {
        const userLunch = await BreaksM.findOne({
          where: { user_id: user.id, end_break: null },
        });

        if (!userLunch) {
          return res.status(400).json({ error: "No break started" });
        } else {
          userLunch.update({
            end_break: new Date(),
          });
          return res.status(201).json(userLunch);
        }
      } else {
        return res.status(401).send("you are not checked in to have a break");
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = user;
// module.exports= router
