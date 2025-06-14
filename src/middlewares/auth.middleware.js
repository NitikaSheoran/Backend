// verify if there's user

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler (async (req, _, next)=>{
    try {
        // console.log("jwt middleware")
        const token = req.cookies?.accessToken  ||  req.header("Authorization")?.replace("Bearer ","")
        // console.log("token for logout:: ", token)
        if(!token){
            console.log("token not found")
            throw new ApiError(401, "Unauthorized request")
        }
        

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log("token decoded")
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            // todo: discuss about frontend
            throw new ApiError(401, "Invalid access token")
        }
        // console.log("user found")
    
        req.user = user;
        // console.log("user object added in request")
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
    }
})
