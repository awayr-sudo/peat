const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");

const companyDetailsM = dbCon.define(
  "company_details",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    primary_number: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    primary_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    work_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    underscored: true,
  }
);

companyDetailsM
  .sync()
  .then(() => console.log("Synced successfully"))
  .catch((error) => console.log("Could not sync the db:", error));

module.exports = { companyDetailsM };
