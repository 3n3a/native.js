/**
 * Development server for Native.js examples
 * 
 * - /examples/<folder>/* → SPA routing (falls back to <folder>/index.html)
 * - Other paths → Normal static file serving (404 if not found)
 * 
 * Run: bun serve.ts
 */

const PORT = 3000;

// Folders that should have SPA behavior
const SPA_FOLDERS = ['general', 'forms'];

Bun.serve({
    port: PORT,
    
    async fetch(req) {
        const url = new URL(req.url);
        let pathname = url.pathname;
        
        // Remove trailing slash (except for root)
        if (pathname !== '/' && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }

        // Build file path
        let filePath = `./examples${pathname}`;
        
        // Check if this is an SPA folder route
        for (const folder of SPA_FOLDERS) {
            const spaPrefix = `/${folder}`;
            if (pathname.startsWith(spaPrefix)) {
                // Try the actual file first
                const file = Bun.file(filePath);
                if (await file.exists()) {
                    return new Response(file);
                }
                
                // Fall back to folder's index.html (SPA behavior)
                const indexPath = `./examples/${folder}/index.html`;
                const indexFile = Bun.file(indexPath);
                if (await indexFile.exists()) {
                    return new Response(indexFile);
                }
            }
        }
        
        // Handle directory requests (add index.html)
        if (!pathname.includes('.')) {
            filePath = `${filePath}/index.html`;
        }
        
        // Try to serve the file
        const file = Bun.file(filePath);
        if (await file.exists()) {
            return new Response(file);
        }
        
        // 404 for non-SPA routes
        return new Response('Not Found', { status: 404 });
    }
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log(`   Examples: http://localhost:${PORT}/`);
console.log(`   General:  http://localhost:${PORT}/general/`);
console.log(`   Forms:    http://localhost:${PORT}/forms/`);

