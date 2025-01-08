import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User from "../Models/User.js";
import { generateTokenAndSetCookie } from "../Utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
  try {
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation errors",
      });
    }

    const salt = bcrypt.genSaltSync(10); // Generate a salt
    const hash = bcrypt.hashSync(req.body.password, salt); // Hash the password
    req.body.password = hash; // Set the password to hash

    // Create a new user
    let user = await User.findOne({ email: req.body.email });
    if (user)
      return res.status(400).json({
        success: false,
        message: "Sorry a user with this email already exists",
      });
    user = User(req.body);
    await user.save();

    // Create a JWT Token
    const data = { user: { id: user.id } };
    generateTokenAndSetCookie(data, res);

    res.status(200).json({ success: true, message: "User created" });
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
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation errors",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).json({ success: false, message: "Please enter valid credentials" });
    const comparePassword = bcrypt.compareSync(
      req.body.password,
      user.password
    );
    if (!comparePassword)
      return res.status(400).json({ success: false, message: "Please enter valid credentials" });

    // Create and return a token
    const data = { user: { id: user.id } };
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
