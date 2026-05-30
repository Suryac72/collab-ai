import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CollabDocument,
  CollabDocumentDocument,
} from '../database/schemas/document.schema';

export interface DocStateDto {
  id: string;
  docId: string;
  title: string;
  content: string;
  lastUpdatedBy: string;
  version: number;
  owner: string;
  collaborators: string[];
  updatedAt: Date;
}

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  // In-memory write buffer — flush to DB every N seconds to reduce writes
  private pendingFlush = new Map<
    string,
    { content: string; updatedBy: string; timer: ReturnType<typeof setTimeout> }
  >();

  private readonly FLUSH_DELAY_MS = 2000; // debounce writes

  constructor(
    @InjectModel(CollabDocument.name)
    private docModel: Model<CollabDocumentDocument>,
  ) {}

  // ── Get or create ──────────────────────────────────────────────────────────

  async getDocument(docId: string): Promise<DocStateDto> {
    let doc = await this.docModel.findOne({ docId });

    if (!doc) {
      doc = await this.docModel.create({
        docId,
        title:         `Document ${docId}`,
        content:       'Welcome to the collaborative editor! Highlight any text and click "Rewrite with AI" to improve it professionally.\n\nThis is a sample paragraph you can edit collaboratively in real-time. Try selecting this sentence and using the AI assistant to make it sound more professional.',
        owner:         new Types.ObjectId(),   // placeholder — reassigned on first real join
        lastUpdatedBy: 'system',
        version:       1,
        history:       [],
      });
    }

    return this.toDto(doc);
  }

  // ── Debounced update (for every keystroke) ────────────────────────────────
  // Returns an optimistic DTO immediately; DB write is debounced.

  async updateDocument(
    docId: string,
    content: string,
    updatedBy: string,
  ): Promise<DocStateDto> {
    // Cancel any pending flush for this doc
    const pending = this.pendingFlush.get(docId);
    if (pending) clearTimeout(pending.timer);

    // Schedule DB flush after FLUSH_DELAY_MS of inactivity
    const timer = setTimeout(() => this.flushToDb(docId, content, updatedBy), this.FLUSH_DELAY_MS);
    this.pendingFlush.set(docId, { content, updatedBy, timer });

    // Return optimistic state (we know the version will increment)
    const doc = await this.docModel.findOne({ docId });
    if (!doc) throw new NotFoundException(`Document ${docId} not found`);

    return {
      ...this.toDto(doc),
      content,
      lastUpdatedBy: updatedBy,
      version: doc.version + 1,
    };
  }

  private async flushToDb(docId: string, content: string, updatedBy: string) {
    try {
      await this.docModel.findOneAndUpdate(
        { docId },
        {
          $set: { content, lastUpdatedBy: updatedBy },
          $inc: { version: 1 },
          $push: {
            history: {
              $each: [{ content, savedBy: updatedBy, savedAt: new Date(), type: 'auto' }],
              $slice: -50,   // keep last 50 history entries
            },
          },
        },
        { new: true },
      );
      this.pendingFlush.delete(docId);
      this.logger.debug(`Flushed "${docId}" to MongoDB`);
    } catch (err: any) {
      this.logger.error(`DB flush failed for ${docId}: ${err.message}`);
    }
  }

  // ── AI rewrite — immediate DB write (important event) ────────────────────

  async replaceText(
    docId: string,
    originalText: string,
    replacementText: string,
    updatedBy: string,
  ): Promise<DocStateDto | null> {
    // Cancel any pending keystroke flush first
    const pending = this.pendingFlush.get(docId);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingFlush.delete(docId);
    }

    const doc = await this.docModel.findOne({ docId });
    if (!doc) return null;
    if (!doc.content.includes(originalText)) return null;

    const newContent = doc.content.replace(originalText, replacementText);

    const updated = await this.docModel.findOneAndUpdate(
      { docId },
      {
        $set: { content: newContent, lastUpdatedBy: updatedBy },
        $inc: { version: 1 },
        $push: {
          history: {
            $each: [{
              content:     newContent,
              savedBy:     updatedBy,
              savedAt:     new Date(),
              type:        'ai-rewrite',
              aiOriginal:  originalText,
              aiRewritten: replacementText,
            }],
            $slice: -50,
          },
        },
      },
      { new: true },
    );

    return updated ? this.toDto(updated) : null;
  }

  // ── History ────────────────────────────────────────────────────────────────

  async getHistory(docId: string) {
    const doc = await this.docModel.findOne({ docId }, { history: 1 });
    return doc?.history ?? [];
  }

  // ── Restore a version ─────────────────────────────────────────────────────

  async restoreVersion(docId: string, historyIndex: number, restoredBy: string): Promise<DocStateDto | null> {
    const doc = await this.docModel.findOne({ docId });
    if (!doc || !doc.history[historyIndex]) return null;

    const content = doc.history[historyIndex].content;
    const updated = await this.docModel.findOneAndUpdate(
      { docId },
      {
        $set: { content, lastUpdatedBy: restoredBy },
        $inc: { version: 1 },
      },
      { new: true },
    );
    return updated ? this.toDto(updated) : null;
  }

  // ── List all documents (dashboard) ────────────────────────────────────────

  async listDocuments(): Promise<DocStateDto[]> {
    const docs = await this.docModel
      .find({}, { history: 0 })
      .sort({ updatedAt: -1 })
      .limit(50);
    return docs.map((d) => this.toDto(d));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private toDto(doc: CollabDocumentDocument): DocStateDto {
    return {
      id:            (doc as any)._id.toString(),
      docId:         doc.docId,
      title:         doc.title,
      content:       doc.content,
      lastUpdatedBy: doc.lastUpdatedBy,
      version:       doc.version,
      owner:         doc.owner?.toString() ?? '',
      collaborators: doc.collaborators,
      updatedAt:     (doc as any).updatedAt,
    };
  }
}