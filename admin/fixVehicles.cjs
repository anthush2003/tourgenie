const fs = require('fs');
let c = fs.readFileSync('d:/TourGenie/admin/src/pages/VehiclesPage.tsx', 'utf8');
c = c.replace(/    return \(\n          <\/select>/, `    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Vehicles</h1><p className="text-ink-800/50 text-sm">{vehicles.length} in fleet — shown to customers booking a tour package</p></div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search vehicles or plate..."
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-56" />
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none appearance-none">
            <option value="all">All Types</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>`);
fs.writeFileSync('d:/TourGenie/admin/src/pages/VehiclesPage.tsx', c);
console.log('Restored VehiclesPage');
