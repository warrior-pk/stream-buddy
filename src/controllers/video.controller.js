import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  const { title, description } = req.body;
  if (!title.trim() || !description.trim()) {
    throw new ApiError("400", "All fields required");
  }
  console.log(req.files);
  const localVideoPath = req.files?.videoFile?.[0].path;
  const localThumbnailPath = req.files?.thumbnail?.[0].path;

  if (!localVideoPath || !localThumbnailPath) {
    throw new ApiError(400, "Missing file or files");
  }

  const cloudVideoPath = await uploadOnCloudinary(localVideoPath);
  const cloudThumbnailPath = await uploadOnCloudinary(localThumbnailPath);

  console.log(cloudVideoPath);

  const video = await Video.create({
    videoFile: cloudVideoPath.url,
    thumbnail: cloudThumbnailPath.url,
    title,
    description,
    duration: cloudVideoPath.duration,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Video Published Successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
