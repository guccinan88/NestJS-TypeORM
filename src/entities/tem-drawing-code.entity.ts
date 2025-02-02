import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tem_drawings', schema: 'drawing' })
export class TemDrawingCode {
  @PrimaryColumn({ name: 'id' })
  id: number;
  @Column({ name: 'new_drawing_code' })
  newDrawingCode: string;
  @Column({ name: 'old_drawing_code' })
  oldDrawingCode: string;
}
