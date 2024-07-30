// const { DataTypes } = require("sequelize");
// const { dbCon } = require("../db/db");
// const { usersM } = require("./usersM");
// const {user}= require("../routes/user");
// const contact_detailsM = dbCon.define("contact_details", {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   user_id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: usersM,
//       key: "id",
//     },
//   },
  
//   phone_number: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   house_address: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
// });
// usersM.hasOne(contact_detailsM,{
//     foreignKey:"id"
// })
// contact_detailsM.hasOne(usersM,{
//     foreignKey:"id"
// })


// contact_detailsM
//   .sync({ alter: true })
//   .then(() => console.log("Projects_Assigned table synced"))
//   .catch((err) => console.log("Error syncing Projects_Assigned table", err));

// module.exports = { contact_detailsM };
