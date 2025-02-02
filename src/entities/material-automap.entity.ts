import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('MATERIAL_AUTOMAP')
export class MaterialAutomap {
  @PrimaryColumn({ name: 'AUTOMAP_ID' })
  automapId: number;
  @Column({ name: 'MAIN_TEMPLATE_CODE' })
  mainTemplateCode: string;
  @Column({ name: 'ITEM_SEQ' })
  itemSeq: number;
  @Column({ name: 'TYPE_KIND' })
  typeKind: string;
  @Column({ name: 'TEMPLATE_CODE' })
  templateCode: string;
  @Column({ name: 'FORM_SOURCE' })
  formSource: string;
  @Column({ name: 'FORM_FIELD' })
  formFild: string;
  @Column({ name: 'REF_SOURCE' })
  refSource: string;
  @Column({ name: 'REF_FIELD' })
  refField: string;
  @Column({ name: 'REF_DEFAULT_VALUE' })
  refDefaultValue: string;
  @Column({
    name: 'ENABLE_FLAG',
    type: 'varchar',
    transformer: {
      to: (value: boolean) => (value ? 'Y' : 'N'),
      from: (value: string) => value === 'Y',
    },
  })
  enableFlag: boolean;
}
