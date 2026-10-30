import prisma from '#services/prisma_service'

class ActivityLogService {
  async log(payload: {
    adminId?: string
    adminEmail?: string
    adminRole?: string
    action: string
    entity?: string
    entityId?: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          ...payload,
          metadata: payload.metadata as object | undefined,
        },
      })
    } catch (err) {
      console.error('[ActivityLog] failed:', err)
    }
  }
}

export default new ActivityLogService()
