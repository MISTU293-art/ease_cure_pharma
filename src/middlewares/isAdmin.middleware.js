import jwt from "jsonwebtoken";

async function isAdmin(req, res, next) {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).render("login", {
        error: "Please login first.",
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).render("access_denied", {
        error: "You do not have permission to access this page.",
        user: decoded,
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);

    return res.status(500).render("login", {
      error: "Internal Server Error",
    });
  }
}

export { isAdmin };
