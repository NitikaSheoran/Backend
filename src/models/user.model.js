import mongoose from "mongoose";
import bcrypt from 'bcrypt'  //For securely hashing passwords
import jws from 'jsonwebtoken' //For creating access and refresh tokens.

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is necessary"]
    },
    refreshToken: {
        type: String
    }
}, {timestamps: true});


// A pre-save middleware that runs before saving a document.
userSchema.pre("save", async function(next){  //cant use arrow function as it does not have access to current context
    // Only hashes the password if it's modified
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})


//  custom methods
userSchema.method.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.method.generateAccessToken = function(){
    return jws.sign(
        {
            _id : this._id,
            userName: this.userName,
            fullName: this.fullName,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.method.generateRefreshToken = function(){
    return jws.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = new mongoose.model("User", userSchema);