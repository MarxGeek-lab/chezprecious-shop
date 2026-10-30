import jwt from 'jsonwebtoken'
import env from '#start/env'

export interface JwtPayload {
  userId: string
  email: string
  role: string
  isAdmin?: boolean
}

export default class JwtService {
  private static get secret() {
    return env.get('JWT_SECRET')
  }

  private static get expiresIn() {
    return env.get('JWT_EXPIRES_IN', '7d')
  }

  static generateToken(payload: JwtPayload): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any })
  }

  static generateAdminToken(payload: JwtPayload, expiresIn: string): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn as any })
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload
  }
}
