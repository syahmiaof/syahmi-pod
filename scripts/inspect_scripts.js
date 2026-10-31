const fs = require('fs');
const html = fs.readFileSync('sofi_raw.html', 'utf8');

const scriptTags = [...html.matchAll(/<script[\s\S]*?<\/script>/gi)].map(m => m[0]);
console.log('Script tags count:', scriptTags.length);
scriptTags.forEach((s, i) => {
  console.log(`\n--- Script ${i} ---`);
  if (s.length > 300) {
    console.log(s.slice(0, 200) + '... (len: ' + s.length + ')');
  } else {
    console.log(s);
  }
});
