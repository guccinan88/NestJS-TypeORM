import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MATERIAL_APPROVE_FLOW_NEW')
export class MaterialApproveFlowNew {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id?: number;
  @Column({ name: 'APPROVE_TEMPLATE' })
  approveTemplate: string;
  @Column({ name: 'RANK' })
  rank: number;
  @Column({ name: 'STAGE_TYPE' })
  stageType: string;
  @Column({ name: 'STATUS_DESCRIPTION' })
  statusDescription: string;
}
