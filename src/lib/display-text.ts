export const cleanDisplayText = (value = "") =>
  value
    .replace(/[。．.]+/g, "，")
    .replace(/，\s*，/g, "，")
    .replace(/[，、\s]+$/g, "")
    .trim();
