import "../styles/navbar.css";
import ThemeToggle from "./Common/ThemeToggle";

function Navbar() {
    return (
        <nav className="navbar" id="navbar">
            <div className="container">
                <a href="#" className="logo">
                    Shnoor HRM
                </a>
                <div className="nav-links">
                    <a href="#home">Home</a>
                    <a href="#features">Features</a>
                    <a href="#pricing">Pricing</a>
                    <a href="#contact">Contact</a>
                </div>
                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ThemeToggle />
                    <a href="/login" className="btn btn-primary">
                        Login
                    </a>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;