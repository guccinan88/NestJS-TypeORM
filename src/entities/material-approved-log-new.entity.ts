import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MATERIAL_APPROVE_LOG_NEW')
export class MaterialApprovedLogNew {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id?: number;
  @Column({ name: 'MASTER_ID' })
  masterId?: number;
  @Column({ name: 'APPROVER' })
  approver?: string;
  @Column({ name: 'UPDATED_BY' })
  updatedBy?: string;
  @Column({ name: 'STAGE_TYPE' })
  stageType?: string;
  @Column({ name: 'STATUS' })
  status?: string;
  @Column({ name: 'REASON' })
  reason?: string;
  @Column({ name: 'CREATED_AT' })
  createdAt?: Date;
  @Column({ name: 'UPDATED_AT' })
  updatedAt?: Date;
  @Column({ name: 'APPROVE_TEMPLATE' })
  approveTemplate?: string;
  @Column({ name: 'RANK' })
  rank?: number;
}
