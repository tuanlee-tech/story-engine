import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Tăng nếu máy khỏe (mặc định = 50% số nhân). Ví dụ: npx remotion render ... --concurrency=8
