const fs = require('fs');
const path = require('path');
const dir = 'd:/TourGenie/admin/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;
  
  if (content.match(/setLoading\(\s*=/)) {
    content = content.replace(/setLoading\(\s*=/g, 'setLoading] =');
    changed = true;
  }
  if (content.match(/setSearchLoading\(\s*=/)) {
    content = content.replace(/setSearchLoading\(\s*=/g, 'setSearchLoading] =');
    changed = true;
  }
  if (content.match(/setFacLoading\(\s*=/)) {
    content = content.replace(/setFacLoading\(\s*=/g, 'setFacLoading] =');
    changed = true;
  }
  
  if (content.includes('placeholder="Search vehicles or plate...\n')) {
    content = content.replace('placeholder="Search vehicles or plate...\n', 'placeholder="Search vehicles or plate..."\n');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed exactly ' + f);
  }
});
