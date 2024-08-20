const { Sequelize } = require("sequelize");
require("dotenv").config();

const dbCon = new Sequelize(
  process.env.DATABASE,
  process.env.USER_NAME,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
  }
);

const dbConStatus = () => {
  dbCon
    .authenticate()
    .then(() => {
      console.log("Connection has been established successfully");
    })
    .catch((error) => {
      console.error("Unable to connect to the database:", error);
    });
};



dbCon.authenticate({alter:true}).then(() => {
  console.log('Connection has been established successfully.');
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});

module.exports = {
  dbCon,
  dbConStatus,
};
