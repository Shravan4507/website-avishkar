import { useState } from 'react'
import SEO from '../../components/seo/SEO'
import './Contact.css'

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission logic here
        console.log('Form submitted:', formData)
        alert('Thank you for reaching out! We will get back to you soon.')
    }

    return (
        <>
            <SEO 
                title="Contact Us" 
                description="Have questions about Avishkar '26? Get in touch with the organizing team." 
            />
            <div className="contact-page">
            <div className="contact-container">
                <div className="contact-info">
                    <h1 className="contact-title">Get in Touch</h1>
                    <p className="contact-subtitle">
                        Have questions about Avishkar '26? We're here to help. Send us a message and we'll respond as soon as possible.
                    </p>

                    <div className="info-items">
                        <div className="info-item">
                            <div className="info-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <div className="info-text">
                                <h3>Location</h3>
                                <a href="https://maps.app.goo.gl/2d235Yw8e23456789" target="_blank" rel="noopener noreferrer">
                                    Zeal College of Engineering and Research, Narhe, Pune - 411041
                                </a>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <div className="info-text">
                                <h3>Email</h3>
                                <a href="mailto:support.avishkar@zealeducation.com">support.avishkar@zealeducation.com</a>
                            </div>
                        </div>

                        <div className="info-item">
                            <div className="info-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                            </div>
                            <div className="info-text">
                                <h3>Phone</h3>
                                <a href="tel:+911234567890">+91 12345 67890</a>
                            </div>
                        </div>
                    </div>

                    <div className="contact-socials">
                        <h3>Follow Us</h3>
                        <div className="social-links">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                        </div>
                    </div>
                </div>

                <div className="contact-form-wrapper">
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                placeholder="How can we help?"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                placeholder="Your message here..."
                                rows={5}
                                value={formData.message}
                                onChange={handleChange}
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="submit-btn">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
        </>
    )
}

export default Contact
