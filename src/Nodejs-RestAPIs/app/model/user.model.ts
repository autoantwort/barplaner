import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from "sequelize-typescript";

@Table
export default class User extends Model {
  @Column({ type: DataType.STRING, unique: true })
  name: string;

  @Column(DataType.STRING)
  pasword: string;

  @AllowNull
  @Default(null)
  @Column(DataType.STRING)
  email: string;

  @AllowNull
  @Default(null)
  @Column(DataType.STRING)
  phone: string;

  @Default(() => "login pin: " + (Math.random() * 1000000).toFixed(0))
  @Column(DataType.STRING)
  telegramID: string;

  @AllowNull
  @Default(null)
  @Column(DataType.BIGINT)
  gitlabID: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  active: boolean;

  @Column({ type: DataType.STRING, unique: true })
  sessionID: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  experienced_cleaner: boolean;

  @AllowNull
  @Default(null)
  @Column(DataType.STRING(10))
  birthday: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  only_show_gitlab_notifications_if_assigned: boolean;
}
