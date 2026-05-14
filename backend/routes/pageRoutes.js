import express from "express";

import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

import {
  createPage,
  getPages,
  getPageById,
  updatePage,
  deletePage,
} from "../controllers/pageController.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("owner", "admin"),
  createPage
);

router.get(
  "/website/:websiteId",
  protect,
  getPages
);

router.get(
  "/:id",
  protect,
  getPageById
);

router.put(
  "/:id",
  protect,
  authorizeRoles("owner", "admin", "editor"),
  updatePage
);
router.delete(
  "/:id",
  protect,
  authorizeRoles("owner", "admin"),
  deletePage
);
export default router;