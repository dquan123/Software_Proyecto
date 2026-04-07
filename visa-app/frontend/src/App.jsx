import { useState } from "react";

function App() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registro exitoso");
      } else {
        alert("Error: " + data.error);
      }

      console.log(data);

    } catch (err) {
      alert("Error de conexión");
      console.log(err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login exitoso ✅");
      } else {
        alert("Credenciales incorrectas ❌");
      }

      console.log(data);

    } catch (err) {
      alert("Error de conexión");
      console.log(err);
    }
  };

  return (
    <div>
      <h1>Visa App</h1>

      <input placeholder="Nombre" onChange={(e) => setNombre(e.target.value)} />
      <input placeholder="Correo" onChange={(e) => setCorreo(e.target.value)} />
      <input placeholder="Contraseña" onChange={(e) => setContrasena(e.target.value)} />

      <br /><br />

      <button onClick={handleRegister}>Registrar</button>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default App;