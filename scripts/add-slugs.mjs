import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/data/competitions.ts';
let content = readFileSync(filePath, 'utf8');

// Strategy: after each `status: "published"` or `isExhibition: true` closing block,
// inject slug and handle if not already present for the given ID.
// We match by id and inject the two fields before the closing `},`

const patches = [
  { id: "CMP-26-FLG-ALX-002", slug: "align-x-26",            handle: "AlignX"          },
  { id: "CMP-26-FLG-RBR-003", slug: "robo-rush-26",           handle: "RoboRush"        },
  { id: "CMP-26-FLG-RBM-004", slug: "robo-maze-26",           handle: "RoboMaze"        },
  { id: "CMP-26-BTG-BGMI-001",slug: "bgmi-26",                handle: "BGMI"            },
  { id: "CMP-26-BTG-FF-002",  slug: "free-fire-26",           handle: "FreeFire"        },
  { id: "CMP-26-BTG-CODM-003",slug: "codm-26",                handle: "CODM"            },
  { id: "CMP-26-BTG-SF4-004", slug: "shadow-fight-4-26",      handle: "ShadowFight4"   },
  { id: "CMP-26-BTG-AUS-005", slug: "among-us-26",            handle: "AmongUs"         },
  { id: "CMP-26-CS-FGX-001",  slug: "forge-x-26",             handle: "Forge-Lead"     },
  { id: "CMP-26-CS-ALB-002",  slug: "algo-bid-26",            handle: "Algo-Master"    },
  { id: "CMP-26-IT-CDL-003",  slug: "code-ladder-26",         handle: "Code-Climber"   },
  { id: "CMP-26-AD-IPL-004",  slug: "ipl-auction-26",         handle: "IPL-Auctioneer" },
  { id: "CMP-26-EC-BCC-005",  slug: "blind-code-26",          handle: "Blind-Coder"    },
  { id: "CMP-26-AM-DVC-006",  slug: "dev-clash-26",           handle: "Dev-Striker"    },
  { id: "CMP-26-AM-VSP-007",  slug: "vibe-sprint-26",         handle: "Vibe-Lead"      },
  { id: "CMP-26-AM-CRR-008",  slug: "code-relay-26",          handle: "Relay-Coder"    },
  { id: "CMP-26-CE-BRN-009",  slug: "bridge-nova-26",         handle: "Arch-Nova"      },
  { id: "CMP-26-EE-PPT-010",  slug: "poster-presentation-26", handle: "Paper-Lead"     },
  { id: "CMP-26-EE-SPT-011",  slug: "spark-tank-26",          handle: "Spark-Lead"     },
  { id: "CMP-26-EC-MTM-012",  slug: "matlab-madness-26",      handle: "Mat-Master"     },
  { id: "CMP-26-EC-CTS-013",  slug: "circuit-sim-26",         handle: "Circuit-Ninja"  },
  { id: "CMP-26-ME-CTC-014",  slug: "contraptions-26",        handle: "Master-Builder" },
  { id: "CMP-26-EC-CCK-015",  slug: "circle-cricket-26",      handle: "Cricket-Lead"   },
  { id: "CMP-26-GEN-PPR-001", slug: "paper-presentation-26",  handle: "Research-Lead"  },
  { id: "CMP-26-GEN-PRJ-002", slug: "project-comp-26",        handle: "Project-Master" },
];

let changed = 0;
for (const { id, slug, handle } of patches) {
  // Skip if slug already present for this entry
  const idIdx = content.indexOf(`id: '${id}'`);
  if (idIdx === -1) { console.log(`SKIP (not found): ${id}`); continue; }

  // Find the next closing `},` after this id's block start
  const blockEnd = content.indexOf('\n    },', idIdx);
  if (blockEnd === -1) { console.log(`SKIP (no block end): ${id}`); continue; }

  // Check if slug is already in this block
  const blockContent = content.substring(idIdx, blockEnd);
  if (blockContent.includes("slug:")) { console.log(`SKIP (already has slug): ${id}`); continue; }

  // Inject before the closing `},`
  const injection = `\n        slug: '${slug}',\n        handle: '${handle}'`;
  content = content.substring(0, blockEnd) + injection + content.substring(blockEnd);
  changed++;
  console.log(`PATCHED: ${id} -> ${slug}`);
}

writeFileSync(filePath, content, 'utf8');
console.log(`\nDone. Patched ${changed} competitions.`);
