import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User from "../Models/User.js";
import { generateTokenAndSetCookie } from "../Utils/generateTokenAndSetCookie.js";
import sendEmail from "../Utils/sendEmail.js";
// const crypto = require("crypto");

export const signup = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    req.body.password = hash;

    // Create a new user
    let user = await User.findOne({ email: req.body.email }).select("email");
    if (user)
      return res.status(400).json({
        success: false,
        message: "Sorry a user with this email already exists",
      });
    user = User(req.body);

    // Generate OTP and send email
    const otp = user.generateOTP();
    const message = `Your OTP is :- \n\n ${otp} \n\nIf you have not requested this email then, please ignore it.`;

    await sendEmail({
      email: user.email,
      subject: "OTP for email verification",
      message,
    })
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: "User created - Must verify email with otp",
      });
  } catch (error) {
    console.log("Error in signup route", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
  }
};

export const verifySignup = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    const { email, otp } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("otp otpExpires tokenVersion verified");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Email is invalid" });
    
    // Check if OTP is valid
    const isOtpValid = user.verifyOTP(otp);
    if (!isOtpValid)
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP" });

    // Clear the OTP and save the user
    user.otp = undefined;
    user.otpExpires = undefined;
    user.verified = true;
    await user.save();

    // Create and return a token
    const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
    generateTokenAndSetCookie(data, res);
    
    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.log("Error in signup route", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
  }
};

export const login = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: req.body.email }).select("password tokenVersion verified");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Please enter valid credentials" });

    // See verified status
    if (!user.verified){
      // If not verified, generate otp and send it
      const otp = user.generateOTP();
      const message = `Your OTP is :- \n\n ${otp} \n\nIf you have not requested this email then, please ignore it.`;

      await sendEmail({
        email: user.email,
        subject: "OTP for email verification",
        message,
      })

      return res
        .status(400)
        .json({ success: false, message: "Please verify your email" });
    }
      
    // Check if password is correct
    const comparePassword = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if (!comparePassword)
      return res
        .status(400)
        .json({ success: false, message: "Please enter valid credentials" });

    // Create and return a token
    const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
    generateTokenAndSetCookie(data, res);

    res.status(200).json({ success: true, message: "User signed in" });
  } catch (error) {
    console.log("Error in signin route", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwtToken");
    res.status(200).json({ success: true, message: "User logged out" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.log("Error in logout route", error);
  }
};

export const forgetPassword = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: req.body.email }).select("email otp otpExpires");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Please enter valid credentials" });

    const otp = user.generateOTP();
    const message = `Your password reset OTP is :- \n\n ${otp} \n\nIf you have not requested this email then, please ignore it.`;

    await sendEmail({
      email: user.email,
      subject: "Ecommerce password Recovery",
      message,
    });
    
    // Save the user
    await user.save();

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully `,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occured",
    });
    console.log("Error in forgetPassword route", error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    const { email, otp, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select("password otp otpExpires tokenVersion");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Email is invalid" });

    // Check if OTP is valid
    const isOtpValid = user.verifyOTP(otp);
    if (!isOtpValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    // Hash the password and clear the OTP and Verified status
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    user.verified = true;

    // Increment the tokenVersion and save the user
    user.incrementTokenVersion();
    await user.save();

    // Create and return a token
    const data = { user: { id: user.id, tokenVersion: user.tokenVersion } };
    generateTokenAndSetCookie(data, res);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
    console.log("Error in resetPassword route", error);
  }
};

export const updatePassword = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // Check if user exists
    let user = await User.findById(req.user.id).select("password tokenVersion");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User does not exists" });

    // Check if old password is correct
    const comparePassword = bcrypt.compareSync(
      req.body.oldPassword,
      user.password
    );
    if (!comparePassword)
      return res
        .status(400)
        .json({ success: false, message: "Please enter valid credentials" });

    // Hash the new password and save the user
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(req.body.newPassword, salt);

    // Increment the tokenVersion and save the user
    user.incrementTokenVersion();
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
    console.log("Error in updatePassword route", error);
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otp -otpExpires -tokenVersion -verified"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
    console.log("Error in getUserDetails route", error);
  }
};

export const updateUser = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        message: `Validation errors - ${errors.array()[0].msg}`,
      });
    }

    // Check if user exists
    const user = await User.findById(req.user.id).select("-password -otp -otpExpires -tokenVersion -verified");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const { firstName, lastName, email, role, profilePic } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (profilePic) user.profilePic = profilePic;

    await user.save();
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
    console.log("Error in updateUser route", error);
  }
};
