from prisma import Prisma, get_client


async def get_db(auto_register=True):
    db = Prisma(auto_register=auto_register)
    await db.connect()
    return db
