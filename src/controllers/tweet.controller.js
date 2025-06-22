import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "add content to tweet")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    })

    if(!tweet){
        throw new ApiError(500, "cant make tweet")
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "tweet created")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "invalid user id in params")
    }

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner_details"
            }
        },
        {
            $unwind: "$owner_details"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    _id: "$owner_details._id",
                    userName: "$owner_details.userName",
                    fullName: "$owner_details.fullName",
                    avatar: "$owner_details.avatar"
                }
            }
        }
    ])

    if(!tweets?.length){
        throw new ApiError(400, "no tweets found")
    }

    return res.status(200).json(
        new ApiResponse(200, tweets, "tweets")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId} = req.params;
    const {newContent} = req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: newContent
            }
        },
        {new: true}
    );
    if(!tweet){
        throw new ApiError(404, "tweet does not exist")
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "updated tweet")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id in params")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    return res.status(200).json(
        new ApiResponse(200, null, "tweet deleted")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}