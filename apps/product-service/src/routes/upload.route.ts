import { Router, type RequestHandler } from "express";
import multer, { type FileFilterCallback } from "multer";
import { shouldBeHost } from "../middleware/authMiddleware.js";
import { streamUploadedImage, uploadImage } from "../controllers/upload.controller.js";
import { createHttpError } from "../utils/upload.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(createHttpError(400, "Only image uploads are allowed"));
      return;
    }

    callback(null, true);
  },
});

const handleSingleImageUpload: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(createHttpError(413, "Image must be 10MB or smaller"));
        return;
      }

      next(createHttpError(400, error.message));
      return;
    }

    next(error);
  });
};

const router: Router = Router();

router.post("/images", shouldBeHost, handleSingleImageUpload, uploadImage);
router.get(/^\/(.+)$/, streamUploadedImage);

export default router;
