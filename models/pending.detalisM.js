const { DataTypes } = require("sequelize");
const { dbCon } = require("../db/db");
const { usersM } = require("./usersM");

const pendingDetailsM = dbCon.define(
  "pending_details",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    new_details: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approve", "disapprove"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

pendingDetailsM.belongsTo(usersM, { foreignKey: "user_id" });
usersM.hasMany(pendingDetailsM, { foreignKey: "user_id" });

pendingDetailsM
  .sync({ alter: true })
  .then(() => console.log("pending table created"))
  .catch((err) => console.log("error: " + err));

module.exports = { pendingDetailsM };
