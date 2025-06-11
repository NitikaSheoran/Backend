import mongoose from "mongoose";
// A plugin that adds pagination support to Mongoose's aggregate() queries. Useful when you want to return paginated results from complex queries.
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        required: true
    },
    isPublished: {
        type: Boolean,
        required: true,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});


//  integrates the pagination plugin into the schema
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = new mongoose.model("Video", videoSchema);