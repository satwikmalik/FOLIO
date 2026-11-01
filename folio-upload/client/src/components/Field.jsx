export default function Field({ label, hint, as: Tag = 'input', ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <Tag className="input" {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
