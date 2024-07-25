const { DataTypes } = require("sequelize");
const { usersM } = require("./usersM");
const { dbCon } = require("../db/db");

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
      allowNull: false,
    },
    end_break: {
      type: DataTypes.DATE,
      allowNull: false,
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

BreaksM.belongsTo(usersM, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

BreaksM.sync({ alter: true })
  .then(() => {
    console.log("BreaksM table synced successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

module.exports = BreaksM;
