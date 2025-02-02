import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MATERIAL_REQUEST_ITEMS_UOM')
export class MaterialRequestItemsUom {
  @PrimaryGeneratedColumn({ name: 'MASTER_ID' })
  masterId?: number;
  @PrimaryColumn({ name: 'MATERIAL_ID' })
  materialId: number;
  @Column({ name: 'CHARACTERISTIC_NAME' })
  characteristicName: string;
  @Column({ name: 'BASIC_UNIT_QTY' })
  basicUnitQty: number;
  @Column({ name: 'ALTERNATIVE_UOM_QTY' })
  alternativeUomQty: number;
  @Column({ name: 'ALTERNATIVE_UOM' })
  alternativeUom: string;
  @Column({
    name: 'CHARACTERISTIC',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  characteristic?: boolean;
  @Column({ name: 'LAST_UPDATE_DATE' })
  lastUpdateDate?: Date;
}
