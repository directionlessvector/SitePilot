import "./config/env.js";   // 🔥 MUST BE FIRST LINE


import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
dotenv.config()
console.log("ENV CHECK:", process.env.OPENAI_API_KEY)

import authRoutes from "./routes/authRoutes.js"

import websiteRoutes from "./routes/websiteRoutes.js"
import userRoutes from "./routes/userRoutes.js"


import pageRoutes from "./routes/pageRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"

const app = express()
app.use(cors())
app.use(express.json())
app.use("/api/websites", websiteRoutes)
app.use("/api/users", userRoutes)
app.use("/api/pages", pageRoutes)
app.use("/api/ai", aiRoutes)

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  dbName: "sitepilot"
})
.then(() => {
  console.log("MongoDB connected")
  console.log("DB NAME:", mongoose.connection.name)
})
.catch(err => console.log(err))
// Routes
app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
  res.send("API running")
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})