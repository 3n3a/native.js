import { readdir } from 'node:fs/promises';
import path from 'node:path';

async function copyFiles(sourceDirectory: string, targetDirectory: string) {
    const files = await readdir(sourceDirectory);
    for (const file of files) {
        console.log('Copying "' + file + '" to ' + targetDirectory)
        const sourcePath = path.join(sourceDirectory, file);
        copySingleFile(sourcePath, targetDirectory);
    }
}

async function copySingleFile(sourceFile: string, targetDirectory: string) {
    const inputFile = Bun.file(sourceFile);
    if (!inputFile.exists()) {
        // TODO: could possibly error
        return;
    }

    const sourceFileName = path.basename(sourceFile);
    const targetPath = path.join(targetDirectory, sourceFileName);
    const outputFile = Bun.file(targetPath);
    outputFile.write(inputFile);
}

await copyFiles('build', 'examples/lib');