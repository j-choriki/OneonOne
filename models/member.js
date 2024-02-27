'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Member.belongsTo(models.Group);
      Member.belongsTo(models.Team);
    }
  }
  Member.init({
    name: DataTypes.STRING,
    memberNum: DataTypes.STRING,
    pass: DataTypes.STRING,
    groupId: DataTypes.INTEGER,
    teamId: DataTypes.INTEGER,
    state: DataTypes.STRING,
    authority: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Member',
  });
  return Member;
};