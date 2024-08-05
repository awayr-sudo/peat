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
  .sync()
  .then(() => console.log("Synced successfully"))
  .catch((error) => console.log("Could not sync the db:", error));

module.exports = { usersM };
