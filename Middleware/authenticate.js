import jwt from "jsonwebtoken"
const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.jwtToken;
    if (!token)
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded)
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token",
      });
    
    req.user = decoded.user;
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