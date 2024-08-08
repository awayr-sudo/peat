const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");

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
      unique: true,
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
    expire_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    primary_number: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    secondary_number: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    primary_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secondary_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    emergency_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emergency_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emergency_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emergency_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emergency_relationship: {
      type: DataTypes.STRING,
      allowNull: false,
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
