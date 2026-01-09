import { Router } from "express";

import { loginUser, registerUser , logOutUser, getUserProfile, updateProfile, updateAvatar } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT ,logOutUser);
router.route("/getUserProfile").get(verifyJWT ,getUserProfile);
router.route("/updateProfile").put(verifyJWT ,updateProfile);
router.route("/updateAvatar").post(verifyJWT , upload.single("avatar"), updateAvatar);


export default router;
