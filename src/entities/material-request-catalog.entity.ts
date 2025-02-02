import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('MATERIAL_REQUEST_CATALOG')
export class MaterialRequestCatalog {
  @PrimaryColumn({ name: 'MATERIAL_ID' })
  materialId: number;
  @Column({ name: 'MASTER_ID' })
  masterId: number;
  @Column({ name: 'CATALOG_GROUP' })
  catalogGroup: string;
  @Column({ name: 'CATALOG_CODE' })
  catalogCode: string;
  @Column({ name: 'CATALOG_SEQ' })
  catalogSeq: number;
  @Column({ name: 'CATALOG_VALUE' })
  catalogValue: string;
  @Column({ name: 'CATALOG_DESCRIPTION' })
  catalogDescription: string;
  @Column({ name: 'INPUT_METHOD' })
  inputMethod: string;
  @Column({ name: 'UPDATED_DATE' })
  updatedDate?: Date;
}
