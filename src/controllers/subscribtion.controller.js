import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscribtion.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid channel id")
    }

    const user = await User.findById(channelId);
    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const subscriberUser = req.user?._id;

    const existingSub = await Subscription.findOne({
        subscriber: subscriberUser,
        channel: channelId
    })

    const message = ""

    if(existingSub){
        await existingSub.deleteOne();
        message = "Unsubscribed from channel"
    }else{
        await Subscription.create({
            channel: channelId,
            subscriber: subscriberUser
        })
        message = "Subscribed to channel"
    }

    return res.status(200).json(
        new ApiResponse(200, null, message)
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid id")
    }

    const user = await User.findById(channelId);
    if(!user){
        throw new ApiError(404, "user does not exist");
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                _id: 0,
                subscriber: "$subscriberDetails"
            }
        }
    ])

    

    return res.status(200).json(
        new ApiResponse(200, channels.map(s => s.subscriber), "subscribers")
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "no id in params");
    }

    const user = await User.findById(subscriberId);
    if(!user){
        throw new ApiError(404, "user does not exist");
    }

    const subs = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $project: {
                _id: 0,
                channel: "$channelDetails"
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subs.map(s => s.channel), "subscribed to list")
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}