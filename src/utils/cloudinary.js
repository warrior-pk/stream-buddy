import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { CLOUDINARY_BUCKET_NAME, VIDEO_FOLDER } from "../constants.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    const public_id = extractPublicId(cloudPath, CLOUDINARY_BUCKET_NAME);
    console.log(public_id);
    const resourceType = extractResourseType(cloudPath);
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType,
      invalidate: true,
    });
    console.log("Deleted Successfully");
    return response;
  } catch (error) {
    console.error("Failed to delete", error.message);
    return null;
  }
};

const extractResourseType = (cloudinaryUrl) => {
  const regex = /\/(image|video|raw)\/upload\//;
  const match = cloudinaryUrl.match(regex);
  return match ? match[1] : null;
};

const extractPublicId = (cloudinaryUrl, bucketName) => {
  const parts = cloudinaryUrl.split("/");
  const indexOfBucketName = parts.indexOf(bucketName);

  if (indexOfBucketName === -1) {
    return null;
  }

  const pathAfterBucketName = parts.slice(indexOfBucketName + 1).join("/");
  const partsWithoutExtension = pathAfterBucketName
    .split("/")
    .map((part) => part.split(".")[0]);

  return bucketName + "/" + partsWithoutExtension.join("/");
};
export { uploadOnCloudinary, deleteFromCloudinary, uploadLargeOnCloudinary };
