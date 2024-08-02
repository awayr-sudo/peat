const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");

const pendingDetailsM = dbCon.define(
  "pending_details",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    new_details: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approve", "reject"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

pendingDetailsM
  .sync({ alter: true })
  .then(() => console.log("pending table created"))
  .catch((err) => console.log("error: " + err));

module.exports = { pendingDetailsM };
