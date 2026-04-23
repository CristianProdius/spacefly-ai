import { S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";

type UploadConfig = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
};

type ValidatedImageType = {
  extension: "avif" | "bmp" | "gif" | "heic" | "heif" | "jpg" | "png" | "tiff" | "webp";
  mime: "image/avif" | "image/bmp" | "image/gif" | "image/heic" | "image/heif" | "image/jpeg" | "image/png" | "image/tiff" | "image/webp";
};

const SVG_MARKUP_PATTERN = /<svg[\s>]/i;

let cachedConfig: UploadConfig | null = null;
let cachedS3Client: S3Client | null = null;

export const createHttpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

const getRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw createHttpError(500, `Missing required environment variable: ${name}`);
  }

  return value;
};

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean) => {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  return value.trim().toLowerCase() !== "false";
};

export const getUploadConfig = (): UploadConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
    bucket: getRequiredEnv("S3_BUCKET"),
    endpoint: getRequiredEnv("S3_ENDPOINT"),
    forcePathStyle: parseBooleanEnv(process.env.S3_FORCE_PATH_STYLE, true),
    publicBaseUrl: getRequiredEnv("S3_PUBLIC_BASE_URL").replace(/\/+$/, ""),
    region: getRequiredEnv("S3_REGION"),
    secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY"),
  };

  return cachedConfig;
};

export const getS3Client = () => {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = getUploadConfig();

  cachedS3Client = new S3Client({
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedS3Client;
};

const startsWithBytes = (buffer: Buffer, signature: number[]) =>
  signature.every((byte, index) => buffer[index] === byte);

const readIsoBrand = (buffer: Buffer) => {
  if (buffer.length < 12 || buffer.toString("ascii", 4, 8) !== "ftyp") {
    return null;
  }

  return buffer.toString("ascii", 8, 12);
};

const isSvgMarkup = (buffer: Buffer) => {
  const preview = buffer.toString("utf8", 0, Math.min(buffer.length, 512)).trimStart();
  if (!preview) {
    return false;
  }

  const withoutXmlDeclaration = preview.replace(/^<\?xml[^>]*>\s*/i, "");
  return SVG_MARKUP_PATTERN.test(withoutXmlDeclaration);
};

export const sniffUploadedImageType = (buffer: Buffer): ValidatedImageType => {
  if (isSvgMarkup(buffer)) {
    throw createHttpError(400, "SVG uploads are not allowed");
  }

  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: "png", mime: "image/png" };
  }

  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return { extension: "jpg", mime: "image/jpeg" };
  }

  if (buffer.length >= 6) {
    const gifHeader = buffer.toString("ascii", 0, 6);
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
      return { extension: "gif", mime: "image/gif" };
    }
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { extension: "webp", mime: "image/webp" };
  }

  if (buffer.length >= 2 && buffer.toString("ascii", 0, 2) === "BM") {
    return { extension: "bmp", mime: "image/bmp" };
  }

  if (
    startsWithBytes(buffer, [0x49, 0x49, 0x2a, 0x00]) ||
    startsWithBytes(buffer, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    return { extension: "tiff", mime: "image/tiff" };
  }

  const isoBrand = readIsoBrand(buffer);
  if (isoBrand === "avif" || isoBrand === "avis") {
    return { extension: "avif", mime: "image/avif" };
  }

  if (isoBrand === "heic" || isoBrand === "heix" || isoBrand === "hevc" || isoBrand === "hevx") {
    return { extension: "heic", mime: "image/heic" };
  }

  if (isoBrand === "mif1" || isoBrand === "msf1") {
    return { extension: "heif", mime: "image/heif" };
  }

  throw createHttpError(400, "Only supported raster image uploads are allowed");
};

const sanitizeUserId = (userId: string) => userId.replace(/[^a-zA-Z0-9_-]/g, "_");

export const buildSpaceImageObjectKey = (
  userId: string,
  extension: ValidatedImageType["extension"],
  timestamp = Date.now()
) => {
  const randomSuffix = randomBytes(8).toString("hex");

  return `spaces/${sanitizeUserId(userId)}/${timestamp}-${randomSuffix}.${extension}`;
};

export const buildPublicUploadUrl = (objectKey: string) =>
  `${getUploadConfig().publicBaseUrl}/${objectKey}`;

export const getObjectKeyFromRoute = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value.join("/").replace(/^\/+/, "");
  }

  return value?.replace(/^\/+/, "") ?? "";
};

export const isMissingObjectError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return s3Error.name === "NoSuchKey" || s3Error.$metadata?.httpStatusCode === 404;
};
