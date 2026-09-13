const fs = require('fs');
const path = require('path');
const dir = 'd:/TourGenie/admin/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;
  
  if (content.includes('setLoading...')) {
    content = content.replace(/setLoading\.\.\./g, 'setLoading(');
    changed = true;
  }
  if (content.includes('setSearchLoading...')) {
    content = content.replace(/setSearchLoading\.\.\./g, 'setSearchLoading(');
    changed = true;
  }
  if (content.includes('setFacLoading...')) {
    content = content.replace(/setFacLoading\.\.\./g, 'setFacLoading(');
    changed = true;
  }
  
  // VehiclesPage string placeholder error
  if (content.includes('placeholder="Search vehicles or plate..."')) {
    content = content.replace('placeholder="Search vehicles or plate..."\n              className=', 'placeholder="Search vehicles or plate..." className=');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed ' + f);
  }
});
