export interface Competition {
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
}

export const COMPETITIONS_DATA: Competition[] = [
    // Flagships
    {
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Codex ’26',
        subtitle: '24-Hour Hackathon',
        location: 'Flagship Event',
        handle: 'Codex-Hack',
        description: 'The premier hackathon of Avishkar. 24 hours of pure product development, intense coding, and transformative innovation. Build the future and claim the throne.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        isFlagship: true,
        prizePool: '₹1,00,000+',
        slug: 'codex-26'
    },
    {
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'RoboTron ’26',
        subtitle: 'Robo War',
        location: 'Flagship Event',
        handle: 'RoboTron',
        description: 'Witness high-octane robotic combat. Design, build, and optimize your machines to survive the definitive battlefield of metal and electronics.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: '#',
        isFlagship: true,
        prizePool: '₹1,00,000+',
        slug: 'robotron-26'
    },
    {
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'Battle Grid ’26',
        subtitle: 'E-Sports Arena',
        location: 'Flagship Event',
        handle: 'Grid-Warrior',
        description: 'The ultimate tactical arena battle. A high-stakes competition where only one elite team will emerge as the absolute champion of the grid.',
        borderColor: '#ff4655',
        gradient: 'linear-gradient(210deg, #ff4655, #000)',
        url: '#',
        isFlagship: true,
        prizePool: '₹50,000+',
        slug: 'battle-grid-26'
    },

    // Standard Competitions
    // (Waiting for user data to populate other competitions)

    // Exhibition
    {
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=400&auto=format&fit=crop',
        title: 'AI Art Gallery',
        subtitle: 'Exhibition & Showcase',
        location: 'Branding Initiative',
        handle: 'AI-Gallery',
        description: 'Explore the intersection of machine learning and fine arts. A non-competitive showcase of revolutionary AI-generated masterpieces created specifically for Avishkar ’26.',
        borderColor: '#5227FF',
        gradient: 'linear-gradient(145deg, #5227FF, #000)',
        url: '#',
        isExhibition: true,
        slug: 'ai-art-gallery'
    }
];
