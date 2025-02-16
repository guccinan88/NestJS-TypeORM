import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
@Entity('MATERIAL_REQUEST_PLANT')
export class MaterialRequestPlant {
  @PrimaryGeneratedColumn({ name: 'MATERIAL_PLANT_ID' })
  materialPlantId?: number;
  @Column({ name: 'MATERIAL_ID' })
  materialId: number;
  @Column({ name: 'PLANT' })
  plant?: string;
  @Column({ name: 'PROC_TYPE' })
  procType?: string;
  @Column({ name: 'SPPROC_TYPE' })
  spprocType?: string;
  @Column({ name: 'PUR_UOM' })
  purUom?: string;
  @Column({ name: 'PUR_GROUP' })
  purGroup?: string;
  @Column({ name: 'PRODUCT_UOM' })
  productUom?: string;
  @Column({ name: 'SALES_UOM' })
  salesUom?: string;
  @Column({ name: 'MRP_CONTROLLER' })
  mrpController?: string;
  @Column({ name: 'MRP_TYPE' })
  mrpType?: string;
  @Column({ name: 'DEP_REQ_ID' })
  depReqId?: string;
  @Column({
    name: 'WORK_SCHED_VIEW',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  workSchedView?: boolean;
  @Column({ name: 'PRODPROF' })
  prodprof?: string;
  @Column({ name: 'LOTSIZEKEY' })
  lotsizekey?: string;
  @Column({
    name: 'IND_POST_TO_INSP_STOCK',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  indPostToInspStock?: boolean;
  @Column({
    name: 'SOURCELIST',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  sourcelist?: boolean;
  @Column({ name: 'PURCHASE_ORDER_CONTENT' })
  purchaseOrderContent?: string;
  @Column({ name: 'DELYG_PLNT' })
  delygPlnt?: string;
  @Column({ name: 'UPDATED_DATE' })
  updatedDate?: Date;
}
