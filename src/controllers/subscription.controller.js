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

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId("65de0ade1c17da32d1914108"),
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
