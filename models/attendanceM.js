const { DataTypes } = require("sequelize");
const { usersM } = require("./usersM");
const { dbCon } = require("../db/db");

const AttendanceM = dbCon.define(
  "Attendance",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    check_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
  }
);

AttendanceM.belongsTo(usersM, {
  foreignKey: "user_id",
});

AttendanceM.sync({ alter: true })
  .then(() => {
    console.log("Attendance table synced successfully!");
  })
  .catch((error) => {
    console.error("Unable to sync table : ", error);
  });

module.exports = AttendanceM;
