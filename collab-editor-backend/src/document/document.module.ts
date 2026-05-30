import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentGateway } from './document.gateway';
import { GroqService } from './groq.service';
import { DocumentService } from './document.service';
import { CollabDocument, CollabDocumentSchema } from '../database/schemas/document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CollabDocument.name, schema: CollabDocumentSchema },
    ]),
    // Register JwtModule directly — gives JwtService to DocumentGateway
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        secret:      cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [DocumentGateway, GroqService, DocumentService],
})
export class DocumentModule {}