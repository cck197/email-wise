async def get_email_generator(db, id):
    return await db.emailgenerator.find_first(
        where={"id": id}, include={"emailProvider": True, "llmProvider": True}
    )
