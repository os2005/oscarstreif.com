import { existsSync, renameSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export function writeFileAtomic(targetPath: string, contents: string) {
  const directory = path.dirname(targetPath);
  const tempPath = path.join(directory, `${path.basename(targetPath)}.${process.pid}.${randomUUID()}.tmp`);

  writeFileSync(tempPath, contents, "utf8");

  try {
    renameSync(tempPath, targetPath);
  } catch {
    if (existsSync(targetPath)) {
      unlinkSync(targetPath);
    }

    renameSync(tempPath, targetPath);
  }
}
