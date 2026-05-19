function EmployeeSection() {
    return (
        <section className="section section-light">
            <div className="container section-grid reversed">
                <div className="section-content">
                    <h2 className="gradient-text">
                        Unified Workforce Management
                    </h2>
                    <p>
                        Maintain a central directory of all your employees. Track performance, manage assets, and streamline onboarding from one unified, highly intuitive dashboard.
                    </p>
                    <div className="feature-list">
                        <div className="feature-item">
                            <div className="feature-item-icon">
                                👥
                            </div>
                            <div className="feature-item-text">
                                <h4>
                                    Self-Service Portal
                                </h4>
                                <p>
                                    Empower employees to update details, view documents, and request leaves seamlessly.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-item-icon">
                                📈
                            </div>
                            <div className="feature-item-text">
                                <h4>
                                    Performance Tracking
                                </h4>
                                <p>
                                    Set OKRs, conduct peer reviews, and monitor organizational growth effortlessly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="section-image">
                    <img 
                        src="/src/assets/workforce-illustration.png" 
                        alt="Unified Workforce Management" 
                        className="section-illustration-img"
                    />
                </div>
            </div>
        </section>
    )
}

export default EmployeeSection;