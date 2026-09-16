import { Cloudinary } from "@cloudinary/url-gen";
import { fill, fit, limitFit } from "@cloudinary/url-gen/actions/resize";

interface CloudinaryImageOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit";
  quality?: "auto" | "auto:good" | "auto:eco";
}

export const cld = new Cloudinary({ cloud: { cloudName: "fd9kyggd" } });

/** Creates the object required by `<AdvancedImage cldImg={image} />`. */
export function getCloudinaryImage(
  publicId: string,
  { width, height, crop = "limit", quality = "auto:good" }: CloudinaryImageOptions = {},
) {
  const image = cld.image(publicId).format("auto").quality(quality);

  if (width || height) {
    const resizeAction = crop === "fill" ? fill() : crop === "fit" ? fit() : limitFit();
    if (width) resizeAction.width(width);
    if (height) resizeAction.height(height);
    image.resize(resizeAction);
  }

  return image;
}
