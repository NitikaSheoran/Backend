import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// generate tokens
const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// register
const registerUser = asyncHandler( async (req, res) =>{
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

// Login
const loginUser = asyncHandler(async (req, res)=>{
    // req.body -> data
    // userName based or email based login
    // find the user
    // password check
    // access and refresh token generated and sent to user
    // sent using cookies (secure cookies)
    // successfull login

    const {email, userName, password} = req.body
    console.log("email::", email, "  password:: ", password, "  username:: ", userName)


    if(!userName && !email){
        throw new ApiError(400, "enter either userName or email")
    }
    console.log("Atleast one credential present")


    const existedUser = await User.findOne({
        $or : [{userName}, {email}]
    })
    if(!existedUser){
        throw new ApiError(400, "User does not exist")
    }
    console.log("one user with same credentials availabel")


    const isPasswordValid = await existedUser.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }
    console.log("valid password")


    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(existedUser._id)
    console.log("access and refresh token generated")


    const loggedInUser = await User.findById(existedUser._id).select(
        "-password -refreshToken"
    )
    console.log("logged in user:: ", loggedInUser)

    //cookies 
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

// logout
const logoutUser = asyncHandler(async (req, res) => {
    // available bec of middleware
    const id = req.user._id
    await User.findByIdAndUpdate(
        id,
        {
            $set: {refreshToken: undefined}
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User loggedOut successfully"))
})

// refresh token endpoint
const refreshAccessToken = asyncHandler( async (req, res)=>{
    // access refresh token from cookies
    // match it with refresh token present in db
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorised request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if(!decodedToken){
            throw new ApiError(400, "issue with refresh token")
        }
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "user not found")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token expired")
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        const options = {httpOnly: true, secure: true}
    
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", newRefreshToken, options).json( new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "new refreshToken generated"))
    } catch (error) {
        throw new ApiError(400, error.message)
    }
})


// user manipulations

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res.status(200).json(
        new ApiResponse(200, req.user, "current user")
    )
})


const updatePassword = asyncHandler(async (req, res)=>{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordMatching = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordMatching){
        throw new ApiError(400, "invalid password")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200, user, "passwordUpdated")
    )
})

const updateUserDetails = asyncHandler(async (req, res)=>{
    const {fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400, "both fullname and email are required to be updated")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password");

    return res.status(200).json(
        new ApiResponse(200, user, "Details updated")
    )
})

const updateAvatar = asyncHandler( async (req, res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file not found")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar){
        throw new ApiError(400, "avatar not uploaded on cloudinary")
    }


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    // TODO:: Delete previous avatar from cloudinary

    return res.status(200).json(
        new ApiResponse(200, user, "avatar updated")
    )
})

const updateCoverImage = asyncHandler( async (req, res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage not found")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage){
        throw new ApiError(400, "coverImage not updated on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {coverImage: coverImage.url}
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200, user, "cover Image updated")
    )
})


// user Details



// user video history



export {registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, updateAvatar, updateCoverImage, updateUserDetails, updatePassword}