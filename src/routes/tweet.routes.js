import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";
const router = Router();
router.use(verifyJWT)

// upload tweet
router.route("/").post(createTweet);


// get tweet
router.route("/user/:userId").get(getUserTweets)

// delete tweet
// update tweet
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router
