import { v2 as cloudinary } from "cloudinary";
import { setConfig, extractPublicId } from "cloudinary-build-url";
import fs from "fs";
import { CLOUDINARY_BUCKET_NAME, VIDEO_FOLDER } from "../constants.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

setConfig({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: CLOUDINARY_BUCKET_NAME,
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error("Failed to upload");
    return null;
  }
};

const uploadLargeOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        localFilePath,
        {
          resource_type: "auto",
          folder: `${CLOUDINARY_BUCKET_NAME}/${VIDEO_FOLDER}`,
        },
        (error, response) => {
          if (error) {
            reject(error);
          }
          resolve(response);
        }
      );
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    console.error("Failed to upload", error);
    return null;
  }
};

const deleteFromCloudinary = async (cloudPath) => {
  try {
    if (!cloudPath) return null;
    const public_id = extractPublicId(cloudPath);
    const response = await cloudinary.uploader.destroy(public_id, {
      invalidate: true,
    });
    console.log("Deleted Successfully");
    return response;
  } catch (error) {
    console.error("Failed to delete", error.message);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, uploadLargeOnCloudinary };
