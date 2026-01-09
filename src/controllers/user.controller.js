import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { User } from "../models/users.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const generateAccessTokenandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, fullName, password } = req.body;
  if (
    [username, email, fullName, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User with given email or username already exists");
  }
  const avatatLocal = req.files?.avatar[0]?.path;
  // const coverImageLocal = req.files?.coverImage[0]?.path

  let coverImageLocal;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocal = req?.files?.coverImage[0]?.path;
  }

  if (!avatatLocal) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadToCloudinary(avatatLocal);
  const coverImage = await uploadToCloudinary(coverImageLocal);
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed. Please try again.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found with the provided email");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshToken(user._id);
  const userData = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: userData,
        accessToken,
        refreshToken,
      })
    );
});

const logOutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { refreshToken: undefined },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

const getUserProfile = asyncHandler(async (req, res, next) => {
  const { user_id } = req.query;

  if (!user_id) {
    throw new ApiError(400, "User ID is required");
  }
  const user = await User.findById(user_id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User profile fetched successfully", user));
});

const updatePassword = asyncHandler(async (req, res, next) => {
  const {oldPassword, newPassword} = req.body;

  if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Old password and new password are required");
  }
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError(401, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({
    validateBeforeSave: false,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully", {}));
}
);

const updateProfile = asyncHandler(async (req, res, next) => {
  
  const { username , email , fullName} = req.body;
  console.log(username , email , fullName);
  if ([username , email , fullName].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {$set :{ username, email, fullName }},
    { new: true }
  ).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", user));

  
});

const updateAvatar = asyncHandler(async (req, res, next) => {
  const avatarLocal = req.file?.path;
  console.log(avatarLocal); 
  if (!avatarLocal) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatarURl = await uploadToCloudinary(avatarLocal);

  if (!avatarURl.url) {
    throw new ApiError(500, "Error uploading avatar to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatarURl.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully", user));
});

export { registerUser, loginUser, logOutUser, getUserProfile ,updatePassword ,updateProfile ,updateAvatar };
