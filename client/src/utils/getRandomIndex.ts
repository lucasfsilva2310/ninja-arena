export function getRandomIndex<T>(arr: T[]): number {
  return Math.floor(Math.random() * arr.length);
}
