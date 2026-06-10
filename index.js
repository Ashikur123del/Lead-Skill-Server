const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// CORS কনফিগারেশন: শুধুমাত্র একবারই ব্যবহার করুন
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'https://leadskillit.com',
    'https://www.leadskillit.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

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

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Server is running perfectly!' });
});

app.get('/api/users', async (req, res) => {
  try {
    const usersCollection = await getCollection("users");
    const users = await usersCollection.find({}).toArray();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const usersCollection = await getCollection("users");
    const result = await usersCollection.insertOne(userData);
    res.status(201).json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/enquiries', async (req, res) => {
  try {
    const enquiryData = req.body;
    if (!enquiryData.fullName || !enquiryData.email || !enquiryData.message) {
      return res.status(400).json({ success: false, message: 'Required fields missing!' });
    }
    const enquiriesCollection = await getCollection("enquiries");
    const result = await enquiriesCollection.insertOne({
      ...enquiryData,
      createdAt: new Date() 
    });
    res.status(201).json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Vercel এর জন্য এক্সপোর্ট
module.exports = app;

// লোকালহোস্টের জন্য লিসেন
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}