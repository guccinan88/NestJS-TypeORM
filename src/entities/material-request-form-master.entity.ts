import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('MATERIAL_REQUEST_FORM_MASTER')
export class MaterialRequestFormMaster {
  @PrimaryColumn({ name: 'MASTER_ID' })
  masterId: number;
  @Column({ name: 'FORM_NO' })
  formNo?: string;
  @Column({ name: 'USER_ID' })
  userId: string;
  @Column({ name: 'STATUS_CODE' })
  statusCode: string;
  @Column({ name: 'CREATED_BY' })
  createdBy: string;
  @Column({ name: 'SUBMIT_DATE' })
  submitDate?: Date;
  @Column({ name: 'UPDATED_DATE' })
  updatedDate?: Date;
  @Column({ name: 'UPDATED_BY' })
  updatedBy?: Date;
  @Column({ name: 'DEPT_BOSS_REMARKS' })
  deptBossRemarks?: string;
  @Column({ name: 'MATERIAL_TEAM_REMARKS' })
  materialTeamRemarks?: string;
  @Column({ name: 'RETURN_REMARKS' })
  returnRemarks?: string;
}
