import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('MATERIAL_RULE')
export class MaterialRule {
  @PrimaryColumn({ name: 'TEMPLATE_CODE' })
  templateCode: string;

  @PrimaryColumn({ name: 'CATALOG_CODE' })
  catalogCode: string;

  @Column({ name: 'CATALOG_NAME' })
  catalogName: string;

  @Column({ name: 'CATALOG_SEQ' })
  catalogSeq: number;

  @Column({ name: 'CATALOG_GROUP' })
  lovGroup: string;

  @Column({ name: 'PARENT_CATALOG_GROUP' })
  parentLovGroup: string;

  @Column({ name: 'INPUT_METHOD' })
  inputMethod: string;

  @Column({
    name: 'ENABLE_FLAG',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  enableFlag: boolean;

  @Column({
    name: 'MUST_FLAG',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  mustFlag: boolean;

  @Column({
    name: 'COMBINATION_FLAG',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  combinationFlag: boolean;
  @Column({ name: 'GROUP_CODE' })
  groupCode?: string;
}
