const fs = require('fs');
let content = fs.readFileSync('src/data/competitions.ts', 'utf8');

const mapping = {
  'CMP-26-FLG-PRX-001': 'ParamX-Hack',
  'CMP-26-FLG-ROBO-MAIN': 'Robo-Kshetra',
  'CMP-26-FLG-BAT-MAIN': 'Battle-Grid',
  'CMP-26-FLG-ALX-002': 'Robo-Kshetra',
  'CMP-26-FLG-RBR-003': 'Robo-Kshetra',
  'CMP-26-FLG-RBM-004': 'Robo-Kshetra',
  'CMP-26-BTG-BGMI-001': 'Battle-Grid',
  'CMP-26-BTG-FF-002': 'Battle-Grid',
  'CMP-26-BTG-CODM-003': 'Battle-Grid',
  'CMP-26-BTG-SF4-004': 'Battle-Grid',
  'CMP-26-BTG-AUS-005': 'Battle-Grid',
  'CMP-26-CS-FGX-001': 'Forge-Lead',
  'CMP-26-CS-ALB-002': 'Algo-Master',
  'CMP-26-IT-CDL-003': 'Code-Climber',
  'CMP-26-AD-IPL-004': 'IPL-Auctioneer',
  'CMP-26-EC-BCC-005': 'Blind-Coder',
  'CMP-26-AM-DVC-006': 'Dev-Striker',
  'CMP-26-AM-VSP-007': 'Vibe-Lead',
  'CMP-26-AM-CRR-008': 'Relay-Coder',
  'CMP-26-CE-BRN-009': 'Arch-Nova',
  'CMP-26-EE-PPT-010': 'Paper-Lead',
  'CMP-26-EE-SPT-011': 'Spark-Lead',
  'CMP-26-EC-MTM-012': 'Mat-Master',
  'CMP-26-EC-CTS-013': 'Circuit-Ninja',
  'CMP-26-ME-CTC-014': 'Master-Builder',
  'CMP-26-EC-CCK-015': 'Cricket-Lead',
  'CMP-26-GEN-PPR-001': 'Research-Lead',
  'CMP-26-GEN-PRJ-002': 'Project-Master'
};

// First let's remove any existing handle to standardize
content = content.replace(/\s+handle:\s+'.*?',/g, '');

// Now we inject handle based on id
let modificationsCount = 0;
for (const [id, handle] of Object.entries(mapping)) {
  // Inject handle after slug if it exists, otherwise before status
  const slugMatch = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?slug:\\s*'.*?',)`, 'g');
  const statusMatch = new RegExp(`(id:\\s*'${id}'[\\s\\S]*?)(status:\\s*")`, 'g');
  
  if (slugMatch.test(content)) {
      content = content.replace(slugMatch, (match, p1) => {
        modificationsCount++;
        return p1 + `\n        handle: '${handle}',`;
      });
  } else {
      content = content.replace(statusMatch, (match, p1, p2) => {
        modificationsCount++;
        return p1 + `handle: '${handle}',\n        ` + p2;
      });
  }
}

fs.writeFileSync('src/data/competitions.ts', content, 'utf8');
console.log('Modified', modificationsCount, 'properties');
