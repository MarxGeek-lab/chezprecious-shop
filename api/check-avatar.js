import prisma from './app/services/prisma_service.js'

async function checkAvatar() {
  const user = await prisma.user.findFirst({
    where: { 
      avatar: { not: null }
    },
    select: { id: true, email: true, avatar: true }
  })
  console.log('User avatar:', user)
  
  const store = await prisma.store.findFirst({
    where: {
      logo: { not: null }
    },
    select: { id: true, name: true, logo: true }
  })
  console.log('Store logo:', store)
}

checkAvatar().finally(() => process.exit(0))
