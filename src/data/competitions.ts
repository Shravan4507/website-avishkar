export interface Competition {
    id: string;
    code: string;
    title: string;
    subtitle: string;
    description: string;
    category: "FLG" | "BTG" | "GEN" | "DEP";
    department: string;
    year: number;
    image: string;
    banner?: string;
    gradient: string;
    borderColor: string;
    schedule: {
        date: string;
        startTime: string;
        endTime: string;
        round?: string;
    }[];
    venue: string;
    rounds?: number;
    registrationStart: string;
    registrationEnd: string;
    isRegistrationOpen: boolean;
    maxParticipants?: number;
    entryFee?: number;
    paymentRequired: boolean;
    minTeamSize: number;
    maxTeamSize: number;
    teamRequired: boolean;
    coordinators: {
        name: string;
        phone: string;
    }[];
    rulebook?: string;
    rulebookComingSoon?: boolean;
    status: "draft" | "published" | "live" | "completed";
    tags?: string[];
    slug?: string;
    handle?: string;
    isFlagship?: boolean;
    comingSoon?: boolean;
    prizePool?: string;
    isExhibition?: boolean;
    date?: string;
    url?: string;
    location?: string;
}

export const COMPETITIONS_DATA: Competition[] = [
    {
        id: 'CMP-26-FLG-PRX-001',
        code: 'PRX',
        title: "Param-X '26",
        subtitle: '10-Hour Hackathon',
        description: 'The premier hackathon of Avishkar. 10 hours of pure product development, intense coding, and transformative innovation. Build the future and claim the throne.',
        category: 'FLG',
        department: 'Flagship',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/paramx.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-20',
                startTime: '09:00',
                endTime: '19:00',
                round: 'Final Hack'
            }
        ],
        venue: 'Main Lab Complex',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 0,
        paymentRequired: false,
        minTeamSize: 2,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/param-x.pdf`,
        rulebookComingSoon: false,
        status: "published",
        isFlagship: true,
        slug: 'param-x-26',
        handle: 'ParamX-Hack',
        prizePool: '₹1,00,000+'
    },
    {
        id: 'CMP-26-FLG-ROBO-MAIN',
        code: 'RBO-MAIN',
        title: "Robo-Kshetra '26",
        subtitle: 'Robo War',
        description: 'Witness high-octane robotic combat. Design, build, and optimize your machines to survive the definitive battlefield of metal and electronics.',
        category: 'FLG',
        department: 'Flagship',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/robokshetra.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [{ date: '2026-04-21', startTime: '10:00', endTime: '18:00' }],
        venue: 'Robo Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        paymentRequired: false,
        minTeamSize: 2,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [{ name: "TBA", phone: "" }],
        status: "published",
        isFlagship: true,
        slug: 'robotron-26',
        handle: 'Robo-Kshetra',
        prizePool: '₹1,00,000+',
        url: '#'
    },
    {
        id: 'CMP-26-FLG-BAT-MAIN',
        code: 'BAT-MAIN',
        title: "Battle Grid '26",
        subtitle: 'E-Sports Arena',
        description: 'The ultimate tactical arena battle. A high-stakes competition where only one elite team will emerge as the absolute champion of the grid.',
        category: 'FLG',
        department: 'Flagship',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.webp`,
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        borderColor: '#ff4655',
        schedule: [{ date: '2026-04-22', startTime: '09:00', endTime: '20:00' }],
        venue: 'E-Sports Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        paymentRequired: false,
        minTeamSize: 4,
        maxTeamSize: 5,
        teamRequired: true,
        coordinators: [{ name: "TBA", phone: "" }],
        status: "published",
        isFlagship: true,
        slug: 'battle-grid-26',
        handle: 'Battle-Grid',
        prizePool: '₹80,000+',
        url: '#'
    },
    {
        id: 'CMP-26-FLG-ALX-002',
        code: 'ALX',
        title: "AlignX",
        subtitle: 'Robo War - Alignment',
        description: 'Witness high-octane robotic combat. Design, build, and optimize your machines to survive the definitive battlefield of metal and electronics.',
        category: 'FLG',
        department: 'Flagship',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/robokshetra.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '10:00',
                endTime: '13:00',
                round: 'Qualifiers'
            },
            {
                date: '2026-04-21',
                startTime: '14:30',
                endTime: '17:30',
                round: 'Finals'
            }
        ],
        venue: 'Robo Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 1200,
        paymentRequired: true,
        minTeamSize: 2,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Robo-Kshetra',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-FLG-RBR-003',
        code: 'RBR',
        title: "RoboRush",
        subtitle: 'Robo Race',
        description: 'Speed, agility, and control. Navigate your bot through complex obstacles in the ultimate race against time.',
        category: 'FLG',
        department: 'Flagship',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/robokshetra.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '11:00',
                endTime: '16:00',
                round: 'Timed Trials'
            }
        ],
        venue: 'Robo Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 600,
        paymentRequired: true,
        minTeamSize: 2,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Robo-Kshetra',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-FLG-RBM-004',
        code: 'RBM',
        title: "RoboMaze",
        subtitle: 'Maze Solver',
        description: 'Intelligence meets engineering. Can your robot find the exit before the others?',
        category: 'FLG',
        department: 'Flagship',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/robokshetra.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '09:00',
                endTime: '12:00',
                round: 'Exploration Round'
            }
        ],
        venue: 'Robo Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 800,
        paymentRequired: true,
        minTeamSize: 2,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Robo-Kshetra',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-BTG-BGMI-001',
        code: 'BGMI',
        title: "BGMI",
        subtitle: 'Battlegrounds Mobile India',
        description: 'The ultimate tactical arena battle. A high-stakes competition where only one elite team will emerge as the absolute champion.',
        category: 'BTG',
        department: 'Battle Grid',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.webp`,
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        borderColor: '#ff4655',
        schedule: [
            {
                date: '2026-04-22',
                startTime: '10:00',
                endTime: '18:00',
                round: 'Tournament Bracket'
            }
        ],
        venue: 'E-Sports Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 0,
        paymentRequired: true,
        minTeamSize: 4,
        maxTeamSize: 5,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Battle-Grid',
        status: "published",
        isExhibition: true,
        prizePool: 'TBD'
    },
    {
        id: 'CMP-26-BTG-FF-002',
        code: 'FF',
        title: "Free Fire",
        subtitle: 'Squad Combat',
        description: 'Survive till the end in the fast-paced world of Free Fire.',
        category: 'BTG',
        department: 'Battle Grid',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.webp`,
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        borderColor: '#ff4655',
        schedule: [
            {
                date: '2026-04-22',
                startTime: '11:00',
                endTime: '15:00',
                round: 'Survivor Round'
            }
        ],
        venue: 'E-Sports Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 250,
        paymentRequired: true,
        minTeamSize: 4,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Battle-Grid',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-BTG-CODM-003',
        code: 'CODM',
        title: "CODM",
        subtitle: 'Call of Duty Mobile',
        description: 'Strategic military combat in the mobile arena.',
        category: 'BTG',
        department: 'Battle Grid',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.webp`,
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        borderColor: '#ff4655',
        schedule: [
            {
                date: '2026-04-22',
                startTime: '14:00',
                endTime: '19:00',
                round: 'Multiplayer Duel'
            }
        ],
        venue: 'E-Sports Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 300,
        paymentRequired: true,
        minTeamSize: 4,
        maxTeamSize: 5,
        teamRequired: true,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Battle-Grid',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-BTG-SF4-004',
        code: 'SF4',
        title: "Shadow Fight 4",
        subtitle: 'The Duel',
        description: 'Enter the world of shadows and prove your mastery in combat.',
        category: 'BTG',
        department: 'Battle Grid',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.webp`,
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        borderColor: '#ff4655',
        schedule: [
            {
                date: '2026-04-22',
                startTime: '12:00',
                endTime: '16:00',
                round: 'Shadow Duels'
            }
        ],
        venue: 'E-Sports Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 150,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 1,
        teamRequired: false,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Battle-Grid',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-BTG-AUS-005',
        code: 'AUS',
        title: "Among Us",
        subtitle: 'Social Deduction',
        description: 'Find the imposter before they eliminate the entire crew.',
        category: 'BTG',
        department: 'Battle Grid',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.webp`,
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        borderColor: '#ff4655',
        schedule: [
            {
                date: '2026-04-22',
                startTime: '10:00',
                endTime: '13:00',
                round: 'Ship Investigation'
            }
        ],
        venue: 'E-Sports Arena',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 100,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 1,
        teamRequired: false,
        coordinators: [
            { name: "TBA", phone: "" }
        ],
        handle: 'Battle-Grid',
        status: "published",
        isExhibition: true
    },
    {
        id: 'CMP-26-CS-FGX-001',
        code: 'FGX',
        title: 'Forge-X',
        subtitle: 'Build Fast. Build Smart.',
        description: "A multi-round programming and development competition focused on building fully functional applications within a strict 90-minute time limit.",
        category: 'DEP',
        department: 'Computer Engineering',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/forgex.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '09:30',
                endTime: '12:30',
                round: 'Sprint 1'
            }
        ],
        venue: 'Computer Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 99,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 2,
        teamRequired: false,
        coordinators: [
            { name: "Chetan Badgujar", phone: "8530052369" }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/forgex.pdf`,
        handle: 'Forge-Lead',
        status: "published"
    },
    {
        id: 'CMP-26-CS-ALB-002',
        code: 'ALB',
        title: 'AlgoBid',
        subtitle: 'Bid Smart. Code Faster.',
        description: 'A high-energy, strategy-driven competitive programming event combining live auctions with algorithmic problem-solving.',
        category: 'DEP',
        department: 'Computer Engineering',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/algobid.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '13:00',
                endTime: '17:00',
                round: 'Auction & Solve'
            }
        ],
        venue: 'Computer Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 99,
        paymentRequired: true,
        minTeamSize: 3,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'Tejprakash Mirashi', phone: '7378965050' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/algobid.pdf`,
        handle: 'Algo-Master',
        status: "published"
    },
    {
        id: 'CMP-26-IT-CDL-003',
        code: 'CDL',
        title: 'Code Ladder',
        subtitle: 'Climb the Logic Ladder',
        description: 'An innovative physical event simulating programming concepts through an interactive, game-based environment with increasing difficulty.',
        category: 'DEP',
        department: 'Information Technology',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/codeladder.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '10:00',
                endTime: '15:00',
                round: 'Level Up Challenge'
            }
        ],
        venue: 'IT Dept Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 250,
        paymentRequired: true,
        minTeamSize: 4,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'Shreya Kad', phone: '7517021872' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/code-ladder.pdf`,
        handle: 'Code-Climber',
        status: "published"
    },
    {
        id: 'CMP-26-AD-IPL-004',
        code: 'IPL',
        title: 'IPL Auction',
        subtitle: 'Strategic Bidding',
        description: "Experience the adrenaline of the player auction in this high-stakes cricket simulation.",
        category: 'DEP',
        department: 'AI&DS',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/iplauction.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '09:00',
                endTime: '18:00',
                round: 'Main Auction'
            }
        ],
        venue: 'Main Auditorium',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 400,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 5,
        teamRequired: true,
        coordinators: [
            { name: "Dhanraj Funde", phone: "9370304023" }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/ipl-auction.pdf`,
        handle: 'IPL-Auctioneer',
        status: "published"
    },
    {
        id: 'CMP-26-EC-BCC-005',
        code: 'BCC',
        title: 'Blind Code Challenge',
        subtitle: 'Unseen Logic',
        description: 'A blind code presents hidden challenges that test logical thinking and coding skills. Participants write code manually without a compiler.',
        category: 'DEP',
        department: 'ECE',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/blindcode.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '10:00',
                endTime: '12:00',
                round: 'Blind Run'
            }
        ],
        venue: 'ECE Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 200,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 1,
        teamRequired: false,
        coordinators: [
            { name: 'Shivani Shinde', phone: '9011214573' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/blind-coding.pdf`,
        handle: 'Blind-Coder',
        status: "published"
    },
    {
        id: 'CMP-26-AM-DVC-006',
        code: 'DVC',
        title: 'DevClash',
        subtitle: 'AI Hackathon & Pitching',
        description: 'An innovation-based technical event where teams develop AI solutions for real-world problems.',
        category: 'DEP',
        department: 'AI&ML',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/devclash.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '09:00',
                endTime: '17:00',
                round: 'Development Phase'
            }
        ],
        venue: 'AI&ML Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 250,
        paymentRequired: true,
        minTeamSize: 3,
        maxTeamSize: 5,
        teamRequired: true,
        coordinators: [
            { name: 'Varad Gaurav', phone: '7887323956' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/devclash.pdf`,
        handle: 'Dev-Striker',
        status: "published"
    },
    {
        id: 'CMP-26-AM-VSP-007',
        code: 'VSP',
        title: 'Vibe Sprint',
        subtitle: 'Creative Dash',
        description: 'A fusion of creativity and speed. Express your vibe and claim the stage.',
        category: 'DEP',
        department: 'AI&ML',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/vibesprint.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '12:00',
                endTime: '15:00',
                round: 'Vibe Check'
            }
        ],
        venue: 'AI&ML Hall',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 100,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 1,
        teamRequired: false,
        coordinators: [
            { name: 'Manish Saindane', phone: '8010550280' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/vibe-coding.pdf`,
        handle: 'Vibe-Lead',
        status: "published"
    },
    {
        id: 'CMP-26-AM-CRR-008',
        code: 'CRR',
        title: 'Code Relay Race',
        subtitle: 'Relay. Code. Conquer.',
        description: 'A team-based relay coding challenge where each member writes a part of the code.',
        category: 'DEP',
        department: 'AI&ML',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/coderun.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '15:00',
                endTime: '18:00',
                round: 'Relay Sprint'
            }
        ],
        venue: 'AI&ML Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 250,
        paymentRequired: true,
        minTeamSize: 5,
        maxTeamSize: 5,
        teamRequired: true,
        coordinators: [
            { name: 'Parth Shinde', phone: '9168906630' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/code-relay.pdf`,
        handle: 'Relay-Coder',
        status: "published"
    },
    {
        id: 'CMP-26-CE-BRN-009',
        code: 'BRN',
        title: 'Bridge Nova',
        subtitle: 'Engineer. Construct. Endure.',
        description: 'A technical and creative event where participants design and construct bridge models.',
        category: 'DEP',
        department: 'Civil Engineering',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/bridgenova.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '10:00',
                endTime: '16:00',
                round: 'Construction & Load Test'
            }
        ],
        venue: 'Civil Dept',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 150,
        paymentRequired: true,
        minTeamSize: 2,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'Ashish Shinde', phone: '9373113736' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/bridge-nova.pdf`,
        handle: 'Arch-Nova',
        status: "published"
    },
    {
        id: 'CMP-26-EE-PPT-010',
        code: 'PPT',
        title: 'Poster Presentation',
        subtitle: 'Research Showcase',
        description: 'Present your research and findings through high-impact visual posters.',
        category: 'DEP',
        department: 'Electrical',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/poster.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '11:00',
                endTime: '14:00',
                round: 'Exhibition'
            }
        ],
        venue: 'Electrical Dept',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 100,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 2,
        teamRequired: false,
        coordinators: [
            { name: 'Pranav Katu', phone: '9503231138' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/poster-presentation.pdf`,
        handle: 'Paper-Lead',
        status: "published"
    },
    {
        id: 'CMP-26-EE-SPT-011',
        code: 'SPT',
        title: 'Spark Tank',
        subtitle: 'Pitch Your Innovation',
        description: 'Pitch your innovative electronics-based products to a panel of expert "sharks".',
        category: 'DEP',
        department: 'Electrical',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/sparktank.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '14:00',
                endTime: '17:00',
                round: 'The Pitch'
            }
        ],
        venue: 'Electrical Hall',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 200,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'Harshita Jadhav', phone: '9356766305' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/spark-tank.pdf`,
        handle: 'Spark-Lead',
        status: "published"
    },
    {
        id: 'CMP-26-EC-MTM-012',
        code: 'MTM',
        title: 'Matlab Madness',
        subtitle: 'Mathematical Computing',
        description: 'Solve complex engineering problems using the power of Matlab and Simulink.',
        category: 'DEP',
        department: 'E&TC',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/matlab.webp`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '10:00',
                endTime: '13:00',
                round: 'Simulation Round'
            }
        ],
        venue: 'E&TC Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 149,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 2,
        teamRequired: false,
        coordinators: [
            { name: 'Pranav Achrekar', phone: '7058481186' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/matlab-madness.pdf`,
        handle: 'Mat-Master',
        status: "published"
    },
    {
        id: 'CMP-26-EC-CTS-013',
        code: 'CTS',
        title: 'Circuit Simulation',
        subtitle: 'Virtual Electronics',
        description: 'Design and simulate intricate electronic circuits flawlessly.',
        category: 'DEP',
        department: 'E&TC',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/circuitsim.webp`,
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        borderColor: '#d9ff00',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '14:00',
                endTime: '17:00',
                round: 'Design Round'
            }
        ],
        venue: 'E&TC Labs',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 149,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 2,
        teamRequired: false,
        coordinators: [
            { name: 'Saniya Jadhav', phone: '9699281400' }
        ],
        handle: 'Circuit-Ninja',
        status: "published"
    },
    {
        id: 'CMP-26-ME-CTC-014',
        code: 'CTC',
        title: 'Contraptions Challenge',
        subtitle: 'Energy Conversion',
        description: 'Design and build intricate chain-reaction systems of energy conversion.',
        category: 'DEP',
        department: 'Mechanical',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/contraption.webp`,
        gradient: 'linear-gradient(135deg, #ff9800, #000)',
        borderColor: '#ff9800',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '09:00',
                endTime: '18:00',
                round: 'Final Assembly'
            }
        ],
        venue: 'Mechanical Workshop',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 150,
        paymentRequired: true,
        minTeamSize: 4,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'Swapnil Gole', phone: '7058855414' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/contraptions.pdf`,
        handle: 'Master-Builder',
        status: "published"
    },
    {
        id: 'CMP-26-EC-CCK-015',
        code: 'CCK',
        title: 'Circle Cricket',
        subtitle: 'A Spin on the Classic',
        description: 'A fast-paced, entertaining variation of traditional cricket where players stand in a circular formation.',
        category: 'DEP',
        department: 'ECE',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/circlecricket.webp`,
        gradient: 'linear-gradient(145deg, #10b981, #000)',
        borderColor: '#10b981',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '08:00',
                endTime: '11:00',
                round: 'Group Stage'
            }
        ],
        venue: 'Sports Ground',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 100,
        paymentRequired: true,
        minTeamSize: 4,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'Trushita Barhate', phone: '9009989885' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/circle-cricket.pdf`,
        handle: 'Cricket-Lead',
        status: "published"
    },
    {
        id: 'CMP-26-GEN-PPR-001',
        code: 'PPR',
        title: 'Paper Presentation',
        subtitle: 'Technical Research Showcase',
        description: 'Showcase your groundbreaking research and technical insights to a panel of expert judges.',
        category: 'GEN',
        department: 'General',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/paper-presentation.png`,
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        borderColor: '#5227FF',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '10:00',
                endTime: '16:00',
                round: 'Presentation'
            }
        ],
        venue: 'Seminar Hall',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 200,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 1,
        teamRequired: false,
        coordinators: [
            { name: 'TBA', phone: '' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/paper-presentation.pdf`,
        handle: 'Research-Lead',
        status: "published"
    },
    {
        id: 'CMP-26-GEN-PRJ-002',
        code: 'PRJ',
        title: 'Project Competition',
        subtitle: 'Innovation Exhibition',
        description: 'Showcase your practical skills, creativity, and real-world solutions. Present working or conceptual projects.',
        category: 'GEN',
        department: 'General',
        year: 2026,
        image: `${import.meta.env.BASE_URL}assets/competitions/project-competition.png`,
        gradient: 'linear-gradient(145deg, #10b981, #000)',
        borderColor: '#10b981',
        schedule: [
            {
                date: '2026-04-21',
                startTime: '09:00',
                endTime: '17:00',
                round: 'Live Demo'
            }
        ],
        venue: 'Main Workshop',
        registrationStart: '2026-03-01',
        registrationEnd: '2026-04-15',
        isRegistrationOpen: true,
        entryFee: 200,
        paymentRequired: true,
        minTeamSize: 1,
        maxTeamSize: 4,
        teamRequired: true,
        coordinators: [
            { name: 'TBA', phone: '' }
        ],
        rulebook: `${import.meta.env.BASE_URL}assets/rule-books/project-presentation.pdf`,
        handle: 'Project-Master',
        status: "published"
    },
];

export const generateCompetitionId = (id: string): string => {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '_');
};
