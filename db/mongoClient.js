import mongoose from 'mongoose';

const connectToMongoDB = async (uri) => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

const disconnectFromMongoDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export { connectToMongoDB, disconnectFromMongoDB };
