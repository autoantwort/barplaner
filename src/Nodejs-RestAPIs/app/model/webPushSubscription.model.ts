import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table
export default class WebPushSubscription extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  endpoint: string;

  @Column(DataType.STRING)
  subscription: string;
}
