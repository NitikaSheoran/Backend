//  Cloud-based media storage and processing service
import { v2 as cloudinary } from "cloudinary";

// Node.js file system module
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async function(localFilePath){
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"  // lets Cloudinary auto-detect if it's an image, video, or other file type.
        })
        console.log("file upload response:: ",response);
        return response;  //includes url etc
    }catch(error){
        // the file is deleted from the local filesystem
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary}