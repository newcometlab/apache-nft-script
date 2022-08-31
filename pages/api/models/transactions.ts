import {Sequelize, DataTypes} from "sequelize";
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'db/database.sqlite'
});
  
const Transactions = sequelize.define("transactions", {
    isDistributed: DataTypes.BOOLEAN,
    blockTime: DataTypes.INTEGER,
    txnid : DataTypes.STRING,
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    }
}, {timestamps : false});

export default Transactions;
