import mongoose from "mongoose";
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscribtion.model.js"
import {Like} from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const [videoStats] = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    const totalLikes = await Like.countDocuments({ owner: userId });
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos: videoStats?.totalVideos || 0,
            totalViews: videoStats?.totalViews || 0,
            totalLikes,
            totalSubscribers
        }, "Channel statistics fetched")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const videos = await Video.find({ owner: userId })
        .select("title description views thumbnail duration isPublished createdAt")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched")
    );
});

export {getChannelStats, getChannelVideos}