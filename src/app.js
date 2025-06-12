// Web framework for building APIs and servers in Node.js.
import express from 'express'

// Middleware to parse cookies from incoming HTTP requests
import cookieParser from 'cookie-parser';

// Middleware to enable Cross-Origin Resource Sharing (CORS), which allows your backend to respond to requests from different origins
import cors from 'cors'

// Initializes an Express application instance
const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// Parses incoming JSON requests
app.use(express.json({
    limit: "16kb"
}))

app.use(express.static("public"))

app.use(express.urlencoded({
    limit: "16kb",
    extended: true
}))

app.use(cookieParser())




// routes
import userRouter from './routes/user.routes.js'




// routes declaration
app.use("/api/v1/users", userRouter)
// http://localhost:8000/api/v2/users/register


export {app}