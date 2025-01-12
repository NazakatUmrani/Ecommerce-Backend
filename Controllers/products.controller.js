import { validationResult } from "express-validator";
import Product from "../Models/Product.js";
import uploadToAzure from '../Utils/uploadToAzureStorage.js';
import deleteFromAzure from '../Utils/deleteFromAzureStorage.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.error("Error in get all products route", error);
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.error("Error in get product by id route", error);
  }
};

export const addProduct = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files);
    // console.log(req);
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // At least one image is required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ title: req.body.title });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product already exists",
      });
    }

    // Uploads all images to azure and stores the urls in photoUrls
    req.files.forEach((file, index) => {
      file.originalname = `${req.user.id}_${req.body.title}_${index}`;
    });
    const photoUrls = await Promise.all(req.files.map(file => uploadToAzure(file, file.originalname)));
    
    // Create a new product
    const product = new Product({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      photoUrls: photoUrls,
      seller: req.user.id,
    });

    // Save the product
    await product.save();
    
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.error("Error in add product route", error);
  }
};

export const updateProduct = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // At least one image is required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // Check if product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user is the seller
    if (existingProduct.seller.toString() !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You are not the seller of this product",
      });
    }

    // Delete the old images from azure
    await Promise.all(existingProduct.photoUrls.map(url => deleteFromAzure(url)));

    // Uploads all images to azure and stores the urls in photoUrls
    req.files.forEach((file, index) => {
      file.originalname = `${req.user.id}_${req.body.title}_${index}`;
    })
    const photoUrls = await Promise.all(req.files.map(file => uploadToAzure(file, file.originalname)));

    // Update the product
    const bodyPayload = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      photoUrls
    };
    const product = await Product.findByIdAndUpdate(req.params.id, bodyPayload, {
      new: true,
    });
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.error("Error in update product route", error);
  }
}

export const deleteProduct = async (req, res) => {
  try {
    // Check if product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user is the seller
    if (existingProduct.seller.toString() !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You are not the seller of this product",
      });
    }

    // Delete the images from azure
    await Promise.all(existingProduct.photoUrls.map(url => deleteFromAzure(url)));

    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.error("Error in delete product route", error);
  }
}

// export const signup = async (req, res) => {
//   try {
//     console.log(req.body);
//     console.log(req.file);
//     // console.log(req);
//     // If there are errors, return Bad request and the errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log('Validation errors:', errors.array());
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }

//     // Hash the password
//     const salt = bcrypt.genSaltSync(10);
//     const hash = bcrypt.hashSync(req.body.password, salt);
//     req.body.password = hash;

//     // Create a new user
//     let user = await User.findOne({ email: req.body.email }).select("email");
//     console.log(user);
//     console.log(req.body.email);
//     if (user){
//       console.log('User already exists:', user);
//       return res.status(400).json({
//         success: false,
//         message: "Sorry a user with this email already exists",
//       });
//     }
//     user = User(req.body);

//     // Generate OTP and send email
//     const otp = user.generateOTP();
//     const message = `Your OTP is :- \n\n ${otp} \n\nIf you have not requested this email then, please ignore it.`;

//     await sendEmail({
//       email: user.email,
//       subject: "OTP for email verification",
//       message,
//     })

//     // Conditionally store profile pic in azure blob storage
//     if (req.file) {
//       console.log("About to upload to azure");
//       user.profilePic = await uploadToAzure(req.file, user.email);
//       console.log("uploaded to azure");
//     }
    
//     await user.save();

//     res
//       .status(201)
//       .json({
//         success: true,
//         message: "User created - Must verify email with otp",
//       });
//   } catch (error) {
//     console.error("Error in signup route", error);
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occured",
//     });
//   }
// };

// export const verifySignup = async (req, res) => {
//   try {
//     // If there are errors, return Bad request and the errors
//     console.log(req.body);
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }
//     const { email, otp } = req.body;

