const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");

// usersM.sync({ alter: true }) when we want to add a new field in our table

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
      allowNull: false,
    },
    access_key: {
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
  .sync({ alter: true })
  .then(() => console.log("Synced successfully"))
  .catch((error) => console.log("Could not sync the db:", error));

module.exports = { usersM };
