import prisma from './app/services/prisma_service.js'

async function fixUploadUrls() {
  console.log('Fixing upload URLs...')

  const usersWithAvatar = await prisma.user.findMany({
    where: { avatar: { contains: '/api-backend/uploads/' } },
  })

  for (const user of usersWithAvatar) {
    const fixedUrl = user.avatar?.replace('/api-backend/uploads/', '/uploads/')
    if (fixedUrl && fixedUrl !== user.avatar) {
      await prisma.user.update({ where: { id: user.id }, data: { avatar: fixedUrl } })
      console.log(`Fixed avatar for user ${user.email}: ${fixedUrl}`)
    }
  }

  console.log('Done!')
}

fixUploadUrls().catch((error) => {
  console.error(error)
  process.exit(1)
})
