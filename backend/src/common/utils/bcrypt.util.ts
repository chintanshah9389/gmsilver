import * as bcrypt from 'bcrypt';

export class BcryptUtil {
  static async hash(value: string, rounds = 12): Promise<string> {
    return bcrypt.hash(value, rounds);
  }

  static async compare(value: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(value, hashed);
  }

  static async hashMpin(mpin: string): Promise<string> {
    return bcrypt.hash(mpin, 10);
  }

  static async compareMpin(mpin: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(mpin, hashed);
  }
}
