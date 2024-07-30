const { Sequelize } = require("sequelize");

const dbCon = new Sequelize("mydb", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

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

module.exports = {
  dbCon,
  dbConStatus,
};
