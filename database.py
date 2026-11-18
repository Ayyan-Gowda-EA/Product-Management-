import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

client = MongoClient(MONGODB_URL)

db = client["product_management"]

products_collection = db["products"]

try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
except Exception as e:
    print("MongoDB connection failed:", e)