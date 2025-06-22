import mongoose, { isValidObjectId } from "mongoose";
import { PlayList } from "../models/playList.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create playlist
const createPlayList = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const playList = await PlayList.create({
        name,
        description,
        owner: req.user?._id,
    });

    return res.status(201).json(
        new ApiResponse(201, playList, "Playlist created successfully")
    );
});

// Get all playlists for the logged-in user
const getUserPlayLists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    if (String(req.user?._id) !== String(userId)) {
        throw new ApiError(403, "You can only view your own playlists");
    }

    const playlists = await PlayList.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
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
        { $unwind: "$ownerDetails" },
        {
            $project: {
                name: 1,
                description: 1,
                owner: {
                    userName: "$ownerDetails.userName",
                    avatar: "$ownerDetails.avatar"
                },
                videos: "$videoDetails"
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );
});

// Get single playlist by ID
const getPlayListById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "Playlist not found");
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "Unauthorized access");
    }

    return res.status(200).json(
        new ApiResponse(200, playList, "Playlist fetched successfully")
    );
});

// Add video to playlist
const addVideoToPlayList = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "Playlist not found");
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    if (playList.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in playlist");
    }

    playList.videos.push(videoId);
    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, playList, "Video added to playlist")
    );
});

// Remove video from playlist
const removeVideoFromPlayList = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "Playlist not found");
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    playList.videos = playList.videos.filter(
        (v) => String(v) !== String(videoId)
    );
    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, playList, "Video removed from playlist")
    );
});

// Delete playlist
const deletePlayList = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "Playlist not found");
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "Unauthorized to delete this playlist");
    }

    await playList.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );
});

// Update playlist
const updatePlayList = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if (!name || !description) {
        throw new ApiError(400, "Both name and description are required");
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "Playlist not found");
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "Unauthorized to update this playlist");
    }

    playList.name = name;
    playList.description = description;
    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, playList, "Playlist updated successfully")
    );
});

export {
    createPlayList,
    getUserPlayLists,
    getPlayListById,
    addVideoToPlayList,
    removeVideoFromPlayList,
    deletePlayList,
    updatePlayList
};
