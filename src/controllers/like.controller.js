import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid video id in params")
    }
    
    const isLiked = await Like.findOne(
        {
            video: videoId,
            likedBy: req.user?._id
        }
    )

    let message = "";
    let like;
    if(!isLiked){
        like = await Like.create(
            {
                video: videoId,
                likedBy: req.user?._id
            },
        )
        message = "liked the video"
    }else{
        like = await isLiked.deleteOne();
        message = "unliked the video"
    }

    return res.status(200).json(
        new ApiResponse(200, like, message)
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "invalid comment id in params")
    }
    
    const isLiked = await Like.findOne(
        {
            comment: commentId,
            likedBy: req.user?._id
        }
    )

    let message = "";
    let like;
    if(!isLiked){
        like = await Like.create(
            {
                comment: commentId,
                likedBy: req.user?._id
            },
        )
        message = "liked the comment"
    }else{
        like = await isLiked.deleteOne();
        message = "unliked the comment"
    }

    return res.status(200).json(
        new ApiResponse(200, like, message)
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "invalid tweet id in params")
    }
    
    const isLiked = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: req.user?._id
        }
    )

    let message = "";
    let like;
    if(!isLiked){
        like = await Like.create(
            {
                tweet: tweetId,
                likedBy: req.user?._id
            },
        )
        message = "liked the tweet"
    }else{
        like = await isLiked.deleteOne();
        message = "unliked the tweet"
    }

    return res.status(200).json(
        new ApiResponse(200, like, message)
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: {$exists: true}
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                _id: 0,
                likedAt: "$createdAt",
                video: "$videoDetails"
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200, likes, "liked videos fetched")
    )


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}