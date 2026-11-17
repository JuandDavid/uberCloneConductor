/**
 * Suite de pruebas unitarias: Análisis Estático AST con Babel
 * Analiza todos los archivos de src/ garantizando que no existan
 * errores de sintaxis, tokens huérfanos o cierres prematuros en StyleSheet/JSX.
 *
 * Ejecutar: node --test test/astValidation.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Importar babel parser usando pathToFileURL
const parserUrl = pathToFileURL(path.join(rootDir, 'node_modules', '@babel', 'parser', 'lib', 'index.js')).href;
const parserModule = await import(parserUrl);
const parser = parserModule.default || parserModule;

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== '.expo') {
        getJsFiles(full, fileList);
      }
    } else if (f.endsWith('.js')) {
      fileList.push(full);
    }
  }
  return fileList;
}

test('Análisis Sintáctico AST: todos los archivos en src/ deben compilar con 0 errores', () => {
  const srcDir = path.join(rootDir, 'src');
  const allFiles = getJsFiles(srcDir);

  assert.ok(allFiles.length > 20, 'Debe haber más de 20 archivos de código en src/');

  const errors = [];

  for (const file of allFiles) {
    const code = fs.readFileSync(file, 'utf8');
    try {
      parser.parse(code, { sourceType: 'module', plugins: ['jsx'] });
    } catch (err) {
      errors.push({ file: path.relative(rootDir, file), error: err.message });
    }
  }

  assert.deepEqual(errors, [], `Se encontraron errores de sintaxis en: ${JSON.stringify(errors, null, 2)}`);
});
