import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname);
const input = readFileSync(resolve(root, 'src/styles.css'), 'utf-8');

const result = await postcss([tailwind]).process(input, {
  from: resolve(root, 'src/styles.css'),
  to: resolve(root, 'src/tailwind-generated.css'),
});

writeFileSync(resolve(root, 'src/tailwind-generated.css'), result.css);
console.log(`CSS generated: ${(result.css.length / 1024).toFixed(0)} KB`);
