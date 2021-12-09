import {
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

enum BardutyState {
  ABSENT = "absent",
  NO_INFO = "no_info",
  PRESENT = "present",
}

@Table
class Barduty extends Model {
  @PrimaryKey
  @Column(DataType.INTEGER)
  barID: number;

  @PrimaryKey
  @Column(DataType.INTEGER)
  userID: number;

  @Default(BardutyState.NO_INFO)
  @Column({ type: DataType.ENUM, values: ["absent", "no_info", "present"] })
  state: BardutyState;

  @Default("")
  @Column(DataType.STRING)
  job: string;

  @Default("")
  @Column(DataType.STRING)
  from: string;

  @Default("")
  @Column(DataType.STRING)
  to: string;

  @Default("")
  @Column(DataType.BOOLEAN)
  have_to_clean: boolean;
}

export default Barduty;
