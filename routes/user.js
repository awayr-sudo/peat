const express = require("express");
const { usersM } = require("../models/usersM");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const user = express.Router();
const passport = require("passport");
const AttendanceM = require("../models/attendanceM");
const BreaksM = require("../models/breaksM");



//User Check-in
user.post("/check_in", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!user) {
        return res.status(401).json({ error: err_msg });
      }

      try {
        const attendance = await AttendanceM.findOne({
          where: {
<<<<<<< Updated upstream
            user_id: user.id,
            createdAt: {
              [Op.between]: [startOfDay, endOfDay],
            },
          },
        });

        if (attendance) {
          res.status(201).json({ message: "you have already checked in" });
        } else {
          const attendance = await AttendanceM.create({
            user_id: user.id,
            check_in: new Date(),
=======
            userId: user.id,
            checkOut: null,
          },
        });
        if (!attendance || attendance == null) {
          const checkin = await AttendanceM.create({
            userId: user.id,
            checkIn: new Date(),
>>>>>>> Stashed changes
          });

          return res.status(201).json(checkin);
        } else {
          return res.status(201).json({
            message: "you have already checkedin ! Please checkout first",
          });
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  )(req, res, next);
});

//User Check-Out
user.post("/checkout", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!user) {
        return res.status(401).json({ error: err_msg });
      }
      try {
        const attendance = await AttendanceM.findOne({
          where: {
<<<<<<< Updated upstream
            user_id: user.id,
            check_in: {
              [Op.ne]: null,
            },
            check_out: null,
            createdAt: {
              [Op.between]: [startOfDay, endOfDay],
            },
=======
            userId: user.id,
            checkOut: null,
>>>>>>> Stashed changes
          },
        });

        if (attendance) {
<<<<<<< Updated upstream
          attendance.check_out = new Date();
          //check_out time shouldn't be before the check_in time

          if (attendance.check_out < attendance.check_in) {
            return res.status(400).json({ error: "Please Check in first" });
          }
          (checkOutTime = attendance.check_out), await attendance.save();
          res.json(attendance);
=======
          attendance.checkOut = new Date();
          (checkOutTime = attendance.checkOut), await attendance.save();
          res.json(attendance);
          //Checkout time shouldn't be before the Checkin time

          if (attendance.checkOut < attendance.checkIn) {
            // res.json(attendance);
            return res.status(400).json({ error: "Please Check in first" });
          }
>>>>>>> Stashed changes
        } else {
          res.status(404).json({ error: "No active check-in found for user" });
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  )(req, res, next);
});

//Start Break
user.post("/startbreak", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!user) {
        return res.status(401).json({ error: err_msg });
      }
      try {
        const activeUser = await AttendanceM.findOne({
          where: { userId: user.id, checkOut: null },
        });
        if (activeUser) {
          const userLunch = await LunchBreakM.findOne({
            where: {
              userId: user.id,
              endBreak: null,
            },
          });

          if (activeUser && userLunch) {
            return res
              .status(201)
              .json({ message: "You are already on lunch break" });
          }

          const lunchBreak = await LunchBreakM.create({
            userId: user.id,
            startBreak: new Date(),
          });

          res.status(201).json({ message: lunchBreak });
        } else if (!active_user) {
          return res.status(400).json({ error: "Please Check in first" });
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  )(req, res, next);
});

//End Break
user.post("/endbreak", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!user) {
        return res.status(401).json({ error: err_msg });
      }
      try {
        const lunchBreak = await LunchBreakM.findOne({
          where: { userId: user.id, endBreak: null },
        });
        if (!lunchBreak) {
          return res
            .status(400)
            .json({ error: "No active lunch break found for this user" });
        } else {
          lunchBreak.endBreak = new Date();
          await lunchBreak.save();
          res.json(lunchBreak);
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  )(req, res, next);
});

module.exports = user;
