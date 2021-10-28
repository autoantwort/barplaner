import {
  AllowNull,
  Column,
  DataType,
  Default,
  Table,
  Model,
} from "sequelize-typescript";

@Table
export default class Bar extends Model {
  @Column(DataType.STRING)
  name: string;

  @AllowNull(true)
  @Default(null)
  @Column(DataType.TEXT)
  description: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  public: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  canceled: boolean;

  @Column(DataType.DATE)
  start: Date;

  @AllowNull(true)
  @Default(null)
  @Column(DataType.DATE)
  end: Date;

  @AllowNull(true)
  @Default(null)
  @Column(DataType.STRING)
  facebookEventID: string;

  @AllowNull(true)
  @Default(null)
  @Column(DataType.STRING(512))
  facebookCoverImageURL: string;
}
