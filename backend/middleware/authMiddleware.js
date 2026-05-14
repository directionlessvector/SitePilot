import jwt from "jsonwebtoken";

const authenticate = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
        code: "NO_TOKEN",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token.",
      code: "INVALID_TOKEN",
    });
  }
};

export default authenticate;