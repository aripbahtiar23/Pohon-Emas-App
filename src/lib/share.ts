export type ShareOptions = {
  dataUrl: string;
  filename: string;
  title?: string;
  text?: string;
};

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};

export const canShareFiles = (): boolean => {
  if (typeof navigator === "undefined") return false;
  if (!("share" in navigator) || !("canShare" in navigator)) return false;
  try {
    const dummy = new File([""], "test.png", { type: "image/png" });
    return navigator.canShare({ files: [dummy] });
  } catch {
    return false;
  }
};

export const sharePNG = async ({ dataUrl, filename, title, text }: ShareOptions): Promise<boolean> => {
  if (!canShareFiles()) return false;
  try {
    const file = await dataUrlToFile(dataUrl, filename);
    await navigator.share({ files: [file], title: title || "Pohon Emas Story", text: text || "" });
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return false;
    throw err;
  }
};

export const downloadPNG = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
};
