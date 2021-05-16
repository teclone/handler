import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../sequelize';

export class User extends Model {}

User.init(
  {
    firstName: DataTypes.STRING,

    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'user',
  }
);
