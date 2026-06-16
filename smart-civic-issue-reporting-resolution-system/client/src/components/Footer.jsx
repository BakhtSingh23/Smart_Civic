export default function Footer() {
  return (
    <footer className="app-footer py-3 px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <span className="small">© {new Date().getFullYear()} Smart Civic</span>
        <span className="small text-muted">Issue reporting & resolution</span>
      </div>
    </footer>
  );
}
