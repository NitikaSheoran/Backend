import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
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
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $unwind: {
                path: "$videoDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                video: 1,
                videoDetails: 1,
                ownerDetails: {
                    _id: "$ownerDetails._id",
                    userName: "$ownerDetails.userName",
                    fullName: "$ownerDetails.fullName",
                    avatar: "$ownerDetails.avatar"
                }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    );
});



const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid videoId")
    }

    if(!content || !content.trim()){
        throw new ApiError(400, "content in tweet is necessary")
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user?._id
    })
    if(!comment){
        throw new ApiError(400, "comment not added")
    }
    return res.status(200).json(
        new ApiResponse(200, comment, "comment created")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {newContent} = req.body;
    const {commentId} = req.params;
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "invalid commentid")
    }
    if(!newContent || !newContent.trim()){
        throw new ApiError(404, "content not found")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "comment not found")
    }
    if(String(comment.owner) !== String(req.user?._id)){
        throw new ApiError(403, "you can only update your own comments")
    }
    comment.content = newContent.trim();
    await comment.save();

    if(!comment){
        throw new ApiError(400, "comment not updated")
    }

    return res.status(200).json(
        new ApiResponse(200, comment, "comment updated")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "comment not found")
    }
    if(String(comment.owner) !== String(req.user?._id)){
        throw new ApiError(403, "you can only delete your own comments")
    }
    await comment.deleteOne();
    
    return res.status(200).json(
        new ApiResponse(200, null, "comment deleted")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }