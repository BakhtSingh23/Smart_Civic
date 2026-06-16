export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" />
      <span className="small">{label}</span>
    </div>
  );
}
