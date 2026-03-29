export interface Competition {
    id: string;           // Unique competition ID (e.g., "codex--26", "computer_halfcodehack")
    image: string;
    title: string;
    subtitle: string;
    location: string;
    handle: string;
    description: string;
    borderColor: string;
    gradient: string;
    url: string;
    isFlagship?: boolean;
    prizePool?: string;
    isExhibition?: boolean;
    slug?: string;
    department: string;
    entryFee?: number;
    coordinator?: string;
    contactNumber?: string;
}

export const COMPETITIONS_DATA: Competition[] = [
    // Flagships (Fixed IDs)
    {
        id: 'codex--26',
        image: `${import.meta.env.BASE_URL}assets/competitions/paramx.png`,
        title: "Param-X '26",
        subtitle: '10-Hour Hackathon',
        location: 'Flagship Event',
        handle: 'ParamX-Hack',
        description: 'The premier hackathon of Avishkar. 10 hours of pure product development, intense coding, and transformative innovation. Build the future and claim the throne.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        isFlagship: true,
        prizePool: '₹1,00,000+',
        slug: 'codex-26',
        department: 'Computer Engineering'
    },
    {
        id: 'robotron--26',
        image: `${import.meta.env.BASE_URL}assets/competitions/robokshetra.png`,
        title: "Robo-Kshetra '26",
        subtitle: 'Robo War',
        location: 'Flagship Event',
        handle: 'Robo-Kshetra',
        description: 'Witness high-octane robotic combat. Design, build, and optimize your machines to survive the definitive battlefield of metal and electronics.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        isFlagship: true,
        prizePool: '₹1,00,000+',
        slug: 'robotron-26',
        department: 'E&TC Engineering'
    },
    {
        id: 'battlegrid--26',
        image: `${import.meta.env.BASE_URL}assets/competitions/battlegrid.png`,
        title: "Battle Grid '26",
        subtitle: 'E-Sports Arena',
        location: 'Flagship Event',
        handle: 'Grid-Warrior',
        description: 'The ultimate tactical arena battle. A high-stakes competition where only one elite team will emerge as the absolute champion of the grid.',
        borderColor: '#ff4655',
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        url: '#',
        isFlagship: true,
        prizePool: '₹80,000',
        slug: 'battle-grid-26',
        department: 'Information Technology'
    },

    // Standard Competitions
    {
        id: 'comp_forgex',
        image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Forge-X',
        subtitle: 'Engineering Unleashed',
        location: 'Main Arena',
        handle: 'Forge-Lead',
        description: "An intensive competition for innovative minds to solve real-world problems through advanced technological solutions.",
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'forge-x',
        department: 'Mechanical Engineering',
        entryFee: 99,
        coordinator: "Aryan Gupta",
        contactNumber: "9140411132"
    },
    {
        id: 'comp_algobid',
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Algo Bid: Auction Coding',
        subtitle: 'Strategic Programming',
        location: 'Coding Den',
        handle: 'Algo-Master',
        description: 'Where algorithms meet auctions. Bid for your problems and solve them under pressure.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        slug: 'algo-bid',
        department: 'Computer Engineering',
        entryFee: 99,
        coordinator: 'Tejprakash Mirashi',
        contactNumber: '7378965050'
    },
    {
        id: 'comp_codeladder',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Code Ladder',
        subtitle: 'Step-by-Step Logic',
        location: 'Cyber Arena',
        handle: 'Code-Climber',
        description: 'Climb the leaderboard with incrementally challenging coding hurdles.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'code-ladder',
        department: 'Computer Engineering',
        entryFee: 250,
        coordinator: 'Shreya Kad',
        contactNumber: '7517021872'
    },
    {
        id: 'comp_iplauction',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'IPL Auction',
        subtitle: 'Strategic Bidding',
        location: 'Grand Hall',
        handle: 'IPL-Auctioneer',
        description: "Experience the adrenaline of the player auction in this high-stakes cricket simulation.",
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'ipl-auction',
        department: 'General',
        entryFee: 250,
        coordinator: "Tushar Anand",
        contactNumber: "9236113425"
    },
    {
        id: 'comp_devclash',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Dev Clash',
        subtitle: 'Product Development',
        location: 'Design Studio',
        handle: 'Dev-Striker',
        description: 'Face off in a sprint to build the most efficient and scalable prototypes.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'dev-clash',
        department: 'Computer Engineering',
        entryFee: 199,
        coordinator: 'Om Kute',
        contactNumber: '7709056730'
    },
    {
        id: 'comp_vibesprint',
        image: 'https://images.unsplash.com/photo-1626544823105-df33a1e16356?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Vibe Sprint',
        subtitle: 'Creative Dash',
        location: 'Main Ground',
        handle: 'Vibe-Lead',
        description: 'A fusion of creativity and speed. Express your vibe and claim the stage.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        slug: 'vibe-sprint',
        department: 'General',
        entryFee: 99,
        coordinator: 'Parth Shinde',
        contactNumber: '9168906630'
    },
    {
        id: 'comp_coderun',
        image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Code Run',
        subtitle: 'Competitive Programming',
        location: 'Coding Den',
        handle: 'Runner-Code',
        description: 'Fast-paced coding challenges where every millisecond counts.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'code-run',
        department: 'Information Technology',
        entryFee: 199,
        coordinator: 'Vaidehi Singh',
        contactNumber: '8766690242'
    },
    {
        id: 'comp_bridgenova',
        image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Bridge Nova',
        subtitle: 'Structural Engineering',
        location: 'Design Lab',
        handle: 'Arch-Nova',
        description: 'Build robust bridges with limited resources and test their structural limits.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'bridge-nova',
        department: 'Civil Engineering',
        entryFee: 150,
        coordinator: 'Ashish Shinde',
        contactNumber: '9373113736'
    },
    {
        id: 'comp_poster',
        image: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Poster Presentation',
        subtitle: 'Research Showcase',
        location: 'Seminar Hall',
        handle: 'Paper-Lead',
        description: 'Present your research and findings through high-impact visual posters.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        slug: 'poster-presentation',
        department: 'General',
        entryFee: 100,
        coordinator: 'Pranav Katu',
        contactNumber: '9503231138'
    },
    {
        id: 'comp_sparktank',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Spark Tank',
        subtitle: 'Electro-Innovation Pitch',
        location: 'Tech Hub',
        handle: 'Spark-Lead',
        description: 'Pitch your innovative electronics-based products to a panel of expert "sharks".',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        slug: 'spark-tank',
        department: 'E&TC Engineering',
        entryFee: 200,
        coordinator: 'Harshita Jadhav',
        contactNumber: '9356766305'
    },
    {
        id: 'comp_matlab',
        image: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Matlab Madness',
        subtitle: 'Mathematical Computing',
        location: 'Simulation Lab',
        handle: 'Mat-Master',
        description: 'Solve complex engineering problems using the power of Matlab and Simulink.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        slug: 'matlab-madness',
        department: 'E&TC Engineering',
        entryFee: 300,
        coordinator: 'Aadesh Bartakke',
        contactNumber: '8888487529'
    },
    {
        id: 'comp_circuitsim',
        image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Circuit Simulation',
        subtitle: 'Virtual Electronics',
        location: 'Simulation Lab',
        handle: 'Circuit-Ninja',
        description: 'Design and simulate intricate electronic circuits flawlessly.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        slug: 'circuit-simulation',
        department: 'E&TC Engineering',
        entryFee: 300,
        coordinator: 'Saniya Jadhav',
        contactNumber: '9699281400'
    },
    {
        id: 'orbitx_solar',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        title: 'Solar Spot Observation',
        subtitle: 'OrbitX Club Event',
        location: 'ZCOER Grounds',
        handle: 'OrbitX-Solar',
        description: 'Witness the sun like never before using professional H-alpha filters. Observe sunspots and solar flares in real-time.',
        borderColor: '#ff7800',
        gradient: 'linear-gradient(145deg, #ff7800, #000)',
        url: '/orbitx-zcoer',
        slug: 'orbitx_solar',
        department: 'OrbitX Club',
        entryFee: 30,
        coordinator: 'OrbitX Team',
        contactNumber: '0000000000'
    },
];

// Helper: Generate a competition ID from department + title
// e.g., "Computer Engineering" + "HalfCode Hack" \u2192 "computer_halfcodehack"
export const generateCompetitionId = (department: string, title: string): string => {
    const deptKey = department.toLowerCase().split(' ')[0]; // "Computer Engineering" \u2192 "computer"
    const titleKey = title.toLowerCase().replace(/[^a-z0-9]/g, ''); // "HalfCode Hack" \u2192 "halfcodehack"
    return `${deptKey}_${titleKey}`;
};
