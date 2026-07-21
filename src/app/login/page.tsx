"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Hexagon } from "lucide-react";

interface FormState {
  error?: string;
  firstTime?: boolean;
}

async function loginAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string | undefined;

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword: confirmPassword || undefined }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { error: errorData.error, firstTime: errorData.firstTime };
  }

  await response.json();

  // Redirect handled by router below via state
  return { firstTime: false };
}

export default function LoginPage() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await loginAction(prev, formData);
      if (!result.error) {
        router.push("/");
        return result;
      }
      // If server says first-time, show confirm field
      if (result.firstTime) setShowConfirm(true);
      return result;
    },
    {}
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Hexagon className={styles.logoIcon} size={32} />
          <span className={styles.logoText}>Olimpo</span>
        </div>
        <h1 className={styles.title}>
          {showConfirm ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
        <p className={styles.subtitle}>
          {showConfirm
            ? "Primera vez. Configure su usuario y contraseña."
            : "Ingrese sus credenciales para continuar."}
        </p>

        <form action={action} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Usuario
            </label>
            <input
              id="username"
              data-testid="username"
              name="username"
              type="text"
              className={styles.input}
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <input
              id="password"
              data-testid="password"
              name="password"
              type="password"
              className={styles.input}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={showConfirm ? "new-password" : "current-password"}
              required
            />
          </div>

          {showConfirm && (
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                data-testid="confirmPassword"
                name="confirmPassword"
                type="password"
                className={styles.input}
                placeholder="Repita la contraseña"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {state?.error && (
            <div className={styles.errorBox} role="alert">
              {state.error}
            </div>
          )}

          <button
            id="loginBtn"
            data-testid="loginBtn"
            type="submit"
            className={styles.submitBtn}
            disabled={pending}
          >
            {pending ? (
              <span className={styles.spinner} />
            ) : showConfirm ? (
              "Crear cuenta"
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
