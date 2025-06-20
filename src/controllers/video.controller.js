import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFile = req.files?.videoFile?.[0];
    const thumbnail = req.files?.thumbnail?.[0];

    if (!title || !description || !videoFile || !thumbnail) {
        throw new ApiError(400, "All fields (title, description, videoFile, thumbnail) are required");
    }

    const uploadedVideo = await uploadOnCloudinary(videoFile.path);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnail.path);

    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideo?.url,
        thumbnail: uploadedThumbnail?.url,
        duration: uploadedVideo?.duration || 0,
        views: 0,
        owner: req.user._id,
        isPublished: true
    });

    return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "userName avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnail = req.file;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video || String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    if (thumbnail) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnail.path);
        video.thumbnail = uploadedThumbnail.url;
    }

    video.title = title || video.title;
    video.description = description || video.description;

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video || String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    await video.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video || String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update publish status of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, `Video is now ${video.isPublished ? "published" : "unpublished"}`));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
