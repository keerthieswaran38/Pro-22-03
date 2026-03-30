const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'styles', 'user.css');
let text = fs.readFileSync(cssPath, 'utf8');

const searchStr = "    .bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }\r\n\r\n/* Global Interactive Mouse Glow */";
const searchStr2 = "    .bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }\n\n/* Global Interactive Mouse Glow */";
const searchStr3 = "    .bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }\n/* Global Interactive Mouse Glow */";

let replacementStr = "    .bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }\n}\n\n/* Global Interactive Mouse Glow */";

if (text.includes(searchStr)) {
    text = text.replace(searchStr, replacementStr);
} else if (text.includes(searchStr2)) {
    text = text.replace(searchStr2, replacementStr);
} else if (text.includes(searchStr3)) {
    text = text.replace(searchStr3, replacementStr);
} else {
    // try split string
    text = text.replace("    .bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }\r\n\n/* Global Interactive Mouse Glow */", replacementStr);
    
    // ultimate regex fallback
    text = text.replace(/\.bg-text-watermark, \.section-bg-text, \.gallery-bg-text \{ display: none !important; \}\s*\/\* Global Interactive Mouse Glow \*\//, replacementStr);
}

fs.writeFileSync(cssPath, text, 'utf8');
console.log("Brace added");
