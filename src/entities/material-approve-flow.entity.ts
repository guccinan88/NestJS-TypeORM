import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MATERIAL_APPROVE_FLOW')
export class MaterialApproveFlow {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id?: number;
  @Column({ name: 'APPROVE_TEMPLATE' })
  approveTemplate: string;
  @Column({ name: 'GROUP_ID' })
  groupId: number;
  @Column({ name: 'RANK' })
  rank: number;
  @Column({ name: 'STATUS_CODE' })
  statusCode: string;
  @Column({ name: 'STATUS_CODE_DESCRIPTION' })
  statusCodeDescription: string;
  @Column({ name: 'CONVERT_APPROVE_CONDITION' })
  convertApproveCondition: string;
  @Column({ name: 'OWNER' })
  owner: string;
}
