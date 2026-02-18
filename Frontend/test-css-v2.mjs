
import fs from 'fs';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const css = fs.readFileSync('app/globals.css', 'utf8');

// Note: postcss-load-config is usually needed to pick up tailwind.config.mjs automatically 
// but @tailwindcss/postcss plugin should handle it if configured.
// However, running straight postcss() in this script might not pick up the config file without explicitly passing it 
// or ensuring the environment searches for it. 
// The @tailwindcss/postcss plugin automatically looks for tailwind.config.js/mjs/ts.

console.log("Compiling CSS...");

try {
    const result = await postcss([
        tailwind()
    ]).process(css, { from: 'app/globals.css', to: 'output.css' });

    console.log('CSS compiled successfully!');
    // Check if some class exists in output (rudimentary check)
    if (result.css.includes('--color-background')) {
        console.log('Theme variables found in output.');
    }
} catch (error) {
    console.error('CSS compilation failed:');
    console.error(error);
}
