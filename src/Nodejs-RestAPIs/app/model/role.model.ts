import { Model, Table, Column, DataType } from "sequelize-typescript";

@Table
export default class Role extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  name: string;

  @Column(DataType.STRING(1024))
  description: string;
}
