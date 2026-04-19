require('ts-node').register(); // or maybe I'll just use a .cjs script

const fs = require('fs');

const dataStr = fs.readFileSync('src/data/competitions.ts', 'utf8');

const titles = [...dataStr.matchAll(/title:\s*'([^']+)'/g)].map(m => m[1]);
const handles = [...dataStr.matchAll(/handle:\s*'([^']+)'/g)].map(m => m[1]);

console.log('titles', titles);

const isSuper = false;
const adminProfile = {
  roleLevel: ['department_admin-computer-engineering']
};

const allowedHandles = new Set();
const allowedEventTitles = new Set();

const roleMapping = {
  'admin-forge-x': { handle: 'Forge-Lead', eventTitle: 'Forge-X' },
  'admin-algo-bid': { handle: 'Algo-Master', eventTitle: 'AlgoBid' },
};

const DEPARTMENT_PSEUDO_ROLES = {
  'department_admin-computer-engineering': ['admin-forge-x', 'admin-algo-bid'],
};

let expandedRoles = [];
adminProfile.roleLevel.forEach(role => {
  expandedRoles.push(role);
  if (DEPARTMENT_PSEUDO_ROLES[role]) {
    expandedRoles.push(...DEPARTMENT_PSEUDO_ROLES[role]);
  }
});

expandedRoles.forEach(role => {
  const mapping = roleMapping[role];
  if (mapping) {
    if (!mapping.eventTitle) {
      allowedHandles.add(mapping.handle);
    } else {
      allowedEventTitles.add(mapping.eventTitle.toUpperCase());
    }
  }
});

console.log('allowedHandles', allowedHandles);
console.log('allowedEventTitles', allowedEventTitles);

// Simulate filteredComps
const testComps = [{ title: 'Forge-X', handle: undefined }, { title: 'AlgoBid', handle: undefined }];

const filteredComps = testComps.filter(c => {
  if (!isSuper) {
    if (!allowedHandles.has(c.handle || '') && !allowedEventTitles.has(c.title.toUpperCase())) {
      return false;
    }
  }
  return true;
});

console.log('filteredComps', filteredComps.length);
