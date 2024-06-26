import mongoose, { isValidObjectId, mongo } from "mongoose";
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

const decodeQuery = (query) => {
  return query.replace("%20", " ").trim();
};

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy,
    sortType = "asc",
    query,
    userId,
  } = req.query;
  //TODO: get all videos based on search+query, sort:asc, sortBy:views, user-subscribed-at-top
  //TODO: Priority: Title (match then subs first) > Description(matched than subs first)
  const decodedQuery = decodeQuery(query);
  const uid = new mongoose.Types.ObjectId(userId?.trim());

  // Match stage to filter videos based on decoded search query
  const matchStage = decodedQuery
    ? {
        $match: {
          $or: [
            { title: { $regex: decodedQuery, $options: "i" } },
            { description: { $regex: decodedQuery, $options: "i" } },
          ],
        },
      }
    : { $match: {} };

  // Sort stage based on sortBy and sortType parameters
  const sortStage =
    sortBy && sortType
      ? { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } }
      : { $sort: { createdAt: -1 } };

  console.log(matchStage);
  // Aggregation pipeline
  const pipeline = await Video.aggregate([
    matchStage,
    sortStage,
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  Video.aggregatePaginate(pipeline, {
    page: Number(page),
    limit: Number(limit),
  })
    .then((pageResult) => {
      return res
        .status(200)
        .json(
          new ApiResponse(200, pageResult, `Successfully fetched page: ${page}`)
        );
    })
    .catch((err) => {
      throw new ApiError(500, "Could not fetch videos");
    });
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
  const { title, description } = req.body;
  const { videoId } = req.params;
  if (!isValidObjectId(videoId.trim())) {
    throw new ApiError(400, "Invalid videoId");
  }
  const filter = {
    _id: videoId,
    owner: req.user._id,
  };
  const video = await Video.findOne(filter);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }

  const thumbnailLocalPath = req.file?.path;
  if (thumbnailLocalPath) {
    console.log(thumbnailLocalPath);
    const cloudPath = await uploadOnCloudinary(thumbnailLocalPath);
    await deleteFromCloudinary(video.thumbnail);
    video.thumbnail = cloudPath.url;
  }
  const updatedVideo = await video.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated"));
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

  await deleteFromCloudinary(video.videoFile);
  await deleteFromCloudinary(video.thumbnail);
  await Video.findByIdAndDelete(video._id);

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
