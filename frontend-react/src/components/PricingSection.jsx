function PricingSection() {
    const plans = [
        {
            title: "Basic",
            price: "₹499",
            features: [
                "Up to 50 Employees",
                "Attendance Tracking",
                "Self-Service Portal",
                "Email Support"
            ]
        },
        {
            title: "Pro",
            price: "₹999",
            features: [
                "Up to 200 Employees",
                "Full Payroll Engine",
                "Leave Management",
                "Priority Support"
            ],
            highlight: true
        },
        {
            title: "Enterprise",
            price: "₹1999",
            features: [
                "Unlimited Employees",
                "Multi-location Support",
                "Custom Reports",
                "Dedicated Account Manager"
            ]
        }
    ];

    return (
        <section className="pricing-section-container" id="pricing">
            <div className="container">
                <div className="features-header">
                    <span className="badge">Simple Pricing</span>
                    <h2 className="section-title">Plans that scale <span className="gradient-text">with your business</span></h2>
                    <p className="section-subtitle">Choose the perfect plan for your team's needs. No hidden fees.</p>
                </div>

                <div className="pricing-grid">
                    {plans.map((plan, index) => (
                        <div key={index} className={`pricing-card ${plan.highlight ? 'highlight' : ''}`}>
                            <h3>{plan.title}</h3>
                            <div className="price">
                                {plan.price} <span>/ month</span>
                            </div>
                            <ul>
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex}>{feature}</li>
                                ))}
                            </ul>
                            <button className={`btn ${plan.highlight ? 'btn-primary' : 'btn-ghost'}`}>
                                Get Started
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default PricingSection;