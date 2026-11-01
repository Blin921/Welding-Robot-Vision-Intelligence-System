import Image from "next/image";

export default function BrandMark() {
  return (
    <Image
      className="brand-symbol"
      src="/brand/smart-vision.png"
      alt=""
      width={48}
      height={48}
      priority
      unoptimized
    />
  );
}
