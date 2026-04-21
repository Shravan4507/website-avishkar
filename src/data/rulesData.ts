export interface CompetitionRules {
    slug: string;
    name: string;
    tagline?: string;
    description: string;
    teamSize: string;
    fee: string;
    duration?: string;
    category: 'flagship' | 'standard' | 'general';
    rules: string[];
    procedure: string[];
    judgingCriteria: string[];
    prizes: {
        first?: string;
        second?: string;
        third?: string;
    };
    coordinators?: {
        student?: string[];
        faculty?: string[];
    };
    rulebookPath?: string;
    rulebookComingSoon?: boolean;
}

export const RULES_DATA: Record<string, CompetitionRules> = {
    // ── Flagships ──


    // ── Standard Competitions ──

    'ipl-auction': {
        slug: 'ipl-auction',
        name: 'IPL Auction',
        tagline: 'Bid Smart. Build the Best XI.',
        description:
            'Experience the adrenaline of the player auction in this high-stakes cricket simulation. Each franchise begins with ₹100 crore of virtual money to build a squad of 12, with strategic bidding, target-lock cards, and post-auction scoring.',
        teamSize: '1–5 members (per franchise)',
        fee: '₹400',
        category: 'standard',
        rules: [
            'There will be 14 total franchises.',
            'Each franchise must consist of 1 to 5 members acting as team management.',
            'One member must be designated as the Lead Bidder — the only person permitted to place bids.',
            'Internal discussion is allowed, but members are not allowed to interrupt other bidders or the auctioneer.',
            'Each franchise must include exactly 12 players.',
            'Two Wicketkeepers (WK) are compulsory; failure to include them will result in disqualification.',
            'Each franchise can include a maximum of 8 overseas players.',
            'Each franchise begins with a game purse of ₹100 crore (not a real amount).',
            'Budgets cannot be exceeded under any circumstances.',
            'Loans, trades, or refunds are strictly prohibited.',
            'The auction is a single-round event — sold players are removed, unsold players are permanently eliminated.',
            'Bidders can freely call out any higher amount (no fixed increment step).',
        ],
        procedure: [
            'The total player pool includes 170 players.',
            'Management will allot three players (having the same points) to each team at the start.',
            'Each player has a base price set by the auctioneer.',
            `The auctioneer announces the player's name and base price, and confirms the final price with "SOLD!".`,
            'Post-auction evaluation: Each player is given a pre-assigned rating out of 10 based on IPL performance (2023–2025).',
            'Team scoring: Sum of ratings of 12 players. Highest combined rating wins.',
            'Verification checks: Confirm 12 players, 2WK requirement, budget compliance, and rating accuracy.',
        ],
        judgingCriteria: [
            `Team's total player rating score`,
            'Tie-breaker 1: Higher remaining budget',
            'Tie-breaker 2: More players rated 9.0+',
            'Tie-breaker 3: Coin toss by auctioneer',
        ],
        prizes: {
            first: '₹21,000',
            second: '₹7,000',
            third: '₹3,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/ipl-auction.pdf`,
    },

    'algo-bid': {
        slug: 'algo-bid',
        name: 'AlgoBid',
        tagline: 'Bid Smart. Code Faster. Win Bigger.',
        description:
            'A high-energy, strategy-driven competitive programming event combining live auctions with algorithmic problem-solving. Teams use a starting budget of $1000 Virtual Money to bid in real-time to acquire coding problems, then solve them under pressure.',
        teamSize: '3–4 members',
        fee: '₹99',
        duration: '90 minutes per round',
        category: 'standard',
        rules: [
            'Every team MUST bid on every problem.',
            'Minimum bid increment is $50 VM per raise.',
            'Teams are limited to bidding only their current available Virtual Money.',
            'Highest bidder wins the problem; in case of tie, the fastest bid wins.',
            'Each team can win at most ONE problem per round; all bids are final.',
            'Only the winning team may attempt to solve the problem.',
            'Submissions must be made through the designated platform (e.g., HackerRank / LeetCode).',
            'Scoring is binary: full points for correct, zero for incorrect — no partial credit.',
            'All code must be written during the event window.',
            'Teams may request up to 2 hints per problem (each hint deducts 200 points).',
            'Use of the internet outside the designated judge platform is prohibited.',
            'Inter-team communication, collaboration, or code similarity is prohibited.',
            'Submitting pre-written or plagiarized solutions is prohibited.',
        ],
        procedure: [
            'The event consists of 2 rounds, each following an Auction + Solve format.',
            'Each round has a total duration of 90 minutes.',
            'Auction Phase lasts 20 minutes.',
            'Solving Phase lasts 70 minutes.',
            'Teams bid on problems using Virtual Money.',
            'Winning teams solve the acquired problems to earn points.',
            'Round 2 may involve adjusted difficulty; bidding time is reduced to increase pressure.',
        ],
        judgingCriteria: [
            'Points earned from solved problems',
            'Hint deductions: 200 points per hint, max 2 per problem',
            'Final Score = Sum of points from solved problems − (200 × hints used)',
            'Tie-breaker: Earliest correct submission timestamp, then fewer hints, then judge discretion',
        ],
        prizes: {
            first: '₹4,000',
            second: '₹3,000',
            third: '₹2,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/algobid.pdf`,
    },

    'code-ladder': {
        slug: 'code-ladder',
        name: 'Code Ladder',
        tagline: 'Climb the Logic Ladder',
        description:
            'An innovative physical event designed to simulate programming concepts through an interactive, game-based environment. Teams roll dice or follow predefined movement rules, land on specific blocks that trigger coding or problem-solving tasks, and progress through levels of increasing difficulty.',
        teamSize: '4 members per team',
        fee: '₹250 per team',
        category: 'standard',
        rules: [
            'Each team must have exactly 4 members.',
            'No changes in team members after registration.',
            'A participant cannot be part of multiple teams.',
            'Teams must maintain discipline and fair play.',
            'Collaboration within the team is allowed; external help is not permitted.',
            'Respect for organizers, judges, and other participants is mandatory.',
            'Teams must arrive on time at the venue.',
            'Follow all instructions provided during the event.',
            'Organizers reserve the right to modify rules if necessary.',
        ],
        procedure: [
            'The event follows a ladder-based progression system.',
            'Teams move across levels by solving coding challenges.',
            'Each level increases in difficulty.',
            'Top-performing teams advance to final stages.',
            'Teams roll dice or follow predefined movement rules.',
            'Landing on specific blocks triggers coding/problem-solving tasks.',
            'Correct answers allow progression; incorrect answers may result in penalties.',
        ],
        judgingCriteria: [
            'Accuracy of solutions',
            'Time taken to solve challenges',
            'Logical approach and problem-solving ability',
            'Team coordination and participation',
        ],
        prizes: {
            first: '₹10,000',
            second: '₹5,000',
            third: '₹3,000',
        },
        coordinators: {
            student: ['Shreya Kad – 7517021872'],
            faculty: ['Wrushabh Sirsat – 9325792405'],
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/code-ladder.pdf`,
    },

    'blind-code': {
        slug: 'blind-code',
        name: 'Blind Coding',
        tagline: 'Code Without Seeing',
        description:
            'A unique programming challenge where participants must write code without executing it or viewing any output during development. It tests syntax accuracy, logic clarity, and coding confidence.',
        teamSize: 'Individual participation',
        fee: '₹200',
        duration: '60 minutes',
        category: 'standard',
        rules: [
            'No compilation or execution is allowed during the coding phase.',
            'Internet access, mobile phones, and external help are strictly prohibited.',
            'Code will be compiled and executed by judges after time ends.',
            'Participants will be disqualified for running code before the allowed time.',
            'Participants will be disqualified for plagiarism, using unfair means, or misbehavior.',
            'Participants must use the provided IDE/editor.',
            'Allowed Languages: C, C++, Java, or Python.',
        ],
        procedure: [
            'Participants are given 1–2 programming problems.',
            'They must write complete code without executing it.',
            'After submission, judges compile and run the code.',
            'Evaluation is based on execution results and correctness.',
        ],
        judgingCriteria: [
            'Correctness of output after execution',
            'Number of test cases passed',
            'Code accuracy (syntax errors reduce scores)',
            'Completeness of the logical approach',
            'Full marks for correct solution; partial marking for logical correctness despite minor errors; zero marks for compilation errors',
        ],
        prizes: {
            first: '₹3,000',
            second: '₹2,000',
            third: '₹1,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/blind-coding.pdf`,
    },

    'dev-clash': {
        slug: 'dev-clash',
        name: 'DevClash',
        tagline: 'AI Hackathon & Pitching',
        description:
            'An innovation-based technical event where participants develop Artificial Intelligence solutions for real-world problems. Teams design, build, and present their ideas in front of judges, focusing on creativity, feasibility, and practical implementation.',
        teamSize: '3–5 members',
        fee: '₹250',
        duration: '6 hours',
        category: 'standard',
        rules: [
            'Each participant can be part of only one team.',
            'The registration fee is non-refundable.',
            'All team members must be present in the allocated area during the event.',
            'All work must be created during the hackathon.',
            'Teams must present their solution in the form of a prototype.',
            'Projects must align with the given hackathon themes or problem statements.',
            'Problem statements will be given on the spot.',
            'The use of pre-existing code or projects is not allowed, except for open-source libraries or frameworks.',
            'All code developed must be original work of the team.',
            'Cross-team collaboration is not allowed.',
            'Submission must include project description, source code, presentation, and Git repository link (mandatory).',
            'Late submissions may result in penalties or disqualification.',
            'Each team must present their project to the judging panel.',
            'Any form of cheating or plagiarism will result in immediate disqualification.',
            'Teams must share their projects publicly after the hackathon (e.g., GitHub).',
        ],
        procedure: [
            'Teams are formed and briefed.',
            'Problem statement/theme is given.',
            'Teams brainstorm and finalize their idea.',
            'They build a working prototype (idea, features, approach).',
            'Prepare a pitch deck/presentation.',
            'The final presentation is delivered to judges.',
        ],
        judgingCriteria: [
            'Innovation & originality',
            'Feasibility of idea',
            'Presentation skills',
            'Problem-solving approach',
            'Business model clarity',
        ],
        prizes: {
            first: '₹20,000',
            second: '₹15,000',
            third: '₹10,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/devclash.pdf`,
    },

    'vibe-sprint': {
        slug: 'vibe-sprint',
        name: 'Vibe Coding',
        tagline: 'Express Your Vibe',
        description:
            'A fusion of creativity and speed. Express your coding style and approach in a unique, time-pressured challenge where vibe and velocity collide.',
        teamSize: 'Solo participation',
        fee: '₹100',
        category: 'standard',
        rules: [
            'Solo participation only.',
            'All code must be written during the event window.',
            'Pre-built code or templates are not permitted.',
            'Participants must use the provided development environment.',
            'Plagiarism or copying will result in instant disqualification.',
        ],
        procedure: [
            'Problem statement is revealed at the start.',
            'Participants code their solution within the time limit.',
            'Submissions are evaluated by the judging panel.',
        ],
        judgingCriteria: [
            'Creativity and originality',
            'Code quality and efficiency',
            'Functionality and completeness',
            'Presentation',
        ],
        prizes: {
            first: '₹3,000',
            second: '₹2,000',
            third: '₹1,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/vibe-coding.pdf`,
    },

    'forge-x': {
        slug: 'forge-x',
        name: 'ForgeX',
        tagline: 'Build Fast. Build Smart.',
        description:
            'A multi-round programming and development competition focused on building fully functional applications within a strict 90-minute time limit. Emphasizes practical implementation, rapid execution, and problem-solving in a progressive elimination format.',
        teamSize: '1 or 2 participants',
        fee: '₹99 per participant/team',
        duration: '90 minutes per round',
        category: 'standard',
        rules: [
            'Submission must include complete project folder, source files, and a README.',
            'Open tech stack — any tools and languages may be used.',
            'AI is permitted for code generation and debugging, but submissions must be fully functional and understood by participants.',
            'Solo or duo teams only — no external collaboration.',
            'Strictly 90 minutes per round.',
            'Late submission, plagiarism, or external collaboration results in immediate DISQUALIFICATION.',
            'Missing README or poor documentation results in minor penalties and score deductions.',
        ],
        procedure: [
            'Round 1: "Open Build" — participants use their own idea or a provided problem statement.',
            'Round 2: "Theme-Based Final" — a common theme is revealed at the start.',
            'The 90-minute timer starts immediately upon announcement.',
            'Participants must interpret the requirement, design a solution, and deliver a working project.',
            'No extensions granted.',
        ],
        judgingCriteria: [
            'Functionality: 40 marks',
            'Code Quality: 20 marks',
            'Creativity & Innovation: 25 marks',
            'Time Management: 15 marks',
            'Tie-breaker: Higher Functionality score, then higher Creativity score',
        ],
        prizes: {
            first: '₹4,000',
            second: '₹3,000',
            third: '₹2,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/forgex.pdf`,
    },

    'bridge-nova': {
        slug: 'bridge-nova',
        name: 'Bridge Nova',
        tagline: 'Engineer. Construct. Endure.',
        description:
            'A technical and creative event where participants design and construct bridge models using given materials. The objective is to test structural strength, design efficiency, and innovation while ensuring the bridge can withstand maximum load.',
        teamSize: '2–4 members',
        fee: '₹200',
        category: 'standard',
        rules: [
            'Participants must form teams of 2 to 4 members.',
            'Each participant can be part of only one team.',
            'The registration fee is non-refundable.',
            'All team members must be present during the event.',
            'Participants must construct the bridge within the given time.',
            'Only provided materials should be used for construction.',
            'Pre-built models are strictly not allowed.',
            'Bridge dimensions must follow specified constraints.',
            'The bridge must be self-supporting.',
            'Any damage or rule violation may lead to disqualification.',
            'Participants must follow safety guidelines during construction.',
        ],
        procedure: [
            'Teams are briefed about the rules and materials.',
            'Design planning phase is conducted.',
            'Construction of the bridge begins.',
            'Final bridge models are evaluated.',
            'Load testing is performed to determine strength.',
            'Results are declared based on performance.',
        ],
        judgingCriteria: [
            'Strength of the bridge',
            'Design efficiency',
            'Load bearing capacity',
            'Innovation and creativity',
            'Material optimization',
        ],
        prizes: {
            first: '₹12,000',
            second: '₹8,000',
            third: '₹5,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/bridge-nova.pdf`,
    },

    'code-relay': {
        slug: 'code-relay',
        name: 'Code Relay Race',
        tagline: 'Relay. Code. Conquer.',
        description:
            'A team-based technical game where participants solve a coding problem in a relay format. Each team member contributes by writing a part of the code within a limited time. The next member continues the code from where the previous one stopped.',
        teamSize: '5 members per team',
        fee: '₹250',
        category: 'standard',
        rules: [
            'Each team member writes a portion of the code in sequence.',
            'Time limits are strictly enforced for each relay leg.',
            'No verbal or written communication between members during their turns.',
            'Only one member can code at a time.',
            'All code must be original and written during the event.',
        ],
        procedure: [
            'A coding problem is provided to the team.',
            'Each member gets a fixed time slot to write their portion.',
            'The next member continues from where the previous one stopped.',
            'The team must complete the program correctly within the total time.',
            'Final code is evaluated for correctness and completeness.',
        ],
        judgingCriteria: [
            'Correctness of output',
            'Completion of code',
            'Logical approach',
            'Team coordination',
        ],
        prizes: {
            first: '₹15,000',
            second: '₹10,000',
            third: '₹8,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/code-relay.pdf`,
    },

    'poster-presentation': {
        slug: 'poster-presentation',
        name: 'Poster Presentation',
        tagline: 'Visualize Your Research',
        description:
            'Present your research and findings through high-impact visual posters. A research showcase where creativity meets technical accuracy.',
        teamSize: '1 or 2 participants',
        fee: '₹100 per group',
        category: 'general',
        rules: [
            'Participants must be present during evaluation for explanation.',
            'Posters should be original and not copied.',
            'College ID card is compulsory during the event.',
            'The decision of judges will be final and binding.',
            'Posters must be prepared on A2 or A3 size paper.',
        ],
        procedure: [
            'Prepare poster on A2 or A3 size paper.',
            'Include: Student Name(s), College Name, Topic Title, Introduction, Main Content, Conclusion, References.',
            'Present and explain your poster to the judging panel.',
            'Judges evaluate based on criteria.',
        ],
        judgingCriteria: [
            'Relevance to the topic',
            'Creativity and presentation',
            'Clarity of explanation',
            'Technical/content accuracy',
            'Overall impact',
        ],
        prizes: {
            first: '₹3,000',
            second: '₹2,000',
            third: '₹1,000',
        },
        coordinators: {
            student: ['Ashish Shinde – 9373113736'],
            faculty: ['Prof. Jay Gurav – 9420696534', 'Prof. Snehal Dharme – 8390736438'],
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/poster-presentation.pdf`,
    },

    'spark-tank': {
        slug: 'spark-tank',
        name: 'Spark Tank',
        tagline: 'Pitch Your Innovation',
        description:
            'Pitch your innovative electronics-based products to a panel of expert "sharks". A competition to develop entrepreneurial thinking, teamwork, and presentation skills.',
        teamSize: '1–4 participants',
        fee: '₹200 per group',
        category: 'general',
        rules: [
            'Participants must be present during the evaluation for explanation.',
            'The PPT should be original and not copied.',
            'College ID card is compulsory during the event.',
            'The decision of the judges will be final and binding.',
        ],
        procedure: [
            'Prepare a pitch presentation with the following mandatory sections:',
            '1. Title Page',
            '2. Idea',
            '3. Technical Approach',
            '4. Feasibility and Viability',
            '5. Impact and Benefits',
            'Present to the judging panel.',
        ],
        judgingCriteria: [
            'Relevance to the topic',
            'Creativity and presentation',
            'Clarity of explanation',
            'Technical/content accuracy',
            'Overall impact',
        ],
        prizes: {
            first: '₹3,000',
            second: '₹2,000',
            third: '₹1,000',
        },
        coordinators: {
            student: ['Shubham Jagtap – 9172125455'],
            faculty: ['Prof. D.N Deode – 8770423757', 'Prof. Narendra Neginhal – 9970006341'],
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/spark-tank.pdf`,
    },

    'matlab-madness': {
        slug: 'matlab-madness',
        name: 'MATLAB Madness',
        tagline: 'Simulate. Compute. Dominate.',
        description:
            'A multi-round MATLAB competition testing participants on MCQ-based theory, problem-solving, and circuit simulation using PROTEUS. Solve complex engineering problems using the power of MATLAB and Simulink.',
        teamSize: '1–2 members',
        fee: '₹149',
        category: 'standard',
        rules: [
            'Participants must use only MATLAB software for the competition.',
            'No external software is allowed.',
            'The use of external storage devices (USBs) is prohibited.',
            'Participants are not allowed to use pre-written code.',
            'Internet access is restricted unless specifically permitted.',
            'Communication between participants during rounds is prohibited.',
            'Mobile phones are not allowed unless permission is granted.',
            'All code must be written entirely during the competition period.',
            'Plagiarism or copying code will lead to immediate disqualification.',
        ],
        procedure: [
            'Elimination Round: 30 minutes, 20 MCQs.',
            'Major Round: 60 minutes, 10 problem statements to solve.',
            'For Circuit Simulation track: Round 1 is a 30-minute MCQ session on theory and circuit identification.',
            'Circuit Simulation Round 2: 60-minute session building circuits using PROTEUS.',
        ],
        judgingCriteria: [
            'Maximum number of problem statements solved',
            'Accuracy of solutions',
            'Time taken as tie-breaker',
        ],
        prizes: {
            first: '₹5,000',
            second: '₹3,000',
            third: '₹2,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/matlab-madness.pdf`,
    },

    'contraptions-challenge': {
        slug: 'contraptions-challenge',
        name: 'Contraptions Challenge',
        tagline: 'Energy Conversion – Hit & Drop',
        description:
            'Design and build intricate chain-reaction systems of energy conversion. Create complex sequences to perform simple tasks — a bottle hit and drop — with maximum precision, innovation, and robustness.',
        teamSize: 'Exactly 4 participants',
        fee: '₹150',
        category: 'standard',
        rules: [
            'System must include at least 3 energy conversions.',
            'Each step must automatically trigger the next.',
            'No manual interference between steps.',
            'Maximum of 3 human interventions allowed.',
            'Bottle must be hit using mechanism — no hand interaction.',
            'Bottle must drop at least 1 foot (≈30 cm).',
            'No sharing of materials between teams.',
            'Use of waste materials is encouraged.',
            'Design must be safe and stable.',
        ],
        procedure: [
            'Initial trigger starts the chain reaction.',
            'Energy conversion steps execute sequentially.',
            'Bottle is hit and displaced by the mechanism.',
            'Final drop must occur at the required distance.',
            'Arena size: 2m × 4m. Time limit: 15 minutes. Max 3 trials.',
        ],
        judgingCriteria: [
            'Number of steps',
            'Energy conversions used',
            'Innovation',
            'Execution smoothness',
            'Robustness',
            'Successful hit and drop (mandatory)',
        ],
        prizes: {
            first: '₹5,000',
            second: '₹3,000',
            third: '₹2,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/contraptions.pdf`,
    },

    // ── Circle Cricket (Ghost — no card yet) ──

    'circle-cricket': {
        slug: 'circle-cricket',
        name: 'Circle Cricket',
        tagline: 'A Spin on the Classic',
        description:
            'A fast-paced, entertaining variation of traditional cricket where players stand in a circular formation, creating a dynamic and unpredictable game. The batting team aims to score runs by hitting the ball into designated score circles.',
        teamSize: '4 players per team',
        fee: '₹200 per team',
        category: 'general',
        rules: [
            'Participants must maintain fair play and sportsmanship.',
            `Arguments with organizers or the umpire are not allowed — umpire's decision is final.`,
            'Teams or players can be disqualified for misconduct, abusive behavior, cheating, or dangerous play.',
            'Organizers hold the final authority in disputes and reserve the right to modify rules.',
            'Only underarm bowling is permitted. Fast or dangerous bowling results in 2 bonus runs.',
            'Each bowler is limited to one over.',
            'Fielders may not enter restricted circles; doing so awards the batter 1 bonus run.',
        ],
        procedure: [
            'The fielding team stands in a circle with one batter at the center.',
            'A bowler is selected from the fielding team.',
            'Each team is allotted one innings consisting of 4 overs.',
            'Roles are rotated after the innings.',
            'Batter is out if they miss the ball, ball is caught after one bump, or first bump is beyond third circle.',
        ],
        judgingCriteria: [
            'Team with the highest runs at the end wins.',
            'Scoring: Inside 1st circle = 4 runs, Between 1st & 2nd = 2 runs, Between 2nd & 3rd = 1 run, After 3rd circle = 6 runs.',
        ],
        prizes: {
            first: '₹3,000',
            second: '₹2,000',
            third: '₹1,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/circle-cricket.pdf`,
    },

    // ── Esports (Battle Grid sub-events) ──

    'freefire': {
        slug: 'freefire',
        name: 'Free Fire',
        tagline: 'Battle Royale Showdown',
        description:
            'A team-based Free Fire mobile tournament where squads compete across multiple maps in a battle royale format.',
        teamSize: '4 members per team',
        fee: '₹250 per group',
        category: 'flagship',
        rules: [
            'All group members must be present at or before the given time slot.',
            'BGMI: 4 Active Players + 1 Mandatory Substitute (4+1).',
            'SQUAD ONLY: 4 Member Squads required for Free Fire.',
            'Original AVR-IDs are mandatory for match entry validation.',
            'One leader can register only one squadron per game portal.',
            'Strict Zero-Tolerance policy for third-party hacks or scripts.',
            'No Emulators/PC players. Pure Mobile/Tablet gameplay only.',
            'Illegal teaming results in immediate squad ban.',
            'College ID card is compulsory during the tournament.',
            'Respectful coordination towards management and coordinators.',
        ],
        procedure: [
            'Lobby IDs shared via Discord 15 minutes before the drop-time.',
            'Match timing is absolute; laggards will not be waited for.',
            'Each group will play three matches on three maps: Bermuda, Purgatory, Kalahari.',
            'Points calculation follows the standard point system (Combat Kills + Tactical Placement).',
            'Lobbies will NOT be restarted for individual disconnects.',
        ],
        judgingCriteria: [
            'Standard point system scoring across all three matches.',
        ],
        prizes: {
            first: '₹5,000',
            second: '₹3,000',
            third: '₹2,000',
        },
        coordinators: {
            student: ['Rohit Chavan – 7823056055'],
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/free-fire.pdf`,
        rulebookComingSoon: false
    },



    'sf4': {
        slug: 'sf4',
        name: 'Shadow Fight 4',
        tagline: '1v1 Combat Arena',
        description:
            `An E-Sports mobile gaming event testing players' combat skills, strategy, and reflexes in competitive 1v1 Shadow Fight 4 matches.`,
        teamSize: 'Individual (1 player)',
        fee: '₹150 per participant',
        category: 'flagship',
        rules: [
            'Strictly Solo entry format.',
            'Original AVR-IDs are mandatory for match entry validation.',
            'Each participant must have their own mobile device.',
            'Game must be updated to the latest version.',
            'Strict Zero-Tolerance policy for third-party hacks or mods.',
            'Players must join the match on time — delays may result in forfeiture.',
            'Fair play and sportsmanship are mandatory.',
        ],
        procedure: [
            'Brackets/Group progression layout.',
            'Knockout/elimination format.',
            'Winners advance to next round until the final match.',
            'Grid Marshall\'s (Admin) decision is final and binding.',
        ],
        judgingCriteria: [
            'Winning based on match progression and elimination results.',
        ],
        prizes: {
            first: '₹5,000',
            second: '₹3,000',
        },
        coordinators: {
            student: ['Pranav Kulkarni – 9423162724'],
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/shadow-fight-4.pdf`,
        rulebookComingSoon: false
    },

    // ── Robotics (Robo-Kshetra sub-events) ──


    'circuit-simulation': {
        slug: 'circuit-simulation',
        name: 'Circuit Simulation',
        tagline: 'Virtual Electronics',
        description: 'Design and simulate intricate electronic circuits flawlessly. Test your understanding of circuit theory, component behavior, and virtual prototyping.',
        teamSize: '1–2 members',
        fee: '₹149',
        category: 'standard',
        rules: [
            'Participants must use only official simulation software provided.',
            'No external storage devices or pre-written circuits allowed.',
            'Internet access is strictly prohibited during the simulation.',
            'All designs must be original and built from scratch.',
        ],
        procedure: [
            'Round 1: Theoretical MCQ on Circuit Identification.',
            'Round 2: Practical Circuit Building and Troubleshooting.',
        ],
        judgingCriteria: [
            'Circuit accuracy and functionality',
            'Time taken for simulation',
            'Optimal component usage',
        ],
        prizes: {
            first: '₹5,000',
            second: '₹3,000',
        },
    },

    'paper-presentation': {
        slug: 'paper-presentation',
        name: 'Paper Presentation',
        tagline: 'Technical Research Showcase',
        description: 'Showcase your groundbreaking research and technical insights to a panel of expert judges. A premier platform for academic excellence and innovation.',
        teamSize: '1–2 members',
        fee: '₹200',
        category: 'general',
        rules: [
            'Papers must be original and not published elsewhere.',
            'Presentation duration is limited to 10 minutes (8 min talk + 2 min Q&A).',
            'Soft copy must be submitted in PDF format before the deadline.',
            'College ID is mandatory for participation.',
        ],
        procedure: [
            'Submission of full paper/abstract.',
            'Shortlisting of papers for final presentation.',
            'Live presentation before the judging panel.',
        ],
        judgingCriteria: [
            'Technical depth and research quality',
            'Clarity and structure of presentation',
            'Ability to answer Q&A',
            'Innovation and impact',
        ],
        prizes: {
            first: '₹5,000',
            second: '₹3,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/paper-presentation.pdf`,
        rulebookComingSoon: false
    },

    'project-competition': {
        slug: 'project-competition',
        name: 'Project Competition',
        tagline: 'Innovation & Prototype Exhibition',
        description: 'Demonstrate your engineering prowess by exhibiting your innovative hardware or software prototypes. From concept to reality, show us the future.',
        teamSize: '1–4 members',
        fee: '₹200',
        category: 'general',
        rules: [
            'Prototypes must be functional and demonstratable.',
            'All materials and components must be arranged by the team.',
            'Safety protocols must be followed for hardware displays.',
            'Projects must be the original work of the participants.',
        ],
        procedure: [
            'Setup of project stall/booth.',
            'Demonstration to visitors and judges.',
            'Final evaluation by the technical committee.',
        ],
        judgingCriteria: [
            'Working prototype efficiency',
            'Social or technical impact',
            'Innovation and scalability',
            'Cost-effectiveness',
        ],
        prizes: {
            first: '₹6,000',
            second: '₹4,000',
        },
        rulebookPath: `${import.meta.env.BASE_URL}assets/rule-books/project-presentation.pdf`,
        rulebookComingSoon: false
    },
};

// Helper to get all competitions as an array, sorted by category
export const getAllRules = (): CompetitionRules[] => {
    const order: Record<string, number> = {
        flagship: 0,
        standard: 1,
        general: 2,
    };
    return Object.values(RULES_DATA).sort(
        (a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99)
    );
};
