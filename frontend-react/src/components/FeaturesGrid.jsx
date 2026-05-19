function FeaturesGrid() {
    const features = [
        {
            title: "Automated Payroll",
            desc: "One-click salary processing and automated compliance.",
            icon: "💰",
            large: true
        },
        {
            title: "Attendance",
            desc: "Real-time biometric and geo-fenced tracking.",
            icon: "📅"
        },
        {
            title: "Leaves",
            desc: "Simplified application and approval workflows.",
            icon: "🌴"
        },
        {
            title: "Assets",
            desc: "Complete lifecycle management for company devices.",
            icon: "💻"
        },
        {
            title: "Locations",
            desc: "Manage multiple branches from a single dashboard.",
            icon: "📍"
        },
        {
            title: "Letter Heads",
            desc: "Generate official documents and certificates instantly.",
            icon: "📄",
            large: true
        }
    ];

    return (
        <div className="features-grid-container" id="features">
            <div className="features-header">
                <span className="badge">Platform Features</span>
                <h2 className="section-title">Everything you need to <span className="gradient-text">scale your team</span></h2>
                <p className="section-subtitle">Powerful tools designed to automate the heavy lifting of HR management.</p>
            </div>
            <div className="features-grid">
                {features.map((f, i) => (
                    <div key={i} className={`feature-card ${f.large ? 'large' : ''}`}>
                        <div className="feature-icon-wrapper">
                            {f.icon}
                        </div>
                        <div className="feature-info">
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FeaturesGrid;