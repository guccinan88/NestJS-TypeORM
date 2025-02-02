import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'fcc_drawings', schema: 'drawing' })
export class FccDrawingCode {
  @PrimaryColumn({ name: 'id' })
  id: number;
  @Column({ name: 'new_drawing_code' })
  newDrawingCode: string;
  @Column({ name: 'old_drawing_code' })
  oldDrawingCode: string;
}
