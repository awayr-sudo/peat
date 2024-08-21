const { DataTypes } = require("sequelize");
const { usersM } = require("./usersM");
const { attendanceM } = require("./attendanceM");
const { dbCon } = require("../db/db");
const { duration } = require("moment");

const BreaksM = dbCon.define(
  "Breaks",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: usersM,
        key: "id",
      },
    },
    start_break: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_break: {
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

    break_duration: {
      type: DataTypes.VIRTUAL,
      get() {
        const startBreak = this.getDataValue("start_break");
        const endBreak = this.getDataValue("end_break");

        if (startBreak && endBreak) {
          const breakTrack = new Date(endBreak - startBreak); // duration in (hh:mm:ss) format
          return breakTrack;
        }
        return null;
      },
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

BreaksM.belongsTo(usersM, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

BreaksM.sync()
  .then(() => {
    console.log("BreaksM table synced successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

module.exports = BreaksM;
