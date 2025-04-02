import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MATERIAL_APPROVED_LOG')
export class MaterialApprovedLog {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id?: number;
  @Column({ name: 'MASTER_ID' })
  masterId: number;
  @Column({ name: 'USER_ID' })
  userId: string;
  @Column({ name: 'USER_NAME' })
  userName: string;
  @Column({ name: 'STATUS_CODE' })
  statusCode: string;
  @Column({ name: 'CREATED_DATE' })
  createDate?: Date;
  @Column({ name: 'IS_FINISH' })
  isFinish?: string;
  @Column({ name: 'MANUAL_REASON' })
  manualReason?: string;
  @Column({ name: 'SYSTEM_REASON' })
  systemReason?: string;
}
