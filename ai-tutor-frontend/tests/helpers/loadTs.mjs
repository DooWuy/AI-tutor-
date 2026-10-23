import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../', import.meta.url));
export function tsLoader({ mocks = {}, globals = {}, env = {} } = {}) {
  const cache = new Map();
  function load(path) {
    const absolute = resolve(root, path);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const source = readFileSync(absolute, 'utf8').replaceAll('import.meta.env', `(${JSON.stringify(env)})`);
    const compiled = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    const context = createContext({ module, exports: module.exports, console, URL, URLSearchParams, AbortController,
      Error, setTimeout, clearTimeout, setInterval, clearInterval, ...globals,
      require: name => {
        for (const [key, value] of Object.entries(mocks)) if (name.includes(key)) return value;
        if (name.endsWith('.css')) return {};
        if (!name.startsWith('.')) return require(name);
        const candidate = resolve(dirname(absolute), name);
        return load(['.ts', '.tsx', ''].map(ext => candidate + ext).find(existsSync) || candidate);
      },
    });
    runInContext(compiled, context, { filename: absolute });
    return module.exports;
  }
  return load;
}
