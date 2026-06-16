import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar px-3">
      <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
        <img src="/assets/logo.png" alt="Smart Civic Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
        <span>Smart Civic</span>
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#nav"
        aria-controls="nav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="nav">
        <div className="navbar-nav ms-auto">
          <NavLink className="nav-link" to="/">
            Home
          </NavLink>
          <NavLink className="nav-link" to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/register">
            Register
          </NavLink>
          <NavLink className="nav-link" to="/login">
            Login
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
