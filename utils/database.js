import mongoose from 'mongoose';

// ✅ Load the MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ MONGODB_URI is not set in your environment or GitHub Secrets.');
  process.exit(1);
}

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) return;

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = true;
    console.log('✅ Successfully connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}
