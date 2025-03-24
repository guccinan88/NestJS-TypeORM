import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('MATERIAL_REQUEST_FORM_ITEMS')
export class MaterialRequestFormItems {
  @PrimaryColumn({ name: 'MASTER_ID' })
  masterId: number;
  @PrimaryColumn({ name: 'MATERIAL_ID' })
  materialId: number;
  @Column({ name: 'MATERIAL_NO', unique: false })
  materialNo: string;
  @Column({ name: 'TEMPLATE_CODE' })
  templateCode: string;
  @Column({ name: 'MATERIAL_TYPE' })
  materialType: string;
  @Column({ name: 'PRIMARY_PLANT' })
  primaryPlant: string;
  @Column({
    name: 'TRANSFER_PLANT',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  transferPlant: boolean;
  @Column({ name: 'MATERIAL_DESCRIPTION' })
  materialDescription: string;
  @Column({ name: 'REASON' })
  reason: string;
  @Column({ name: 'REMARKS' })
  remarks: string;
  @Column({
    name: 'VALIDATION',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  validation: boolean;
  @Column({ name: 'BASE_UOM' })
  baseUom: string;
  @Column({ name: 'WEIGHT_UOM' })
  weightUom: string;
  @Column({ name: 'IS_DELETED' })
  isDeleted?: string;
  @Column({ name: 'DELETED_MATERIAL' })
  deletedMaterial?: string;
  @Column({ name: 'SOURCE_DATA' })
  sourceData: string;
  @Column({
    name: 'IS_SEMI_FINISHED',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  isSemiFinished?: boolean;
}
