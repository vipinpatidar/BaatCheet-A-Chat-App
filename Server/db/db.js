import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL);
    console.log(
      `\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
    );
    //  console.log(connectionInstance);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
