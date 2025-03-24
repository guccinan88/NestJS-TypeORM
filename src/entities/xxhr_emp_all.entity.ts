import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { DeptAll } from './xxhr_dept_all.entity';

@Entity('XXHR_EMP_ALL')
export class EmpAll {
  @PrimaryColumn({ name: 'EMP_NO' })
  empNo: string;
  @Column({ name: 'EMP_NAME' })
  empName: string;
  @Column({ name: 'DEPT_CODE' })
  deptCode: string;
  @ManyToOne(() => DeptAll, (dept) => dept.emp)
  @JoinColumn({ name: 'DEPT_CODE' })
  dept: DeptAll;
}
