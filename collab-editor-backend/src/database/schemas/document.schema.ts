import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollabDocumentDocument = CollabDocument & Document;

// ── Embedded sub-schema: one entry per save ───────────────────────────────────
@Schema({ _id: false })
export class HistoryEntry {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  savedBy: string;   // displayName

  @Prop({ required: true })
  savedAt: Date;

  @Prop({ default: 'manual' })
  type: 'manual' | 'ai-rewrite' | 'auto';

  @Prop()
  aiOriginal?: string;   // what was replaced

  @Prop()
  aiRewritten?: string;  // what it became
}

export const HistoryEntrySchema = SchemaFactory.createForClass(HistoryEntry);

// ── Main document schema ──────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class CollabDocument {
  @Prop({ required: true, unique: true, index: true })
  docId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ default: [] })
  collaborators: string[];   // array of user emails

  @Prop({ default: 1 })
  version: number;

  @Prop()
  lastUpdatedBy: string;

  @Prop({ type: [HistoryEntrySchema], default: [] })
  history: HistoryEntry[];

  @Prop({ default: false })
  isPublic: boolean;
}

export const CollabDocumentSchema = SchemaFactory.createForClass(CollabDocument);