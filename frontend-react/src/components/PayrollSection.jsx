function PayrollSection() {
    return (
        <section className="section" id="features">
            <div className="container section-grid">
                <div className="section-content">
                    <h2 className="gradient-text">
                        Automated Payroll Processing
                    </h2>
                    <p>
                        Eliminate manual errors and save hours every month. Our robust payroll engine calculates taxes, deductions, and generates precise payslips with zero effort.
                    </p>
                    <div className="feature-list">
                        <div className="feature-item">
                            <div className="feature-item-icon">
                                💸
                            </div>
                            <div className="feature-item-text">
                                <h4>
                                    One-Click Disbursal
                                </h4>
                                <p>
                                    Execute bulk payouts directly to employee bank accounts effortlessly.
                                </p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-item-icon">
                                🧾
                            </div>
                            <div className="feature-item-text">
                                <h4>
                                    Instant Payslips
                                </h4>
                                <p>
                                    Auto-generate and distribute compliance-ready payslips in seconds.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="section-image">
                    <img 
                        src="/src/assets/payroll-illustration.png" 
                        alt="Automated Payroll Processing" 
                        className="section-illustration-img"
                    />
                </div>
            </div>
        </section>
    )
}

export default PayrollSection;