import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from "sequelize-typescript";
import Role from "./role.model.js";

@Table
export default class Setting extends Model {
  @Column({ type: DataType.STRING, primaryKey: true })
  name: string;

  @AllowNull
  @Default(null)
  @Column({ type: DataType.STRING, references: { model: Role, key: "name" } })
  permission: string;

  @Default("")
  @Column(DataType.STRING(512))
  description: string;

  @Default("")
  @Column(DataType.STRING(256))
  value: string;
}