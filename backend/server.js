import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"

import authRoutes from "./routes/authRoutes.js"

import websiteRoutes from "./routes/websiteRoutes.js"
import userRoutes from "./routes/userRoutes.js"

import pageRoutes from "./routes/pageRoutes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/websites", websiteRoutes)
app.use("/api/users", userRoutes)
app.use("/api/pages", pageRoutes)

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err))

// Routes
app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
  res.send("API running")
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})