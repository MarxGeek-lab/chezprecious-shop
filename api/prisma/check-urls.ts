import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
prisma.productImage.findMany({ take: 10, select: { url: true } })
  .then(r => { r.forEach(i => console.log(i.url)); return prisma.$disconnect() })
