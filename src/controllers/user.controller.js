import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import {User} from "../models/users.models.js";
import {uploadToCloudinary} from "../utils/cloudinary.js";

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
  const avatatLocal = req.files?.avatar[0]?.path
    // const coverImageLocal = req.files?.coverImage[0]?.path

    let coverImageLocal ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocal = req?.files?.coverImage[0]?.path
    }
    
    if (!avatatLocal ) {
        throw new ApiError(400, "Avatar is required");
    }


    const avatar = await uploadToCloudinary(avatatLocal);
    const coverImage = await uploadToCloudinary(coverImageLocal);
  if (!avatar ) {
        throw new ApiError(400, "Avatar is required");
    }

   const user = await User.create({
        username : username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError (500, "User registration failed. Please try again.");
    }

    return res.status(200).json(new ApiResponse(200, "User registered successfully", createdUser));
  
});

export { registerUser };
