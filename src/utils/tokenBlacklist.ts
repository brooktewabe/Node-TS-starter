import { EventEmitter } from 'events';

interface BlacklistedToken {
  userId: string;
  exp: number;
}

class TokenBlacklist {
  private static instance: TokenBlacklist;
  private blacklist: Map<string, BlacklistedToken>;
  private cleanupInterval: NodeJS.Timeout;
  private events: EventEmitter;

  private constructor() {
    this.blacklist = new Map();
    this.events = new EventEmitter();
    
    // Cleanup expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  public static getInstance(): TokenBlacklist {
    if (!TokenBlacklist.instance) {
      TokenBlacklist.instance = new TokenBlacklist();
    }
    return TokenBlacklist.instance;
  }

  public addToBlacklist(userId: string, exp: number): void {
    this.blacklist.set(userId, { userId, exp });
    this.events.emit('tokenBlacklisted', userId);
  }

  public isBlacklisted(userId: string): boolean {
    const token = this.blacklist.get(userId);
    if (!token) return false;
    
    // Remove expired tokens
    if (token.exp < Date.now() / 1000) {
      this.blacklist.delete(userId);
      return false;
    }
    
    return true;
  }

  public removeFromBlacklist(userId: string): void {
    this.blacklist.delete(userId);
  }

  private cleanup(): void {
    const now = Date.now() / 1000;
    for (const [userId, token] of this.blacklist.entries()) {
      if (token.exp < now) {
        this.blacklist.delete(userId);
      }
    }
  }

  public onTokenBlacklisted(callback: (userId: string) => void): void {
    this.events.on('tokenBlacklisted', callback);
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
    this.events.removeAllListeners();
    this.blacklist.clear();
  }
}

export const tokenBlacklist = TokenBlacklist.getInstance();