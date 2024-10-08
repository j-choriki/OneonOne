'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class title extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  title.init({
    name: DataTypes.STRING,
    user1: DataTypes.STRING,
    user2: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'title',
  });
  return title;
};