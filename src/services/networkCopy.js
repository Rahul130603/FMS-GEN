export async function runCopyPool(items, copy, concurrency = 4) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await copy(items[index], index);
    }
  }));
}
