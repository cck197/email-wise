from prisma import Prisma


async def get_db():
    db = Prisma()
    await db.connect()
    return db
