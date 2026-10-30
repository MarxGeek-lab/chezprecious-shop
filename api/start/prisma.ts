import prisma from '#services/prisma_service'

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
