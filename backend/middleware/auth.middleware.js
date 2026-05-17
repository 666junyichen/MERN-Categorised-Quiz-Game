import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        error: "JWT is not configured"
      });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token"
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token"
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }
};
