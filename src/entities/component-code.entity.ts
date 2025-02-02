import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'component_code_items', schema: 'pp' })
export class ComponentCode {
  @PrimaryColumn({ name: 'id' })
  id: number;

  @Column({ name: 'component_code' })
  componentCode: string;

  @Column({ name: 'component_item_number' })
  componentItemNumber: string;

  @Column('numeric', { name: 'wt_rate' })
  wtRate: number;

  @Column('numeric', { name: 'at_rate' })
  atRate: number;
}
