import { useState } from "react";
import "./ProfileSelection.css";

function ProfileSelection() {
  const [selectedProfile, setSelectedProfile] = useState("");
  const [loading, setLoading] = useState(false);

  const profiles = [
    {
      id: "turismo_negocios",
      icon: "💼",
      title: "Turismo / Negocios (B1/B2)",
      description:
        "Viajes de placer, visitas familiares o reuniones de negocios.",
    },
    {
      id: "estudiante",
      icon: "🎓",
      title: "Estudiante (F/M)",
      description:
        "Estudios académicos o vocacionales en instituciones de EE. UU.",
    },
    {
      id: "renovacion",
      icon: "🔄",
      title: "Renovación",
      description:
        "Renovación de visa sin necesidad de entrevista consular.",
    },
    {
      id: "grupo_familiar",
      icon: "👨‍👩‍👧",
      title: "Grupo Familiar",
      description:
        "Solicitud conjunta para varios miembros de la familia.",
    },
    {
      id: "adulto_mayor",
      icon: "👓",
      title: "Adulto Mayor (Senior)",
      description:
        "Proceso simplificado con exención de entrevista por edad.",
    },
  ];

  const handleSaveProfile = async () => {
    if (!selectedProfile) {
      alert("Selecciona un perfil primero.");
      return;
    }

    const correo = localStorage.getItem("correoUsuario");

    if (!correo) {
      alert("Primero inicia sesión para guardar el perfil.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/guardar-perfil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo,
          perfil: selectedProfile,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("perfilUsuario", selectedProfile);
        alert("Perfil guardado correctamente");
      } else {
        alert(data.error || "No se pudo guardar el perfil");
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="brand">
          <div className="brand-badge">VG</div>
          <span className="brand-name">VisaGuide</span>
        </div>

        <button className="login-link">Iniciar sesión</button>
      </header>

      <main className="profile-main">
        <h1 className="profile-title">
          Prepara tu solicitud de visa
          <span>sin estrés</span>
        </h1>

        <p className="profile-subtitle">
          Te guiamos paso a paso, evitamos errores comunes y te preparamos para
          tu entrevista consular. Selecciona tu perfil para personalizar tu
          experiencia.
        </p>

        <section className="cards-grid">
          {profiles.map((profile) => (
            <article
              key={profile.id}
              className={`profile-card ${
                selectedProfile === profile.id ? "selected" : ""
              }`}
              onClick={() => setSelectedProfile(profile.id)}
            >
              <div className="card-icon">{profile.icon}</div>

              <h3>{profile.title}</h3>
              <p>{profile.description}</p>

              <div className="card-footer">
                <span>Seleccionar</span>
                <span className="arrow">→</span>
              </div>

              {selectedProfile === profile.id && (
                <div className="selected-badge">✓ Seleccionado</div>
              )}
            </article>
          ))}
        </section>

        <div className="actions">
          <button
            className="save-button"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProfileSelection;