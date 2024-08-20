const express = require("express");
const auth = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { usersM } = require("../models/usersM");
const {
  keyAuthenticator,
  checkInAuthenticator,
} = require("../middlewares/authenticator");
const { body, validationResult } = require("express-validator");
const { pendingDetailsM } = require("../models/pending.detalisM");
const { companyDetailsM } = require("../models/company.detailsM");

auth.post(
  "/login",
  [
    body("email").isEmail().withMessage("please use correct email address"),
    body("password").notEmpty().withMessage("Enter Password"),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await usersM.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: "no user with this email found" });
    }

    const match_pass = await bcrypt.compare(password, user.password);
    if (!match_pass) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = uuidv4();
    const tokenExpiration = new Date(Date.now() + 3600000);

    try {
      await usersM.update(
        { access_key: token, expire_time: tokenExpiration },
        { where: { id: user.id } }
      );
    } catch (err) {
      return res.status(500).json({
        message: "Error logging in",
        error: err,
      });
    }
    return res.status(200).json({
      name: user.full_name,
      user_token: token,
    });
  }
);

// this route is the homepage, only gives that user details ( for check purpose )
auth.get(
  "/success",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const user = req.user;
    return res.status(200).json({ message: { user } });
  }
);

auth.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Enter Username"),
    body("email")
      .notEmpty()
      .isEmail()
      .withMessage("Use a correct email address"),
    body("password").notEmpty().withMessage("Enter Password"),
    body("role").notEmpty().withMessage("Enter Role"),
    body("forgotCode").notEmpty().withMessage("Enter Forgot Code"),
    body("primaryNumber").notEmpty().withMessage("Enter primary phone number"),
    body("primaryAddress").notEmpty().withMessage("Enter primary address"),
    body("emergencyName")
      .notEmpty()
      .withMessage("Enter emergency contact name"),

    body("emergencyEmail").notEmpty().withMessage("Enter emergency email"),
    body("emergencyNumber").notEmpty().withMessage("Enter emergency address"),
    body("emergencyAddress").notEmpty().withMessage("Enter emergency address"),
    body("emergencyrelationship")
      .notEmpty()
      .withMessage("Enter emergency relationship"),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      username,
      email,
      password,
      role,
      forgotCode,
      primaryNumber,
      secondaryNumber,
      primaryAddress,
      secondaryAddress,
      emergencyName,
      emergencyEmail,
      emergencyNumber,
      emergencyAddress,
      emergencyRelationship,
    } = req.body;

    try {
      const user = await usersM.findOne({ where: { email: email } });
      if (user) {
        return res.status(409).json({ message: "user already exists" });
      }

      const hashPass = await bcrypt.hash(password, 10);
      await usersM.create({
        full_name: username,
        email: email,
        password: hashPass,
        role: role.toLowerCase(),
        forget_code: forgotCode,
        primary_number: parseInt(primaryNumber, 10),
        secondary_number: parseInt(secondaryNumber, 10),
        primary_address: primaryAddress,
        secondary_address: secondaryAddress,
        emergency_name: emergencyName,
        emergency_email: emergencyEmail,
        emergency_number: emergencyNumber,
        emergency_address: emergencyAddress,
        emergency_relationship: emergencyRelationship,
      });
      return res.status(201).json({
        message: `user '${username}' created`,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error: " + err,
      });
    }
  }
);

auth.post(
  "/company-details",
  [
    body("name").notEmpty().withMessage("Enter Company Name"),
    body("email").notEmpty().withMessage("Enter email address"),
    body("primaryNumber").notEmpty().withMessage("Enter primary phone number"),
    body("primaryAddress").notEmpty().withMessage("Enter primary address"),
    body("workHours").notEmpty().withMessage("Enter work hours"),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { name, email, primaryAddress, primaryNumber, workHours } = req.body;

    const isExist = await companyDetailsM.findOne({
      where: {
        email: email,
      },
    });

    if (isExist) {
      res.status(409).json({
        message: `Company already exists with ${email}`,
      });
    }

    try {
      await companyDetailsM.create({
        name: name,
        email: email,
        primary_number: primaryNumber,
        primary_address: primaryAddress,
        work_hours: workHours,
      });
      return res.status(201).json({
        message: `Company details created for ${name}`,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Error: " + err,
      });
    }
  }
);

auth.post(
  "/forgot",
  [
    body("email").isEmail().withMessage("Use a correct email address"),
    body("newPass").notEmpty().withMessage("enter a new password"),
    body("forgotCode").notEmpty().withMessage("enter the forgot code"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { email, forgotCode, newPass } = req.body;

      const user = await usersM.findOne({ where: { email: email } });

      if (!user || user.forget_code !== forgotCode) {
        return res
          .status(401)
          .json({ message: "Invalid email or forgot code" });
      }

      const salt = 12;
      const hashPass = await bcrypt.hash(newPass, salt);

      await usersM.update({ password: hashPass }, { where: { id: user.id } });

      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

auth.post(
  "/update-details",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    user = req.user;
    // const newDetails = req.body;
    req.body.password = await bcrypt.hash(req.body.password, 10);
    delete req.body.email; // delete such entries which we don't want to be updated

    try {
      await pendingDetailsM.create({
        user_id: user.id,
        new_details: req.body,
        status: "pending",
      });
    } catch (err) {
      return res.status(500).json({
        message: err,
      });
    }
    return res.status(201).json({
      message: "pending request created",
    });
  }
);

// for admin
auth.get(
  "/update-requests",
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    var approveDetails = [];
    var pendingDetails = [];
    var disapproveDetails = [];
    const pendingApprovals = await pendingDetailsM.findAll();
    pendingApprovals.forEach((item) => {
      if (item.status === "approve") {
        approveDetails.push(item);
      } else if (item.status === "pending") {
        pendingDetails.push(item);
      } else if (item.status === "disapprove") {
        disapproveDetails.push(item);
      }
    });
    return res.status(200).json({
      approve: approveDetails,
      pending: pendingDetails,
      disapprove: disapproveDetails,
    });
  }
);

auth.post(
  "/update-decision",
  [body("id").isInt().withMessage("ID must be an integer")],
  keyAuthenticator,
  checkInAuthenticator,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { id, action } = req.body;
    try {
      const pendingDetails = await pendingDetailsM.findOne({
        where: { id: id },
      });

      if (!pendingDetails) {
        return res
          .status(404)
          .json({ message: "No pending request found with this id" });
      }

      if (action == "approve") {
        const userDetails = await usersM.findByPk(pendingDetails.user_id);
        await userDetails.update(pendingDetails.new_details);
        await pendingDetails.update({ status: "approve" });
        return res.status(200).json({
          message:
            "Successfully updated the user details for " +
            userDetails.full_name,
        });
      }
      if (action == "disapprove") {
        await pendingDetails.update({ status: "disapprove" });

        res.status(200).json({ message: "Update request disapproved" });
      }
    } catch (err) {
      return res.status(500).json({ message: err });
    }
  }
);

module.exports = auth;
