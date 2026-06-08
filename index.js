const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbConnection;
async function connectDB() {
  if (dbConnection) return dbConnection; 
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    dbConnection = client.db("LeadSkillIT");
    return dbConnection;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}


async function getCollection(collectionName) {
  const db = await connectDB();
  return db.collection(collectionName);       
}


app.get('/', (req, res) => {
  res.json({ message: 'Server চলছে!' });
});


app.get('/api/users', async (req, res) => {
  try {
    const usersCollection = await getCollection("users");
    const users = await usersCollection.find({}).toArray();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা হয়েছে!' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const usersCollection = await getCollection("users");
    const result = await usersCollection.insertOne(userData);
    
    res.status(201).json({ 
      success: true, 
      message: 'ডেটা সফলভাবে সেভ হয়েছে!', 
      insertedId: result.insertedId 
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা হয়েছে!' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'ভুল আইডি ফরম্যাট!' });
    }

    const usersCollection = await getCollection("users");
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status: status || "PENDING" } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি!' });
    }

    res.status(200).json({ success: true, message: `স্ট্যাটাস সফলভাবে ${status} করা হয়েছে!` });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা হয়েছে!' });
  }
});


if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;