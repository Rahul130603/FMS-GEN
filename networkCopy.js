import fs from "node:fs/promises";
import path from "node:path";

function absoluteFolder(value, label) {
  const folder = String(value || "").trim();
  if (!folder || !path.isAbsolute(folder)) throw new Error(`${label} must be an absolute folder path`);
  return path.resolve(folder);
}

export async function findNetworkItems(source, isbns) {
  const sourcePath = absoluteFolder(source, "Source");
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });
  const index = new Map();
  for (const entry of entries) {
    const isbn = entry.name.match(/^(\d{13})(?=$|[_.\s-])/)?.[1];
    if (!isbn || (!entry.isFile() && !entry.isDirectory())) continue;
    if (!index.has(isbn)) index.set(isbn, []);
    index.get(isbn).push(entry.name);
  }
  const found = [], missing = [];
  for (const isbn of [...new Set(isbns.map(value => String(value).trim()))]) {
    if (!/^\d{13}$/.test(isbn)) throw new Error(`Invalid 13-digit ISBN: ${isbn}`);
    const names = index.get(isbn);
    if (!names?.length) { missing.push(isbn); continue; }
    names.sort();
    found.push({ isbn, name: names.join(", "), kind: "ISBN files", source: sourcePath, path: path.join(sourcePath, names[0]), paths: names.map(name => path.join(sourcePath, name)) });
  }
  return { ok: true, found, missing };
}

export async function copyNetworkItem(item, destination, batch) {
  const destinationRoot = absoluteFolder(destination, "Destination");
  const batchName = String(batch || "").trim();
  if (batchName && (/[<>:"/\\|?*]/.test(batchName) || batchName === "." || batchName === ".." || /[. ]$/.test(batchName))) throw new Error("Batch must be a folder name, without path separators");
  const targetFolder = batchName ? path.join(destinationRoot, batchName) : destinationRoot;
  const paths = [...new Set(item?.paths || (item?.path ? [item.path] : []))];
  if (!paths.length) throw new Error("No source files supplied");
  const sources = [];
  for (const source of paths) {
    const sourcePath = await fs.realpath(absoluteFolder(source, "Source"));
    const stat = await fs.stat(sourcePath);
    const target = path.join(targetFolder, path.basename(sourcePath));
    const relative = path.relative(sourcePath, target);
    if (!relative || (stat.isDirectory() && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) throw new Error("Destination must be outside the source folder");
    sources.push({ sourcePath, target, stat });
  }
  await fs.mkdir(targetFolder, { recursive: true });
  // Only report success after every real file belonging to this ISBN has copied.
  for (const { sourcePath, target, stat } of sources) {
    if (stat.isDirectory()) await fs.cp(sourcePath, target, { recursive: true, force: true });
    else await fs.copyFile(sourcePath, target);
  }
  return { ok: true, isbn: item.isbn, sourcePath: sources[0].sourcePath, destinationPath: sources.length === 1 ? sources[0].target : targetFolder, copiedPaths: sources.map(source => source.target), copiedAt: Date.now() };
}
