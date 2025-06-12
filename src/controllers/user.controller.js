import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

// to register the user
// input name, email, avatar, fullname, password  (check from maodel which details are needed)
// validation for email etc
// check if already exist in db
    // if yes tell the user (email should be unique)
// check for images, avatar file
// save them in db (images, avatar in cloudinary)
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return response
// forward to login
const registerUser = asyncHandler( async (req, res) =>{
    const {fullName, email, userName, password} = req.body
    console.log("email :: ", email);
    // if(fullName === ""){
    //     throw new ApiError(400, "Full name is required")
    // }
    if([fullName, email, userName, password].some((field)=>field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    // console.log("All fields not empty")
    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with same email or username exist already! ")
    }
    // console.log("no existing user")

    // provided by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // console.log("File path from local storage:: ", avatarLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatart file is required!! ")
    }

    // console.log("uploading on cloudinary")
    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required!! ");
    }
    // console.log("uploaded on cloudinary")
    // make entry in db
    const user = await User.create({
                    fullName,
                    avatar: avatar.url,
                    coverImage: coverImage?.url || "",
                    email,
                    password,
                    userName: userName.toLowerCase()
                })
    // user data except password and refresh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating the user")
    }
    // console.log("user created")
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully !! ")
    )

})

export {registerUser}