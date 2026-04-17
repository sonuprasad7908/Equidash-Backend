import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv('.env')

async def delete_user():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    result = await db.users.delete_one({'email': 'sonu.prasaddav2@gmail.com'})
    print(f'Deleted: {result.deleted_count} user(s)')
    client.close()

asyncio.run(delete_user())
