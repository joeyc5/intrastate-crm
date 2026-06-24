import Image from "next/image";

export function Brand() {
  return (
    <Image
      src="/svm-logo.png"
      alt="Silicon Valley Moving & Storage"
      width={1712}
      height={310}
      priority
      className="h-9 w-auto sm:h-10"
    />
  );
}
