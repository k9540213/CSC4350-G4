export function updateAt<T>(arr: T[], i: number, value: T): T[] {
  const copy = [...arr];
  copy[i] = value;
  return copy;
}

export function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}
