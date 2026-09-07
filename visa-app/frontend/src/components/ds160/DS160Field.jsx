export default function DS160Field({ campo, value, error, onChange, modoSenior, styles }) {
  const inputId = `campo-${campo.name}`;

  // Radio buttons
  if (campo.type === "radio") {
    return (
      <div style={styles.campoContainer}>
        <div id={`${inputId}-label`} style={{ ...styles.label, fontSize: modoSenior ? "13px" : "11px" }}>
          {campo.label}
          {campo.required && <span style={styles.required}>*</span>}
        </div>
        <div style={styles.radioGroup} role="group" aria-labelledby={`${inputId}-label`}>
          {campo.opciones.map(op => (
            <button
              key={op}
              type="button"
              style={{
                ...styles.radioBtn,
                ...(value === op ? styles.radioBtnSel : {}),
                ...(error && !value ? styles.radioBtnError : {}),
                fontSize: modoSenior ? "16px" : "14px"
              }}
              aria-pressed={value === op}
              onClick={() => onChange(campo.name, op)}
            >
              {op}
            </button>
          ))}
        </div>
        {error && <span role="alert" style={styles.errorText}>{error}</span>}
      </div>
    );
  }

  // Select dropdown
  if (campo.type === "select") {
    return (
      <div style={styles.campoContainer}>
        <label htmlFor={inputId} style={{ ...styles.label, fontSize: modoSenior ? "13px" : "11px" }}>
          {campo.label}
          {campo.required && <span style={styles.required}>*</span>}
        </label>
        <select
          id={inputId}
          style={{
            ...styles.input,
            fontSize: modoSenior ? "17px" : "15px",
            ...(error ? styles.inputError : {})
          }}
          value={value || ""}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={e => onChange(campo.name, e.target.value)}
        >
          <option value="">Selecciona una opción</option>
          {campo.opciones.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        {error && <span id={`${inputId}-error`} role="alert" style={styles.errorText}>{error}</span>}
      </div>
    );
  }

  // Input (text, date, email, tel, number)
  return (
    <div style={styles.campoContainer}>
      <label htmlFor={inputId} style={{ ...styles.label, fontSize: modoSenior ? "13px" : "11px" }}>
        {campo.label}
        {campo.required && <span style={styles.required}>*</span>}
      </label>
      <input
        id={inputId}
        type={campo.type}
        style={{
          ...styles.input,
          fontSize: modoSenior ? "17px" : "15px",
          padding: modoSenior ? "15px 18px" : "12px 16px",
          ...(error ? styles.inputError : {})
        }}
        placeholder={campo.placeholder || ""}
        value={value || ""}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={e => onChange(campo.name, e.target.value)}
      />
      {error && <span id={`${inputId}-error`} role="alert" style={styles.errorText}>{error}</span>}
    </div>
  );
}