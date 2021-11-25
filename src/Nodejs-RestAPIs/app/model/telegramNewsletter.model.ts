import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table
export default class TelegramNewsletter extends Model {
  @PrimaryKey
  @Column(DataType.BIGINT)
  chatId: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  enabled: boolean;

  @Default("1500")
  @Column(DataType.STRING(4))
  sendAt: string;

  @Default("[0,1,3,8]")
  @Column(DataType.STRING(64))
  sendDaysBefore: string;
}
