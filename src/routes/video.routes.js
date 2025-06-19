import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {getAllVideos, getVideoById, deleteVideo, updateVideo, togglePublishStatus, publishAVideo} from "../controllers/video.controller.js"


const router = Router();
router.use(verifyJWT)

// get all videos -> get req
// upload video -> post req
router.route("/").get(getAllVideos).post(upload.fields([{name: "videoFile", maxCount: 1}, {name: "thumbnail", maxCount:1}], publishAVideo))

// delete video
// get video by id
// upload
router.route("/:videoId").get(getVideoById).delete(deleteVideo).patch(upload.single("thumbnail"), updateVideo)


// toggle publish status
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router