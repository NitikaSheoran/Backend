// require('dotenv').config({path: './env'})  not good for consistency of code

import dotenv from 'dotenv'

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

dotenv.config({path: './env'})


/*

1st approach to connect database

import express from 'express'
const app = express()

;( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("Error:: ", error)
            throw(error)
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(error){
        console.log("Error:: ", error)
        throw error
    }
})();

*/

// 2nd approach --> write code in other folder and import from there --> clean code, modular

import connectDB from "./db/index.js";

connectDB()