import { User } from '../entities/user.entity';
import { IBaseRepository } from './base.repository';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void>;
}
