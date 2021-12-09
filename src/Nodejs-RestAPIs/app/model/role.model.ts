import { Model, Table, Column, DataType, HasMany } from "sequelize-typescript";
import Setting from "./setting.model.js";

@Table
export default class Role extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  name: string;

  @Column(DataType.STRING(1024))
  description: string;
}
