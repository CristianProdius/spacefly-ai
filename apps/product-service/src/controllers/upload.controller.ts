import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Request, Response } from "express";
import {
  buildPublicUploadUrl,
  buildSpaceImageObjectKey,
  createHttpError,
  getObjectKeyFromRoute,
  getS3Client,
  getUploadConfig,
  isMissingObjectError,
  sniffUploadedImageType,
} from "../utils/upload.js";

export const uploadImage = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const imageType = sniffUploadedImageType(file.buffer);
  const objectKey = buildSpaceImageObjectKey(req.userId!, imageType.extension);
  const { bucket } = getUploadConfig();

  await getS3Client().send(
    new PutObjectCommand({
      Body: file.buffer,
      Bucket: bucket,
      CacheControl: "public, max-age=31536000, immutable",
      ContentLength: file.size,
      ContentType: imageType.mime,
      Key: objectKey,
    })
  );

  return res.status(201).json({
    url: buildPublicUploadUrl(objectKey),
  });
};

export const streamUploadedImage = async (req: Request, res: Response) => {
  const objectKey = getObjectKeyFromRoute(req.params[0]);

  if (!objectKey) {
    throw createHttpError(404, "Upload not found");
  }

  try {
    const { bucket } = getUploadConfig();
    const object = await getS3Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      })
    );

    if (!object.Body) {
      throw createHttpError(404, "Upload not found");
    }

    if (object.ContentType) {
      res.setHeader("Content-Type", object.ContentType);
    }
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (object.ContentLength != null) {
      res.setHeader("Content-Length", object.ContentLength.toString());
    }

    if (object.ETag) {
      res.setHeader("ETag", object.ETag);
    }

    res.setHeader(
      "Cache-Control",
      object.CacheControl ?? "public, max-age=31536000, immutable"
    );

    if (object.LastModified) {
      res.setHeader("Last-Modified", object.LastModified.toUTCString());
    }

    const body = object.Body as
      | { pipe: (destination: Response) => void }
      | { transformToByteArray: () => Promise<Uint8Array> };

    if ("pipe" in body) {
      body.pipe(res);
      return;
    }

    const bytes = await body.transformToByteArray();
    res.end(Buffer.from(bytes));
  } catch (error) {
    if (isMissingObjectError(error)) {
      throw createHttpError(404, "Upload not found");
    }

    throw error;
  }
};
