import { useSearchParams } from 'react-router-dom'
import SEO from '../../components/seo/SEO'
import ChromaGrid from '../../components/chroma-grid/ChromaGrid'
import './Team.css'

const ALL_MEMBERS = [
    // Core Leadership
    {
        slug: 'shrvan',
        image: `${import.meta.env.BASE_URL}members/Shravan G.webp`,
        title: 'Shrvan',
        subtitle: 'Event Lead',
        location: 'Core Leadership',
        handle: '@069.f5',
        description: 'The question isn\'t how, the question is when.',
        borderColor: '#A0522D',
        gradient: 'linear-gradient(145deg, #A0522D, #000)',
        url: 'https://instagram.com/069.f5',
        socials: {
            instagram: 'https://instagram.com/069.f5',
            linkedin: 'https://www.linkedin.com/in/shravan45x',
            twitter: 'https://x.com/shravan45z',
            github: 'https://github.com/Shravan4507'
        }
    },
    {
        slug: 'sanya-malhotra',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Sanya Malhotra',
        subtitle: 'Technical Head',
        location: 'Core Leadership',
        handle: '@sanya_tech',
        description: 'Engineering wizard managing all technical infrastructures. Dedicated to delivering a seamless digital experience for all festival participants. Architected the core event handling systems.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(180deg, #d9ff00, #000)',
        url: 'https://github.com/Shravan4507',
        socials: {
            linkedin: '#',
            github: 'https://github.com/Shravan4507',
            instagram: '#'
        }
    },
    {
        slug: 'rohan-verma',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Rohan Verma',
        subtitle: 'Management Lead',
        location: 'Core Leadership',
        handle: '@rohan_verma',
        description: 'Organizational expert ensuring coordination between all departments. Focused on operational excellence and resource optimization. Streamlined the internal logistics for the entire festival cycle.',
        borderColor: '#A0522D',
        gradient: 'linear-gradient(145deg, #A0522D, #000)',
        url: 'https://linkedin.com/',
        socials: {
            linkedin: '#',
            twitter: '#'
        }
    },
    // Technical & Design
    {
        slug: 'ishaan-gupta',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Ishaan Gupta',
        subtitle: 'Full Stack Developer',
        location: 'Technical & Design',
        handle: '@ishaan_dev',
        description: 'Building the future of the web, one line of code at a time. Expert in modern React architectures and scalable backend systems. Passionate about Open Source contributions.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(210deg, #d9ff00, #000)',
        url: 'https://github.com/Shravan4507',
        socials: {
            github: 'https://github.com/Shravan4507',
            linkedin: '#'
        }
    },
    {
        slug: 'ananya-deshpande',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Ananya Deshpande',
        subtitle: 'Chief Designer',
        location: 'Technical & Design',
        handle: '@ananya_design',
        description: 'Crafting the visual identity of Avishkar. Bringing aesthetic elegance and user-centric design to every digital touchpoint. Created the unique grainient branding for this year.',
        borderColor: '#A0522D',
        gradient: 'linear-gradient(165deg, #A0522D, #000)',
        url: 'https://instagram.com/ananya_design',
        socials: {
            instagram: '#',
            linkedin: '#'
        }
    },
    {
        slug: 'vikram-singh',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Vikram Singh',
        subtitle: 'UI/UX Lead',
        location: 'Technical & Design',
        handle: '@vikram_ux',
        description: 'Specializing in creating intuitive and engaging user journeys. Bridging the gap between complex technology and human interaction. Focused on accessibility and performance.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(195deg, #d9ff00, #000)',
        url: 'https://linkedin.com/',
        socials: {
            linkedin: '#',
            twitter: '#'
        }
    },
    // Marketing & PR
    {
        slug: 'kritika-roy',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Kritika Roy',
        subtitle: 'PR Coordinator',
        location: 'Marketing & PR',
        handle: '@kritika_pr',
        description: 'Voice of the festival, managing external communications and media relations. Dedicated to building strong brand authority.',
        borderColor: '#A0522D',
        gradient: 'linear-gradient(225deg, #A0522D, #000)',
        url: 'https://linkedin.com/',
        socials: {
            linkedin: '#',
            twitter: '#'
        }
    },
    {
        slug: 'sahil-kapoor',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&h=300&auto=format&fit=crop',
        title: 'Sahil Kapoor',
        subtitle: 'Marketing Head',
        location: 'Marketing & PR',
        handle: '@sahil_mkt',
        description: 'Strategic marketer expanding the reach of Avishkar across the nation. Expertise in digital campaigns and audience engagement.',
        borderColor: '#d9ff00',
        gradient: 'linear-gradient(135deg, #d9ff00, #000)',
        url: 'https://linkedin.com/',
        socials: {
            linkedin: '#',
            twitter: '#'
        }
    }
]

function Team() {
    const [searchParams, setSearchParams] = useSearchParams()
    const memberSlug = searchParams.get('member')

    const handleMemberClick = (member: any) => {
        setSearchParams({ member: member.slug })
    }

    const handleCloseModal = () => {
        setSearchParams({})
    }

    return (
        <>
            <SEO 
                title="The Team" 
                description="Meet the visionary team behind Avishkar '26, organizing the biggest technology festival of the year." 
            />
            <main className="team-page">
            <header className="team-header">
                <div className="header-glow"></div>
                <h1>The Visionary</h1>
                <p>Everything is RELATIVE...</p>
            </header>

            <div className="team-container" style={{ position: 'relative', minHeight: '800px' }}>
                <ChromaGrid
                    items={ALL_MEMBERS.filter(m => m.slug === 'shrvan') as any}
                    radius={400}
                    damping={0.5}
                    fadeOut={0.8}
                    columns={1}
                    showRegister={false}
                    selectedItemSlug={memberSlug || undefined}
                    onItemClick={handleMemberClick}
                    onModalClose={handleCloseModal}
                />
            </div>
        </main>
        </>
    )
}

export default Team
