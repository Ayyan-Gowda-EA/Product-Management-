from pymongo import MongoClient
import certifi

MONGO_URL = "mongodb+srv://ayyan143y_db_user:Ayyan6362123@ayyan.9abjyga.mongodb.net/"

client = MongoClient(
    MONGO_URL,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=10000
)

try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
except Exception as e:
    print("MongoDB connection failed:")
    print(e)