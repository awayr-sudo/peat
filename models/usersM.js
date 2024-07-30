const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
// const {contactdetailsM}= require("../models/contactdetailsM")

const usersM = dbCon.define(
  "users",
  {
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Add unique constraint to email
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    forget_code: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
    access_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    house_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expire_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

usersM
  .sync({ alter: true })
  .then(() => console.log("Synced successfully"))
  .catch((error) => console.log("Could not sync the db:", error));

module.exports = { usersM };
