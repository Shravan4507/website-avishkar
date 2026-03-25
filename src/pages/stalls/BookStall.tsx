import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import SEO from '../../components/seo/SEO';
import { useToast } from '../../components/toast/Toast';
import GlassSelect from '../../components/dropdown/GlassSelect';
import './BookStall.css';

const STALL_OPTIONS = [
    { label: 'Technical Exhibition', value: 'Technical' },
    { label: 'Food Stall', value: 'Food' },
    { label: 'Enterprise Booth', value: 'Enterprise' },
    { label: 'Startup Pod', value: 'Startup' },
    { label: 'Branding/Marketing', value: 'Marketing' },
    { label: 'Other', value: 'Other' }
];

const BookStall: React.FC = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        stallType: 'Technical',
        requirements: '',
        message: '',
        expectedAttendees: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (val: string) => {
        setFormData(prev => ({ ...prev, stallType: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simple word count validations
        const reqWords = formData.requirements.trim().split(/\s+/).length;
        if (formData.requirements && reqWords > 100) {
            toast('Requirements must be maximum 100 words.', 'error');
            return;
        }

        const msgWords = formData.message.trim().split(/\s+/).length;
        if (formData.message && msgWords > 500) {
            toast('Message must be maximum 500 words.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'stall-bookings'), {
                ...formData,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            
            toast('Booking request sent successfully!', 'success');
            setFormData({
                name: '',
                email: '',
                phone: '',
                organization: '',
                stallType: 'Technical',
                requirements: '',
                message: '',
                expectedAttendees: ''
            });
        } catch (error) {
            console.error("Error submitting stall booking:", error);
            toast('Failed to send request.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="stall-booking-page">
            <SEO 
                title="Book a Stall | Avishkar '26" 
                description="Secure your space at one of Pune's biggest technical festivals. Book a stall at Avishkar '26 for exhibition, food, or marketing."
            />
            <div className="stall-booking-container">
                <header className="stall-header">
                    <h1 className="stall-title">Marketplace Platform</h1>
                    <p className="stall-subtitle">Secure your presence at AVISHKAR '26</p>
                </header>
                
                <div className="stall-form-card">
                    <form onSubmit={handleSubmit} className="stall-form">
                        <div className="form-grid">
                            <div className="form-group full">
                                <label>Organization / College Name</label>
                                <input 
                                    type="text" name="organization" value={formData.organization} 
                                    onChange={handleChange} required placeholder="Enter name of your entity" 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text" name="name" value={formData.name} 
                                    onChange={handleChange} required placeholder="John Doe" 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Email Address</label>
                                <input 
                                    type="email" name="email" value={formData.email} 
                                    onChange={handleChange} required placeholder="john@example.com" 
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input 
                                    type="tel" name="phone" value={formData.phone} 
                                    onChange={handleChange} required placeholder="+91 00000 00000" 
                                />
                            </div>

                            <div className="form-group">
                                <label>Type of Stall</label>
                                <GlassSelect 
                                    options={STALL_OPTIONS} 
                                    value={formData.stallType} 
                                    onChange={handleSelectChange}
                                />
                            </div>

                            <div className="form-group full">
                                <label>Key Requirements (Max 100 words)</label>
                                <textarea 
                                    name="requirements" value={formData.requirements} 
                                    onChange={handleChange} required placeholder="e.g. 10x10 space, 2 electricity points, 4 chairs..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-group full">
                                <label>Additional Message (Max 500 words)</label>
                                <textarea 
                                    name="message" value={formData.message} 
                                    onChange={handleChange} placeholder="Tell us more about what you're bringing to AVISHKAR..."
                                    rows={5}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className={`stall-submit-btn ${isSubmitting ? 'loading' : ''}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing Request...' : 'Send Booking Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookStall;
