import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  uploadLargeOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title.trim() || !description.trim()) {
    throw new ApiError("400", "All fields required");
  }
  //   console.log(req.files);
  const localVideoPath = req.files?.videoFile?.[0].path;
  const localThumbnailPath = req.files?.thumbnail?.[0].path;

  if (!localVideoPath || !localThumbnailPath) {
    throw new ApiError(400, "Missing file or files");
  }

  const cloudVideoPath = await uploadLargeOnCloudinary(localVideoPath);
  const cloudThumbnailPath = await uploadOnCloudinary(localThumbnailPath);

  const video = await Video.create({
    videoFile: cloudVideoPath.url,
    thumbnail: cloudThumbnailPath.url,
    title,
    description,
    duration: cloudVideoPath.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Could not publish video");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video Published Successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId.trim()) {
    throw new ApiError(400, "videoId is required");
  }

  const video = await Video.findById(videoId.trim());
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId.trim())) {
    throw new ApiError(404, "Invalid videoId");
  }

  const video = await Video.findById(videoId.trim());

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "Not authorized to delete");
  }

  await Video.findByIdAndDelete(video._id);
  await deleteFromCloudinary(video.videoFile);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          views: video.views,
        },
        deletedBy: {
          _id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
        },
        deletedAt: new Date().toLocaleString(),
      },
      `Video deleted successfully`
    )
  );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId.trim()) {
    throw new ApiError(400, "videoId is required");
  }

  const video = await Video.findById(videoId.trim());
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  video.isPublished = !video.isPublished;
  const toogledVideo = await video.save({ validateBeforeSave: false });
  const isPub = toogledVideo.isPublished;
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        toogledVideo,
        `Video ${isPub ? `published` : `hidden`} successfully`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
