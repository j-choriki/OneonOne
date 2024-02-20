'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Message.init({
    user1: DataTypes.STRING,
    user2: DataTypes.STRING,
    msg: DataTypes.TEXT,
    send_time: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};