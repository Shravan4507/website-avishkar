const fs = require('fs');

const data = fs.readFileSync('src/data/competitions.ts', 'utf8');

const updates = [
  {
    title: "Forge-X",
    fee: 99,
    prizePool: "9000",
    coords: [{name: "Chetan Badgujar", phone: "8530052369"}, {name: "Yuvraj Gaykhe", phone: "7276310480"}, {name: "Vedanshu Kshirsagar", phone: "9822239552"}],
    rename: null
  },
  {
    title: "AlgoBid",
    fee: 99,
    prizePool: "9000",
    coords: [{name: "Tejprakash Mirashi", phone: "7378965050"}, {name: "Yuvraj Gaykhe", phone: "7276310480"}, {name: "Vedanshu Kshirsagar", phone: "9822239552"}],
    rename: null
  },
  {
    title: "Code Ladder",
    fee: 250,
    prizePool: "15000",
    coords: [{name: "Shreya Kad", phone: "7517021872"}, {name: "Sujal Jaju", phone: "8010127828"}],
    rename: null
  },
  {
    title: "The Duel", // Shadow Fight 4
    fee: 150,
    prizePool: "8000",
    coords: [{name: "Pranav Kulkarni", phone: "9423162724"}, {name: "Sujal Jaju", phone: "8010127828"}],
    rename: null
  },
  {
    title: "Call of Duty Mobile",
    fee: 400,
    prizePool: "16000",
    coords: [{name: "Vaibhav Bandgar", phone: "9730906103"}, {name: "Sujal Jaju", phone: "8010127828"}],
    rename: null
  },
  {
    title: "IPL Auction",
    fee: 250,
    prizePool: "31000",
    coords: [{name: "Dhanraj Funde", phone: "9370304023"}],
    rename: null
  },
  {
    title: "DevClash",
    fee: 250,
    prizePool: "10000",
    coords: [{name: "Vallabh Gundap", phone: "9921371155"}, {name: "Varad Gaurav", phone: "7887323956"}],
    rename: "Dev Clash"
  },
  {
    title: "Vibe Sprint",
    fee: 100,
    prizePool: "10000",
    coords: [{name: "M Venkat Chandrakat Babu", phone: "8788675249"}, {name: "Varad Gaurav", phone: "7887323956"}],
    rename: null
  },
  {
    title: "Code Relay Race",
    fee: 250,
    prizePool: "10000",
    coords: [{name: "Parth Shinde", phone: "9168906630"}, {name: "Varad Gaurav", phone: "7887323956"}],
    rename: "Code Run"
  },
  {
    title: "Bridge Nova",
    fee: 150,
    prizePool: "11000",
    coords: [{name: "Ashish Shinde", phone: "9373113736"}],
    rename: null
  },
  {
    title: "Poster Presentation",
    fee: 100,
    prizePool: "6000",
    coords: [{name: "Pranav Katu", phone: "9503231138"}, {name: "Shubham Jagtap", phone: "9172125455"}],
    rename: null
  },
  {
    title: "Squad Combat", // Free Fire
    fee: 250,
    prizePool: "6000",
    coords: [{name: "Rohit Chavan", phone: "7823056055"}, {name: "Shubham Jagtap", phone: "9172125455"}],
    rename: null
  },
  {
    title: "Spark Tank",
    fee: 200,
    prizePool: "6000",
    coords: [{name: "Harshita Jadhav", phone: "9356766305"}, {name: "Shubham Jagtap", phone: "9172125455"}],
    rename: "Spark Tank - Electro-Innovation Pitch"
  },
  {
    title: "Matlab Madness",
    fee: 300,
    prizePool: "6000",
    coords: [{name: "Pranav Achrekar", phone: "7058481186"}, {name: "Aadesh Bartakke", phone: "8888487529"}, {name: "Sarvesh Vadgave", phone: "7709594746"}, {name: "Neel Mehata", phone: "7741022634"}],
    rename: null
  },
  {
    title: "Circuit Simulation",
    fee: 300,
    prizePool: "6000",
    coords: [{name: "Saniya Jadhav", phone: "9699281400"}, {name: "Aadesh Bartakke", phone: "8888487529"}, {name: "Sarvesh Vadgave", phone: "7709594746"}, {name: "Neel Mehata", phone: "7741022634"}],
    rename: null
  },
  {
    title: "Blind Code Challenge",
    fee: 200,
    prizePool: "6000",
    coords: [{name: "Sherya Kadam", phone: "9511659631"}, {name: "Yadnesh Chakolkar", phone: "8080206737"}],
    rename: null
  },
  {
    title: "Social Deduction", // Among Us
    fee: 100,
    prizePool: "6000",
    coords: [{name: "Mrunali Kolte", phone: "9067101314"}, {name: "Yadnesh Chakolkar", phone: "8080206737"}],
    rename: null
  },
  {
    title: "Circle Cricket",
    fee: 100,
    prizePool: "6000",
    coords: [{name: "Trushita Barhate", phone: "9009989885"}, {name: "Yadnesh Chakolkar", phone: "8080206737"}],
    rename: null
  },
  {
    title: "Contraptions Challenge",
    fee: 150,
    prizePool: "6000",
    coords: [{name: "Swapnil Gole", phone: "7058855414"}, {name: "Trupti doiphode", phone: "9309206369"}],
    rename: "Contraption Challange"
  }
];

let newData = data;

const eventsBlocks = newData.split(/{\s*id:/g);

for (let i = 1; i < eventsBlocks.length; i++) {
    let block = '{\n        id:' + eventsBlocks[i];
    
    // find title
    const titleMatch = block.match(/title:\s*'([^']+)'/);
    if (!titleMatch) continue;
    const currentTitle = titleMatch[1];
    
    const updateInfo = updates.find(u => u.title === currentTitle);
    if (updateInfo) {
        // update entryFee
        block = block.replace(/entryFee:\s*\d+,/, `entryFee: ${updateInfo.fee},`);
        
        // ensure prizePool
        if (!block.includes('prizePool')) { // add it near entryFee
            block = block.replace(/entryFee:\s*\d+,/, `entryFee: ${updateInfo.fee},\n        prizePool: '${updateInfo.prizePool}',`);
        } else {
            block = block.replace(/prizePool:\s*'[^']+',/, `prizePool: '${updateInfo.prizePool}',`);
        }

        const coordsString = 'coordinators: [\n' + updateInfo.coords.map(c => `            { name: "${c.name}", phone: "${c.phone}" }`).join(',\n') + '\n        ],';
        block = block.replace(/coordinators:\s*\[[\s\S]*?\],/, coordsString);

        if (updateInfo.rename !== null) {
            block = block.replace(new RegExp(`title:\\s*'${currentTitle}'`), `title: '${updateInfo.rename}'`);
        }

        // KEEP "id:" in place now!
        eventsBlocks[i] = block.replace(/^\{\n\s*id:/, ''); // Just strip off the `{\n        id:` prefix because we prefix it uniformly down below!
    } else {
        eventsBlocks[i] = eventsBlocks[i]; // Untouched
    }
}

// Re-assemble
const finalData = eventsBlocks[0] + eventsBlocks.slice(1).map(b => '{\n        id:' + b).join('');

fs.writeFileSync('src/data/competitions.ts', finalData);
console.log('Update finished.');
