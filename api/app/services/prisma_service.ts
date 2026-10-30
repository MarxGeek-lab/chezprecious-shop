import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import env from '#start/env'

const adapter = new PrismaPg({
  connectionString: env.get('DATABASE_URL'),
  // SSL requis pour une base distante (Supabase) ; DB_SSL=false pour le Postgres Docker
  ssl: env.get('DB_SSL', true) ? { rejectUnauthorized: false } : false,
})

const prisma = new PrismaClient({ adapter })

export default prisma
