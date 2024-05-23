from prisma import Prisma, get_client


# call this once when your app starts
# then call get_client() each time you need a client
async def connect(auto_register=True):
    db = Prisma(auto_register=auto_register)
    await db.connect()
    return get_client()
