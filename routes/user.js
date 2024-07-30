const express = require("express");
const { usersM } = require("../models/usersM");
const user = express.Router();
const AttendanceM = require("../models/attendanceM");
const contact_detailsM = require("../models/contactdetailsM");
const BreaksM = require("../models/breaksM");
const { keyAuthenticator } = require("../middlewares/key.authenticator");

//User Check-in
user.post("/checkin", keyAuthenticator, async (req, res, next) => {
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
user.post("/checkout", keyAuthenticator, async (req, res, next) => {
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
});

//Start Break
user.post("/startbreak", keyAuthenticator, async (req, res, next) => {
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
});

//End Break
user.post("/endbreak", keyAuthenticator, async (req, res, next) => {
  const user = req.user;
  try {
    const userLunch = await BreaksM.findOne({
      where: { user_id: user.id, end_break: null },
    });

    if (!userLunch) {
      return res.status(400).json({ error: "Lunch Break is Finished" });
    } else {
      userLunch.update({
        end_break: new Date(),
      });
      return res.status(201).json(userLunch);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = user;
