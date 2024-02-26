import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { CLOUDINARY_BUCKET_NAME } from "../constants.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function formatUrl(cloudinaryUrl) {
  // Extract the public ID using a regular expression
  const match = cloudinaryUrl.match(/v\w+/);
  if (!match) {
    return null; // Public ID not found in the URL
  }
  const publicId = match[0];

  const parts = cloudinaryUrl.split("/");
  const indexOfPublicId = parts.indexOf(publicId);

  if (indexOfPublicId === -1) {
    return null; // Public ID not found in the path
  }

  // Extract the path after the public ID, excluding any extensions
  const pathWithoutExtension = parts
    .slice(indexOfPublicId + 1)
    .map((part) => part.split(".")[0])
    .join("/");

  return pathWithoutExtension;
}

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

const deleteFromCloudinary = async (cloudPath) => {
  try {
    if (!cloudPath) return null;
    const shortPath = formatUrl(cloudPath);
    const response = await cloudinary.uploader.destroy(shortPath, {
      invalidate: true,
    });
    console.log("Deleted Successfully");
    return response;
  } catch (error) {
    console.error("Failed to delete", error.message);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