//     // Check if user exists
//     const user = await User.findOne({ email }).select("otp otpExpires tokenVersion verified refreshToken");
//     if (!user)
//       return res
//         .status(400)
//         .json({ success: false, message: "No user found with this email" });
    
//     // Check if user is already verified
//     if (user.verified)
//       return res
//         .status(200)
//         .json({ success: true, message: "User is already verified" });

//     // Check if OTP is valid
//     const isOtpValid = user.verifyOTP(Number(otp));
//     if (!isOtpValid)
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid OTP" });

//     // Clear the OTP
//     user.otp = undefined;
//     user.otpExpires = undefined;
//     user.verified = true;
    
//     // Create and return a token
//     const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
//     const { refreshToken } = generateTokenAndSetCookie(data, res);
//     user.refreshToken = refreshToken;

//     await user.save();

//     res.status(200).json({ success: true, message: "Email verified successfully" });
//   } catch (error) {
//     console.error("Error in signup route", error);
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occured",
//     });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     // If there are errors, return Bad request and the errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }

//     // Check if user exists
//     let user = await User.findOne({ email: req.body.email }).select("password tokenVersion verified refreshToken email");
//     if (!user)
//       return res
//         .status(400)
//         .json({ success: false, message: "Please enter valid credentials" });

//     // See verified status
//     if (!user.verified){
//       // If not verified, generate otp and send it
//       const otp = user.generateOTP();
//       const message = `Your OTP is :- \n\n ${otp} \n\nIf you have not requested this email then, please ignore it.`;

//       await sendEmail({
//         email: user.email,
//         subject: "OTP for email verification",
//         message,
//       })
      
//       await user.save();
//       return res
//         .status(400)
//         .json({ success: false, message: "Cannot login until you verify your email - OTP has been sent" });
//     }
      
//     // Check if password is correct
//     const comparePassword = bcrypt.compareSync(
//       req.body.password,
//       user.password
//     );
//     if (!comparePassword)
//       return res
//         .status(400)
//         .json({ success: false, message: "Please enter valid credentials" });

//     // Create and return a token
//     const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
//     const { refreshToken } = generateTokenAndSetCookie(data, res);
//     user.refreshToken = refreshToken;
    
//     await user.save();

//     res.status(200).json({ success: true, message: "User signed in" });
//   } catch (error) {
//     console.error("Error in signin route", error);
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occured",
//     });
//   }
// };

// export const logout = (req, res) => {
//   try {
//     res.clearCookie("accessToken");
//     res.clearCookie("refreshToken");
//     res.status(200).json({ success: true, message: "User logged out" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occured",
//     });
//     console.error("Error in logout route", error);
//   }
// };

// export const refreshToken = async (req, res) => {
//   try {
//     // Get token from cookies and check if it exists
//     const incomingToken = req.cookies.refreshToken;
//     if (!incomingToken)
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized - No refresh token in cookies, Redirect to login",
//       });
    
//     // Verify token and check if it is valid
//     const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
//     if (!decoded)
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized - Invalid refresh token",
//       });
    
//     // Check if user exists and tokenVersion is same
//     const user = await User.findById(decoded.user.id).select('tokenVersion');
//     if (!user)
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized - User does not exist, please login again",
//       });
//     if (user.tokenVersion !== decoded.user.tokenVersion)
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized - Token is no longer valid, please login again",
//       });
    
//     // Create and return a token
//     const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
//     const { refreshToken } = generateTokenAndSetCookie(data, res);
//     user.refreshToken = refreshToken;

//     await user.save();

//     res.status(200).json({ success: true, message: "Token refreshed" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occured",
//     });
//     console.error("Error in refreshToken route", error);
//   }
// }

// export const forgetPassword = async (req, res) => {
//   try {
//     // If there are errors, return Bad request and the errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error(errors.array());
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }

//     // Check if user exists
//     let user = await User.findOne({ email: req.body.email }).select("email otp otpExpires");
//     if (!user)
//       return res
//         .status(400)
//         .json({ success: false, message: "Please enter valid credentials" });

