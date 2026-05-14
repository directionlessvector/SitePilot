import dotenv from "dotenv";

dotenv.config();

console.log("ENV LOADED:", process.env.OPENAI_API_KEY);
console.log("MONGO_URI:", process.env.MONGO_URI);