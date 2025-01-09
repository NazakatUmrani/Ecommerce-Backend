import jwt from "jsonwebtoken";
import User from "../Models/User.js";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies and check if it exists
    const token = req.cookies.accessToken;
    if (!token)
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    
    // Verify token and check if it is valid
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (!decoded)
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token",
      });

    // Check if user exists and tokenVersion is same
    const user = await User.findById(decoded.user.id).select('tokenVersion');
    if (!user || user.tokenVersion !== decoded.user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Token is no longer valid, please login again",
      });
    }

    // Set req.user to the user id
    req.user = { id: decoded.user.id };
    next();
  } catch (error) {
    console.log("Error in authenticating", error);
    res.status(401).json({
      success: false,
      message: "Please authenticate using a valid token",
    });
  }
};

export default authenticate;
