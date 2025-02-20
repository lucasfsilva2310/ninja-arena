export function getRandomIndex<T>(arr: T[]): number {
  const min = 0;
  const max = arr.length;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
