import { Model, Table, Column, DataType, HasMany } from "sequelize-typescript";
import Setting from "./setting.model";

@Table
export default class Role extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  @HasMany(() => Setting, { constraints: false, foreignKey: "permission" })
  name: string;

  @Column(DataType.STRING(1024))
  description: string;
}
