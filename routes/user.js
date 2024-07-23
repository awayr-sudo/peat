const express = require("express");
const { usersM } = require("../models/usersM");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const user = express.Router();
const passport = require("passport");
const AttendanceM = require("../models/attendanceM");
const LunchBreakM = require("../models/lunchbreakM");

// Updating own details for all users
user.post("/change-my-details", async (req, res, next) => {
  passport.authenticate("bearer", { session: false }, async (err, user) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user) {
      // User is authenticated
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        console.log(user.id);
        user.full_name = name;
        user.email = email;
        user.password = hashedPassword;
        await user.save();

        res.send(
          `Updated user: ${user.full_name} + ${user.password} + ${user}`
        );
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  })(req, res, next);
});

// Updating users details -> manager roles only
user.put("/change-user-details", async (req, res, next) => {
  passport.authenticate("bearer", { session: false }, async (err, user) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user && user.role == "manager") {
      // User is authenticated
      const { userid, name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      try {
        console.log(user.id);
        const found_user = await usersM.findByPk(userid);
        if (!found_user) {
          return res.status(404).json({ message: "User not found" });
        }

        found_user.full_name = name;
        found_user.email = email;
        found_user.password = hashedPassword;
        await found_user.save();
        res.send(
          `Updated user: ${found_user.full_name} + ${found_user.password} + ${found_user.email}`
        );
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  })(req, res, next);
});

// Deleting users -> manager roles only
user.delete("/delete-user", async (req, res, next) => {
  passport.authenticate("bearer", { session: false }, async (err, user) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user && user.role == "manager") {
      // User is authenticated
      const { user_id } = req.body;

      try {
        const found_user = await usersM.findByPk(user_id);
        if (!found_user) {
          return res.status(404).json({ message: "User not found" });
        }

        await found_user.destroy();
        res.send(`Deleted user: ${found_user.full_name}`);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  })(req, res, next);
});

//User Check-in
user.post("/checkin", (req, res, next) => {
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
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await AttendanceM.findOne({
          where: {
            userId: user.id,
            createdAt: {
              [Op.between]: [startOfDay, endOfDay],
            },
          },
        });

        if (attendance) {
          res.status(201).json({ message: "you have already checked in" });
        } else {
          const attendance = await AttendanceM.create({
            userId: user.id,
            checkIn: new Date(),
          });

          res.status(201).json(attendance);
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
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await AttendanceM.findOne({
          where: {
            userId: user.id,
            checkIn: {
              [Op.ne]: null,
            },
            checkOut: null,
            createdAt: {
              [Op.between]: [startOfDay, endOfDay],
            },
          },
        });

        if (attendance) {
          attendance.checkOut = new Date();
          //Checkout time shouldn't be before the Checkin time

          if (attendance.checkOut < attendance.checkIn) {
            return res.status(400).json({ error: "Please Check in first" });
          }
          (checkOutTime = attendance.checkOut), await attendance.save();
          res.json(attendance);
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
user.post("/start-lunch", (req, res, next) => {
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
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const active_user = await AttendanceM.findOne({
          where: { userId: user.id, checkOut: null },
        });
        if (active_user) {
          const userLunch = await LunchBreakM.findOne({
            where: {
              userId: user.id,
              createdAt: {
                [Op.between]: [startOfDay, endOfDay],
              },
            },
          });
          if (userLunch) {
            return res
              .status(201)
              .json({ message: "You are already on lunch break" });
          }

          const lunchBreak = await LunchBreakM.create({
            userId: user.id,
            startBreak: new Date(),
          });

          res.status(201).json({ message: lunchBreak });
        }
        if (!active_user) {
          return res.status(400).json({ error: "Please Check in first" });
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  )(req, res, next);
});

//End Break
user.post("/end-lunch", (req, res, next) => {
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
        }
        lunchBreak.endBreak = new Date();
        await lunchBreak.save();
        res.json(lunchBreak);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  )(req, res, next);
});

module.exports = user;
