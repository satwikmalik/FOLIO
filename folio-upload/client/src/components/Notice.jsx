export default function Notice({ type = 'info', children }) {
  if (!children) return null;
  return (
    <p className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
