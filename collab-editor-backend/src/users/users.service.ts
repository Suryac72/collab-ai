import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';

interface CreateUserDto {
  googleId:    string;
  email:       string;
  displayName: string;
  avatar:      string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findOrCreate(dto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ googleId: dto.googleId });
    if (existing) {
      // Update profile info in case it changed in Google
      existing.displayName = dto.displayName;
      existing.avatar      = dto.avatar;
      return existing.save();
    }
    return this.userModel.create(dto);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }
}