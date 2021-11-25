import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table
export default class ShouldDelete extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  chatID: number;

  @PrimaryKey
  @Column(DataType.BIGINT)
  messageID: number;

  @Column(DataType.DATE)
  deleteAfter: Date;

  @AllowNull
  @Default(null)
  @Column(DataType.STRING(512))
  newText: string;
}
