import "../styles/hero.css";

function HeroSection() {
    return (
        <section className="hero" id="home">
            <div className="container hero-grid">
                <div className="hero-content">
                    <span className="badge">
                        The Standard in HR Management
                    </span>
                    <h1 className="hero-title">
                        Next Generation
                        <br />
                        <span className="gradient-text">
                            Workforce Platform
                        </span>
                    </h1>
                    <p className="hero-desc">
                        Automate your HR processes, streamline payroll, and manage your workforce with our intuitive, modern, and compliance-ready platform designed for scale.
                    </p>
                    <ul className="hero-bullets">
                        <li>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Instant automated payroll processing
                        </li>
                        <li>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Self-service employee portals
                        </li>
                        <li>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Enterprise-grade security built-in
                        </li>
                    </ul>
                    <div className="hero-buttons">
                        <a href="/login" className="btn btn-primary">
                            Access Dashboard
                        </a>
                        <a href="#features" className="btn btn-ghost">
                            Explore Features
                        </a>
                    </div>
                </div>
                
                <div className="hero-visual">
                    <img 
                        src="/src/assets/hero-illustration.png" 
                        alt="HR Management Illustration" 
                        className="hero-illustration-img"
                    />
                </div>
            </div>
        </section>
    )
}

export default HeroSection;