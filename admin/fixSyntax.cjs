const fs = require('fs');
const path = require('path');
const dir = 'd:/TourGenie/admin/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;
  
  if (content.includes('setLoading(]')) {
    content = content.replace(/setLoading\(\]/g, 'setLoading]');
    changed = true;
  }
  if (content.includes('setSearchLoading(]')) {
    content = content.replace(/setSearchLoading\(\]/g, 'setSearchLoading]');
    changed = true;
  }
  if (content.includes('setFacLoading(]')) {
    content = content.replace(/setFacLoading\(\]/g, 'setFacLoading]');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed syntax in ' + f);
  }
});
