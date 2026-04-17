import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/data/competitions.ts';
let content = readFileSync(filePath, 'utf8');

// Fix: any line that does NOT end with a comma and is immediately followed by
// a line starting with `slug:` or `handle:` needs a comma added.
// Pattern: a value line (no trailing comma) immediately before slug: or handle:
// Works for CRLF and LF line endings.

const before = content;

// Fix lines like:  isExhibition: true\n        slug:  → isExhibition: true,\n        slug:
// Also handles:   prizePool: 'TBD'\n        slug:  → prizePool: 'TBD',\n        slug:
// And:            status: "published"\n        slug:  (already shouldn't happen but defensive)
content = content.replace(
  /([^\r\n,{])(\r?\n\s+(?:slug|handle):\s)/g,
  '$1,$2'
);

if (content === before) {
  console.log('No changes needed — commas already present.');
} else {
  writeFileSync(filePath, content, 'utf8');
  const count = (before.match(/([^\r\n,{])(\r?\n\s+(?:slug|handle):\s)/g) || []).length;
  console.log(`Fixed ${count} missing comma(s).`);
}
