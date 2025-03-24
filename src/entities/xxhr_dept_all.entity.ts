import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { EmpAll } from './xxhr_emp_all.entity';

@Entity('XXHR_DEPT_ALL')
export class DeptAll {
  @PrimaryColumn({ name: 'DEPT_CODE' })
  deptCode: string;
  @Column({ name: 'DEPT_NAME' })
  deptName: string;
  @Column({ name: 'BOSS_EMP_NO' })
  bossEmpNo: string;

  @OneToMany(() => EmpAll, (emp) => emp.dept)
  emp: EmpAll[];
}
