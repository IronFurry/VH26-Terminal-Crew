import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found in .env")

client = MongoClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=15000
)

# Test connection
client.admin.command("ping")

print("MongoDB connected successfully!")

# Database
db = client["pipeline_test"]

# Collection
transactions = db["transactions"]