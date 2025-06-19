import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {updatePlayList, createPlayList, deletePlayList, addVideoToPlayList, removeVideoFromPlayList, getUserPlayList, getPlayListById} from "../controllers/playList.controller.js"

const router = Router();
router.use(verifyJWT);

// create playlist
router.route("/").post(createPlayList)

// get playlist by id
// update playlist
// delete playlist
router.route("/:playListId").get(getPlayListById).patch(updatePlayList).delete(deletePlayList)


// add video to playlist
// remove video from playlist
router.route("/add/:videoId/:playListId").patch(addVideoToPlayList)
router.route("/remove/:videoId/:playListId").patch(removeVideoFromPlayList)

// get user playlist
router.route("/user/:userId").get(getUserPlayList);

export default router;