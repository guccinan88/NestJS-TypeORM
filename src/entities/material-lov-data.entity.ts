import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('MATERIAL_LOV_DATA')
export class MaterialLovData {
  @PrimaryColumn({ name: 'LOV_ID' })
  lovId: number;

  @PrimaryColumn({ name: 'LOV_GROUP' })
  lovGroup: string;

  @PrimaryColumn({ name: 'LOV_CODE' })
  lovCode: string;

  @Column({ name: 'LOV_DESCRIPTION' })
  lovDescription: string;

  @Column({ name: 'PARENT_LOV_VALUE' })
  parentLovValue: string;

  @Column({ name: 'ENABLE_FLAG' })
  enableFlag: boolean;
  @Column({
    name: 'DESCRIPTION_COMBINATION',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  descriptionCombination: boolean;
  @Column({
    name: 'FROM_EDGE_DATA',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  fromEdgeData: boolean;
  @Column({ name: 'ATTR_V1' })
  attrV1?: string;
  @Column({ name: 'ATTR_V2' })
  attrV2?: string;
  @Column({ name: 'ATTR_V3' })
  attrV3?: string;
}
