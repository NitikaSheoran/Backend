import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    updatePlayList,
    createPlayList,
    deletePlayList,
    addVideoToPlayList,
    removeVideoFromPlayList,
    getUserPlayLists,
    getPlayListById
} from "../controllers/playList.controller.js";

const router = Router();
router.use(verifyJWT);

// Create playlist
router.route("/").post(createPlayList);

// Get all playlists for a user (put this above /:playlistId)
router.route("/user/:userId").get(getUserPlayLists);

// Add/remove video from playlist
router.route("/add/:videoId/:playlistId").patch(addVideoToPlayList);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlayList);

// Get, update, or delete a playlist by its ID
router.route("/:playlistId").get(getPlayListById).patch(updatePlayList).delete(deletePlayList);

export default router;