//     const otp = user.generateOTP();
//     const message = `Your password reset OTP is :- \n\n ${otp} \n\nIf you have not requested this email then, please ignore it.`;

//     await sendEmail({
//       email: user.email,
//       subject: "Ecommerce password Recovery",
//       message,
//     });
    
//     // Save the user
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: `Email sent to ${user.email} successfully `,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occured",
//     });
//     console.error("Error in forgetPassword route", error);
//   }
// };

// export const resetPassword = async (req, res) => {
//   try {
//     // If there are errors, return Bad request and the errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error(errors.array());
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }

//     const { email, otp, password } = req.body;

//     // Check if user exists
//     const user = await User.findOne({ email }).select("password otp otpExpires tokenVersion verified refreshToken");
//     if (!user)
//       return res
//         .status(400)
//         .json({ success: false, message: "No user found with this email" });

//     // Check if OTP is valid
//     const isOtpValid = user.verifyOTP(otp);
//     if (!isOtpValid) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid or expired OTP" });
//     }

//     // Hash the password and clear the OTP and Verified status
//     const salt = bcrypt.genSaltSync(10);
//     user.password = bcrypt.hashSync(password, salt);
//     user.otp = undefined;
//     user.otpExpires = undefined;
//     user.verified = true;

//     // Increment the tokenVersion and save the user
//     user.incrementTokenVersion();

//     // Create and return a token
//     const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
//     const { refreshToken } = generateTokenAndSetCookie(data, res);
//     user.refreshToken = refreshToken;

//     await user.save();

//     res
//       .status(200)
//       .json({ success: true, message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occurred",
//     });
//     console.error("Error in resetPassword route", error);
//   }
// };

// export const updatePassword = async (req, res) => {
//   try {
//     // If there are errors, return Bad request and the errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error(errors.array());
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }

//     // Check if user exists
//     let user = await User.findById(req.user.id).select("password tokenVersion");
//     if (!user)
//       return res
//         .status(400)
//         .json({ success: false, message: "User does not exists" });

//     // Check if old password is correct
//     const comparePassword = bcrypt.compareSync(
//       req.body.oldPassword,
//       user.password
//     );
//     if (!comparePassword)
//       return res
//         .status(400)
//         .json({ success: false, message: "Please enter valid credentials" });

//     // Hash the new password and save the user
//     const salt = bcrypt.genSaltSync(10);
//     user.password = bcrypt.hashSync(req.body.newPassword, salt);

//     // Increment the tokenVersion and save the user
//     user.incrementTokenVersion();
//     await user.save();

//     res
//       .status(200)
//       .json({ success: true, message: "Password updated successfully" });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occurred",
//     });
//     console.error("Error in updatePassword route", error);
//   }
// };

// export const getUserDetails = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select(
//       "-password -otp -otpExpires -tokenVersion -verified -refreshToken"
//     );
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User details fetched successfully",
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occurred",
//     });
//     console.error("Error in getUserDetails route", error);
//   }
// };

// export const updateUser = async (req, res) => {
//   try {
//     // If there are errors, return Bad request and the errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.error(errors.array());
//       return res.status(400).json({
//         success: false,
//         message: `Validation errors - ${errors.array()[0].msg}`,
//       });
//     }

//     // Check if user exists
//     const user = await User.findById(req.user.id).select("-password -otp -otpExpires -tokenVersion -verified -refreshToken");
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }
//     const { firstName, lastName, email, role } = req.body;

//     if (firstName) user.firstName = firstName;
//     if (lastName) user.lastName = lastName;
//     if (email) user.email = email;
//     if (role) user.role = role;
//     if (req.file) {
//       user.profilePic = await uploadToAzure(req.file, user.email);
//     }

//     await user.save();
//     res.status(200).json({ success: true, user: req.user });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "An internal server error occurred",
//     });
//     console.error("Error in updateUser route", error);
//   }
// };
