import mongoose, {isValidObjectId} from "mongoose";
import {PlayList} from "../models/playList.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createPlayList = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(400, "require both name and description to make playlist")
    }

    const playList = await PlayList.create({
        name: name,
        description: description,
        owner: req.user?._id,
    })
    if(!playList){
        throw new ApiError(400, "cant make playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, playList, "playlist made")
    )

})

const getUserPlayLists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "invalid user id")
    }

    if(String(req.user?._id) != String(userId)){
        throw new ApiError(400, "u can only visit your own playlist")
    }

    const playlist = await PlayList.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
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
        {
            $project: {
                name: 1,
                description: 1,
                owner: {
                    userName: 1,
                    avatar: 1,
                },
                videos: {
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    owner: 1,
                    videoFile: 1
                }
            }
        }
    ])

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist.map(video => video.videos), "playlist fetched")
    )
})

const getPlayListById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id")
    }

    const playList = await PlayList.findById(playlistId);
    if(!playList){
        throw new ApiError(404, "playlist does not exist")
    }

    if(String(req.user?._id) !== String(playList.owner._id)){
        throw new ApiError(400, "u can only get your own playlist")
    }

    return res.status(200).json(
        new ApiResponse(200, playList, "playList fetched")
    )
})

const addVideoToPlayList = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid playlist or video id")
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "playlist not found")
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "unauthorized to modify this playlist")
    }

    if (playList.videos.includes(videoId)) {
        throw new ApiError(400, "video already exists in playlist")
    }

    playList.videos.push(videoId);
    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, playList, "video added to playlist")
    )

})

const removeVideoFromPlayList = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid playlist or video id")
    }

    const playList = await PlayList.findById(playlistId);
    if (!playList) {
        throw new ApiError(404, "playlist not found")
    }

    if (String(req.user?._id) !== String(playList.owner)) {
        throw new ApiError(403, "unauthorized to modify this playlist")
    }

    playList.videos = playList.videos.filter(v => String(v) !== String(videoId));
    await playList.save();

    return res.status(200).json(
        new ApiResponse(200, playList, "video removed from playlist")
    )

})

const deletePlayList = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id")
    }

    const playList = await PlayList.findById(playlistId);
    if(!playList){
        throw new ApiError(404, "playlist doest not exist")
    }

    if(String(req.user?._id) !== String(playList.owner._id)){
        throw new ApiError(400, "u can delete your own playlist only")
    }

    const deleted = await playList.deleteOne();
    if(!deleted){
        throw new ApiError(400, "cant delete")
    }

    return res.status(200).json(
        new ApiResponse(200, null, "playlist deleted")
    )
})

const updatePlayList = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "invalid playlist id")
    }

    if(!name || !description){
        throw new ApiError(400, "enter both name and description")
    }

    const playList = await PlayList.findById(playlistId)
    if(!playList){
        throw new ApiError(404, "playlist does not exist")
    }

    if(String(req.user_id) !== String(playList.owner._id)){
        throw new ApiError(400, "can only update your own playlist")
    }

    const updatedPlaylist = await PlayList.findByIdAndUpdate(playlistId,
        {
            $set: {
                name: name,
                description: description
            }
        },
        {new: true}
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "not updated")
    }

    return res.status(200).json(
        new ApiError(200, updatedPlaylist, "playlist updated")
    )
})

export {
    createPlayList,
    getUserPlayLists,
    getPlayListById,
    addVideoToPlayList,
    removeVideoFromPlayList,
    deletePlayList,
    updatePlayList
}