import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('MATERIAL_TEMPLATE')
export class MaterialTemplate {
  @PrimaryColumn({ name: 'TEMPLATE_CODE' })
  templateCode: string;
  @Column({ name: 'TEMPLATE_NAME' })
  templateName: string;
  @Column({ name: 'ENABLE_FLAG' })
  enableFlag: boolean;
}
