
import os
import re
import json

SRC_DIR = "/home/john/nightlio/src"
ENTRY_POINTS = [
    "/home/john/nightlio/src/main.jsx", 
    "/home/john/nightlio/src/index.jsx",
    "/home/john/nightlio/src/index.js",
    "/home/john/nightlio/src/main.js",
    "/home/john/nightlio/src/App.jsx", 
    "/home/john/nightlio/src/index.css",
    "/home/john/nightlio/src/App.css"
]

files_map = {} # path -> { exports: [], imports: [], raw_content: "" }

def get_files(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        for filename in filenames:
            if filename.endswith(('.js', '.jsx', '.css')):
                files.append(os.path.abspath(os.path.join(root, filename)))
    return files

def analyze_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    exports = []
    imports = []

    # Regex for exports
    # export const x
    # export function x
    # export class x
    # export default x
    # export { x, y }
    
    # Simple heuristic regexes
    named_export_pattern = re.compile(r'export\s+(?:const|function|class|let|var)\s+([\w\d_]+)')
    exports.extend(named_export_pattern.findall(content))
    
    if 'export default' in content:
        exports.append('default')

    # export { x, y } pattern
    multi_export_pattern = re.compile(r'export\s+\{([^}]+)\}')
    for match in multi_export_pattern.findall(content):
        # clean and split
        parts = [x.strip().split(' as ')[-1] for x in match.split(',')]
        exports.extend([p for p in parts if p])

    # Regex for imports
    # import x from 'path'
    # import { x } from 'path'
    # import 'path' (side effect)
    
    # We mainly care about the PATHS being imported to see if a file is alive
    import_path_pattern = re.compile(r'from\s+[\'"]([^\'"]+)[\'"]')
    imports.extend(import_path_pattern.findall(content))
    
    # dynamic import or side effect import
    side_effect_import = re.compile(r'import\s*[\'"]([^\'"]+)[\'"]')
    imports.extend(side_effect_import.findall(content))

    return {
        'exports': exports,
        'imports': imports,
        'path': filepath
    }

all_files = get_files(SRC_DIR)
for f in all_files:
    files_map[f] = analyze_file(f)

# Resolve imports to absolute paths to build dependency graph
# This is tricky without a real resolver, but we'll try heuristics
def resolve_import(source_file, import_path):
    # Ignore node_modules
    if not import_path.startswith('.'):
        return None 
    
    dir_path = os.path.dirname(source_file)
    target_path = os.path.normpath(os.path.join(dir_path, import_path))
    
    # Try extensions
    extensions = ['', '.js', '.jsx', '.css', '/index.js', '/index.jsx']
    for ext in extensions:
        candidate = target_path + ext
        if candidate in files_map:
            return candidate
    return None

# Build liveness graph
alive_files = set()
for ep in ENTRY_POINTS:
    if ep in files_map:
        alive_files.add(ep)

# Iterative propagation
changed = True
while changed:
    changed = False
    for filepath, data in files_map.items():
        if filepath in alive_files:
            # Mark its imports as alive
            for imp in data['imports']:
                resolved = resolve_import(filepath, imp)
                if resolved and resolved not in alive_files:
                    alive_files.add(resolved)
                    changed = True

# Identify dead files
dead_files = [f for f in files_map if f not in alive_files]

# Identify unused exports (harder,requires parsing named imports vs default imports)
# For now, let's stick to dead FILES as the primary output, as unused exports is prone to false positives with simple regex
# We can do a basic check: if a file IS alive, but NO ONE imports it, it's actually dead (unless it's an entry point)

# Refined dead check:
# Start with Entry points. Traverse imports.
# Any file not visited is dead.

print(json.dumps({
    "total_files": len(all_files),
    "dead_files": sorted([os.path.relpath(f, SRC_DIR) for f in dead_files]),
    "alive_count": len(alive_files)
}, indent=2))
