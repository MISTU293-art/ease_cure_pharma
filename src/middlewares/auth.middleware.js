import jwt from "jsonwebtoken";

async function isLoggedIn(req, res, next) {
  try {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.render("login", {
        error: "Unauthorized",
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded;
    next()
  } catch (error) {
    return res.render("login", {
      error: "Internal Server Error",
    });
  }
};
export {isLoggedIn}
