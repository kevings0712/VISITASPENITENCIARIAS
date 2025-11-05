import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

type User = {
    id: string;
    name: string;
    last_name: string;
    email: string;
    role: string;
    national_id: string | null;
    phone: string | null;
    address: string | null;
    birth_date: string | null;
    notify_email: boolean;
    avatar_url: string | null;
};

export default function ProfilePage() {
    const nav = useNavigate();

    const [me, setMe] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState<string | null>(null);

    // Solo dejaremos editables: phone y address (el resto se bloquea en el UI)
    const [form, setForm] = useState<Omit<User, "id" | "role">>({
        name: "",
        last_name: "",
        email: "",
        national_id: "",
        phone: "",
        address: "",
        birth_date: "",
        notify_email: true,
        avatar_url: null,
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    // cambio de contraseña (con ojo)
    const [showPwd1, setShowPwd1] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);
    const [showPwd3, setShowPwd3] = useState(false);
    const [pwdCurrent, setPwdCurrent] = useState("");
    const [pwdNew, setPwdNew] = useState("");
    const [pwdRepeat, setPwdRepeat] = useState("");
    const [pwdBusy, setPwdBusy] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<string | null>(null);
    const [pwdErr, setPwdErr] = useState<string | null>(null);

    useEffect(() => {
        document.body.classList.add("no-top-accent");
        const root = document.getElementById("root");
        root?.classList.add("no-top-accent");

        return () => {
            document.body.classList.remove("no-top-accent");
            root?.classList.remove("no-top-accent");
        };
    }, []);

    useEffect(() => {
  const style = document.createElement("style");
  style.textContent = `
    body::before, .app-light::before, #root::before { display:none !important; content:none !important; }
  `;
  document.head.appendChild(style);
  return () => { document.head.removeChild(style); };
}, []);



    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                setLoading(true);
                setLoadErr(null);
                const res = await api.get<{ ok: boolean; user: User }>("/auth/me");
                if (cancel) return;
                const u = res.user;
                setMe(u);
                setForm({
                    name: u.name || "",
                    last_name: u.last_name || "",
                    email: u.email || "",
                    national_id: u.national_id || "",
                    phone: u.phone || "",
                    address: u.address || "",
                    birth_date: u.birth_date ? u.birth_date.slice(0, 10) : "",
                    notify_email: !!u.notify_email,
                    avatar_url: u.avatar_url || null,
                });
                setAvatarPreview(u.avatar_url || null);
            } catch (e: any) {
                if (!cancel) setLoadErr(e?.message ?? "Error cargando perfil");
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => {
            cancel = true;
        };
    }, []);

    function onChange<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
        setForm((f) => ({ ...f, [key]: val }));
        setSaveErr(null);
        setSaveMsg(null);
    }

    async function onSaveProfile(e: React.FormEvent) {
        e.preventDefault();
        setSaveErr(null);
        setSaveMsg(null);

        // Solo validamos lo editable
        if (form.phone && !/^\d{10}$/.test(form.phone)) {
            setSaveErr("El teléfono debe tener 10 dígitos.");
            return;
        }

        if (!window.confirm("¿Confirmas que deseas guardar los cambios de tu perfil?")) return;

        try {
            setSaving(true);
            const payload = {
                phone: form.phone || null,
                address: form.address || null,
                avatar_url: avatarPreview ?? form.avatar_url ?? null,
                notify_email: !!form.notify_email,
            };
            const res = await api.patch<{ ok: boolean; user: User }>("/auth/me", payload);

            setMe(res.user);
            setForm({
                name: res.user.name || "",
                last_name: res.user.last_name || "",
                email: res.user.email || "",
                national_id: res.user.national_id || "",
                phone: res.user.phone || "",
                address: res.user.address || "",
                birth_date: res.user.birth_date ? res.user.birth_date.slice(0, 10) : "",
                notify_email: !!res.user.notify_email,
                avatar_url: res.user.avatar_url || null,
            });
            setAvatarPreview(res.user.avatar_url || null);

            localStorage.setItem("user", JSON.stringify(res.user));
            localStorage.setItem("user_name", `${res.user.name} ${res.user.last_name}`.trim());

            setSaveMsg("Perfil actualizado correctamente.");
        } catch (e: any) {
            setSaveErr(e?.message ?? "No se pudo actualizar el perfil");
        } finally {
            setSaving(false);
        }
    }

    function onPickAvatar(file: File | null) {
        if (!file) return;
        if (!window.confirm("¿Deseas cambiar tu foto de perfil?")) return;
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(String(reader.result));
        reader.readAsDataURL(file);
    }

    function onRemoveAvatar() {
        if (!avatarPreview && !form.avatar_url) return;
        if (!window.confirm("¿Deseas quitar tu foto de perfil?")) return;
        setAvatarPreview(null);
    }

    async function onChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setPwdErr(null);
        setPwdMsg(null);

        if (!pwdCurrent || !pwdNew) {
            setPwdErr("Completa los campos de contraseña.");
            return;
        }
        if (pwdNew.length < 8) {
            setPwdErr("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (pwdNew !== pwdRepeat) {
            setPwdErr("La confirmación no coincide.");
            return;
        }

        if (!window.confirm("¿Confirmas que deseas cambiar tu contraseña?")) return;

        try {
            setPwdBusy(true);
            await api.post<{ ok: boolean; message: string }>("/auth/change-password", {
                current_password: pwdCurrent,
                new_password: pwdNew,
            });
            setPwdMsg("Contraseña actualizada.");
            setPwdCurrent("");
            setPwdNew("");
            setPwdRepeat("");
        } catch (e: any) {
            setPwdErr(e?.message ?? "No se pudo cambiar la contraseña");
        } finally {
            setPwdBusy(false);
        }
    }

    if (loading)
        return (
            <div className="app-light no-top-accent">
                <div className="container">
                    <p>Cargando…</p>
                </div>
            </div>
        );
    if (loadErr)
        return (
            <div className="app-light no-top-accent">
                <div className="container">
                    <p style={{ color: "#b91c1c" }}>{loadErr}</p>
                </div>
            </div>
        );

    return (
        <div className="app-light no-top-accent">
            <div className="container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0 6px 0" }}>
                    <h1 className="h1">Mi perfil</h1>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-outline" onClick={() => nav("/dashboard")}>
                            Volver
                        </button>
                        <button
                            className="btn-outline"
                            onClick={() => {
                                localStorage.removeItem("token");
                                window.location.href = "/login";
                            }}
                        >
                            Salir
                        </button>
                    </div>
                </div>

                {/* Datos personales */}
                <section className="card-light">
                    <h2 style={{ marginTop: 0 }}>Datos personales</h2>

                    {/* Avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        <div
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: "50%",
                                background: "#e2e8f0",
                                overflow: "hidden",
                                display: "grid",
                                placeItems: "center",
                                fontWeight: 700,
                                color: "#334155",
                            }}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span>
                                    {(form.name || "U")[0]}
                                    {(form.last_name || "").charAt(0)}
                                </span>
                            )}
                        </div>

                        <label className="btn-outline" style={{ cursor: "pointer" }}>
                            Cambiar foto
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                            />
                        </label>
                        {(avatarPreview || form.avatar_url) && (
                            <button type="button" className="btn-outline" onClick={onRemoveAvatar}>
                                Quitar
                            </button>
                        )}
                    </div>

                    <form className="row" onSubmit={onSaveProfile}>
                        <label>
                            Nombre *
                            <input className="input-light" value={form.name} disabled />
                        </label>
                        <label>
                            Apellido *
                            <input className="input-light" value={form.last_name} disabled />
                        </label>

                        <label>
                            Correo *
                            <input className="input-light" type="email" value={form.email} disabled />
                        </label>
                        <label>
                            Cédula
                            <input className="input-light" value={form.national_id ?? ""} disabled />
                        </label>

                        <label>
                            Teléfono
                            <input
                                className="input-light"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={10}
                                value={form.phone ?? ""}
                                onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, ""))}
                            />
                        </label>
                        <label>
                            Fecha de nacimiento
                            <input className="input-light" type="date" value={form.birth_date ?? ""} disabled />
                        </label>

                        <label className="vc-col-span-2">
                            Dirección
                            <input className="input-light" value={form.address ?? ""} onChange={(e) => onChange("address", e.target.value)} />
                        </label>

                        <label className="vc-col-span-2" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                                type="checkbox"
                                checked={!!form.notify_email}
                                onChange={(e) => onChange("notify_email", e.target.checked)}
                            />
                            Recibir notificaciones por correo
                        </label>


                        {saveErr && <p style={{ color: "#b91c1c" }}>{saveErr}</p>}
                        {saveMsg && <p style={{ color: "#16a34a" }}>{saveMsg}</p>}

                        <div style={{ marginTop: 10 }}>
                            <button className="btn" disabled={saving}>
                                {saving ? "Guardando…" : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Cambiar contraseña */}
                <section className="card-light">
                    <h2 style={{ marginTop: 0 }}>Cambiar contraseña</h2>
                    <form className="row" onSubmit={onChangePassword}>
                        <label>
                            Contraseña actual
                            <div className="input-wrap">
                                <input
                                    className="input has-toggle"
                                    type={showPwd1 ? "text" : "password"}
                                    value={pwdCurrent}
                                    autoComplete="current-password"
                                    onChange={(e) => setPwdCurrent(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="eye-btn"
                                    aria-label={showPwd1 ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    title={showPwd1 ? "Ocultar" : "Mostrar"}
                                    onClick={() => setShowPwd1((v) => !v)}
                                >
                                    {showPwd1 ? eyeOffSvg : eyeOnSvg}
                                </button>
                            </div>
                        </label>

                        <label>
                            Nueva contraseña
                            <div className="input-wrap">
                                <input
                                    className="input has-toggle"
                                    type={showPwd2 ? "text" : "password"}
                                    value={pwdNew}
                                    placeholder="Mínimo 8 caracteres"
                                    onChange={(e) => setPwdNew(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="eye-btn"
                                    aria-label={showPwd2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    title={showPwd2 ? "Ocultar" : "Mostrar"}
                                    onClick={() => setShowPwd2((v) => !v)}
                                >
                                    {showPwd2 ? eyeOffSvg : eyeOnSvg}
                                </button>
                            </div>
                        </label>

                        <label>
                            Repetir nueva contraseña
                            <div className="input-wrap">
                                <input
                                    className="input has-toggle"
                                    type={showPwd3 ? "text" : "password"}
                                    value={pwdRepeat}
                                    onChange={(e) => setPwdRepeat(e.target.value)}
                                    placeholder="Repita su nueva contraseña"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="eye-btn"
                                    aria-label={showPwd3 ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    title={showPwd3 ? "Ocultar" : "Mostrar"}
                                    onClick={() => setShowPwd3(v => !v)}
                                >
                                    {showPwd3 ? eyeOffSvg : eyeOnSvg}
                                </button>
                            </div>
                        </label>


                        <div className="vc-col-span-2">
                            {pwdErr && <p style={{ color: "#b91c1c" }}>{pwdErr}</p>}
                            {pwdMsg && <p style={{ color: "#16a34a" }}>{pwdMsg}</p>}
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <button className="btn" disabled={pwdBusy}>
                                {pwdBusy ? "Actualizando…" : "Actualizar contraseña"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}

/* ------- SVGs del ojo (mismos del login) ------- */
const eyeOnSvg = (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const eyeOffSvg = (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 3l18 18" />
        <path d="M1 12s4-7 11-7a11 11 0 0 1 6 2" />
        <path d="M21 16a11 11 0 0 1-9 3c-7 0-11-7-11-7" />
    </svg>
);
