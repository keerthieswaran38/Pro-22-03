const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'styles', 'user.css');
let content = fs.readFileSync(cssPath);

// The garbage is either null-byte spaced or regular spaced.
// We'll just truncate the file at the last correct rule end, which is before the corrupted comment.
const text = content.toString('utf8');

// Find the index of the last correct part:
// We know at line 4059 it says: .bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }
// followed by a closing brace at line 4060.
const targetLine = '.bg-text-watermark, .section-bg-text, .gallery-bg-text { display: none !important; }';
const idx = text.lastIndexOf(targetLine);

if (idx !== -1) {
    // Find the next '}' after idx
    const endIdx = text.indexOf('}', idx) + 1;
    let cleanContent = text.substring(0, endIdx);
    
    // Append the correct mouse glow block
    cleanContent += `\n
/* Global Interactive Mouse Glow */
.global-mouse-glow {
    position: fixed;
    top: 0; left: 0;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(255, 95, 0, 0.15) 0%, transparent 75%);
    pointer-events: none;
    z-index: 10000;
    transform: translate(-50%, -50%);
    mix-blend-mode: screen;
    filter: blur(80px);
}
`;
    fs.writeFileSync(cssPath, cleanContent, 'utf8');
    console.log("Successfully cleaned user.css");
} else {
    console.log("Could not find the target line. Please check CSS manually.");
}
