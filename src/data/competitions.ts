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
}

export const COMPETITIONS_DATA: Competition[] = [
    // Flagships (Fixed IDs)
    {
        id: 'codex--26',
        image: `${import.meta.env.BASE_URL}assets/competitions/paramx.png`,
        title: "ParamX '26",
        subtitle: '24-Hour Hackathon',
        location: 'Flagship Event',
        handle: 'ParamX-Hack',
        description: 'The premier hackathon of Avishkar. 24 hours of pure product development, intense coding, and transformative innovation. Build the future and claim the throne.',
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
        prizePool: '₹50,000+',
        slug: 'battle-grid-26',
        department: 'Information Technology'
    },

    // Standard Competitions
    // (Department competitions are dynamically created via CompetitionForm and stored in Firestore)

    // Exhibition
    {
        id: 'it_aiartgallery',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'AI Art Gallery',
        subtitle: 'Exhibition & Showcase',
        location: 'Branding Initiative',
        handle: 'AI-Gallery',
        description: "Explore the intersection of machine learning and fine arts. A non-competitive showcase of revolutionary AI-generated masterpieces created specifically for Avishkar '26.",
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        isExhibition: true,
        slug: 'ai-art-gallery',
        department: 'Information Technology'
    }
];

// Helper: Generate a competition ID from department + title
// e.g., "Computer Engineering" + "HalfCode Hack" → "computer_halfcodehack"
export const generateCompetitionId = (department: string, title: string): string => {
    const deptKey = department.toLowerCase().split(' ')[0]; // "Computer Engineering" → "computer"
    const titleKey = title.toLowerCase().replace(/[^a-z0-9]/g, ''); // "HalfCode Hack" → "halfcodehack"
    return `${deptKey}_${titleKey}`;
};
