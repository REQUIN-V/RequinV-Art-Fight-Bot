import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI; // Set this in your GitHub Secrets or .env file

export async function connectToDatabase() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}
