
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL is missing from .env file")

client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=10000)

db = client["product_management"]

products_collection = db["products"]
users_collection = db["users"]
sessions_collection = db["sessions"]
profiles_collection = db["profiles"]

try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")

    users_collection.create_index("email", unique=True)
    print("Unique email index created successfully!")

except Exception as e:
    print("MongoDB connection failed:", e)
    raise
