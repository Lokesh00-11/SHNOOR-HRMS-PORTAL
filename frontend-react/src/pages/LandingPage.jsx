import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesGrid from "../components/FeaturesGrid";
import PayrollSection from "../components/PayrollSection";
import EmployeeSection from "../components/EmployeeSection";
import PricingSection from "../components/PricingSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

function LandingPage() {
    return (
        <div>
            <Navbar />
            <HeroSection />
            <FeaturesGrid />
            <PayrollSection />
            <EmployeeSection />
            <PricingSection />
            <ContactSection />
            <Footer />
        </div>
    )
}

export default LandingPage;