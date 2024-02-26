import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  setCurrentPassword,
  setUserAvatar,
  setUserCoverImage,
} from "../../controllers/user.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
const router = Router();

//Core Routes
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Getter Routes
router.route("/current-user").get(verifyJWT, getCurrentUser);

// Setters Routes
router.route("/change-password").patch(verifyJWT, setCurrentPassword);
router
  .route("/change-avatar")
  .patch(verifyJWT, upload.single("avatar"), setUserAvatar);
router
  .route("/change-cover-image")
  .patch(verifyJWT, upload.single("cover"), setUserCoverImage);

export default router;
