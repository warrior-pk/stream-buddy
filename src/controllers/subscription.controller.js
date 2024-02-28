import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId.trim())) {
    throw new ApiError(400, "Invalid Channel ID");
  }
  if (channelId.trim() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const channel = await User.findById(channelId.trim());

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const filter = {
    channel: channelId.trim(),
    subscriber: req.user._id,
  };

  const existingSubscription = await Subscription.findOneAndDelete(filter);

  if (!existingSubscription) {
    const newSubscription = await Subscription.create(filter);
    return res
      .status(201)
      .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, existingSubscription, "Unsubscribed successfully")
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId.trim())) {
    throw new ApiError(400, "Invalid channelId");
  }
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId.trim()),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              coverImage: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $first: "$user",
        },
      },
    },
  ]);

  if (!subscribers) {
    throw new ApiError(500, "Couldn't fetch channels");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Channels fetched successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId.trim())) {
    throw new ApiError(400, "Invalid subscriber");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId.trim()),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              coverImage: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);

  if (!channels) {
    throw new ApiError(500, "Couldn't fetch channels");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channels, "Channel fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
