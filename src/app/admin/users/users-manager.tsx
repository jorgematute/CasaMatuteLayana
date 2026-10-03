'use client';

import { useEffect, useState, type FormEvent } from 'react';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  is_household_member: boolean;
  is_admin: boolean;
  created_at: string;
}

interface UserForm {
  email: string;
  fullName: string;
  password: string;
  isHouseholdMember: boolean;
  isAdmin: boolean;
}

const emptyForm: UserForm = { email: '', fullName: '', password: '', isHouseholdMember: true, isAdmin: false };

export default function UsersManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/users')
      .then(async (response) => {
        const result = await response.json() as { users?: ManagedUser[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? 'No se pudieron cargar las cuentas.');
        if (active) setUsers(result.users ?? []);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las cuentas.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleUsers = users.filter((user) => `${user.full_name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()));

  function startNewUser() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setNotice('');
  }

  function startEditing(user: ManagedUser) {
    setEditingId(user.id);
    setForm({
      email: user.email,
      fullName: user.full_name,
      password: '',
      isHouseholdMember: user.is_household_member,
      isAdmin: user.is_admin,
    });
    setError('');
    setNotice('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      const response = await fetch(editingId ? `/api/admin/users/${editingId}` : '/api/admin/users', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { user?: ManagedUser; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error ?? 'No se pudo guardar la cuenta.');

      setUsers((current) => editingId
        ? current.map((user) => user.id === editingId ? result.user! : user)
        : [result.user!, ...current]);
      setNotice(editingId ? 'Cuenta actualizada.' : 'Cuenta creada. Ya puede iniciar sesión.');
      setEditingId(null);
      setForm(emptyForm);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la cuenta.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="users-admin-content" aria-labelledby="users-admin-title">
      <div className="users-admin-heading">
        <div>
          <div className="eyebrow">Administración / acceso al hogar</div>
          <h1 id="users-admin-title">Cuentas.</h1>
          <p>Gestiona quién puede entrar y qué permisos tiene en Casa Matute Layana.</p>
        </div>
        <div className="users-admin-total"><strong>{users.length.toString().padStart(2, '0')}</strong><span>CUENTAS</span></div>
      </div>

      <div className="users-admin-layout">
        <section className="users-admin-list" aria-labelledby="users-list-title">
          <div className="users-admin-list-head">
            <div>
              <span className="mono users-admin-kicker">DIRECTORIO</span>
              <h2 id="users-list-title">Integrantes</h2>
            </div>
            <button className="users-admin-new" type="button" onClick={startNewUser}>+ Nueva cuenta</button>
          </div>

          <label className="users-admin-search-label" htmlFor="users-search">Buscar por nombre o correo</label>
          <input
            className="users-admin-search"
            id="users-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Escribe para filtrar..."
            type="search"
            value={search}
          />

          {isLoading ? <p className="users-admin-empty">Cargando cuentas...</p> : null}
          {!isLoading && visibleUsers.length === 0 ? <p className="users-admin-empty">{users.length ? 'No hay coincidencias.' : 'Todavía no hay cuentas registradas.'}</p> : null}
          <div className="users-admin-rows">
            {visibleUsers.map((user) => (
              <article className={`users-admin-row${editingId === user.id ? ' is-selected' : ''}`} key={user.id}>
                <div className="users-admin-avatar" aria-hidden="true">{(user.full_name || user.email).slice(0, 1).toUpperCase()}</div>
                <div className="users-admin-person">
                  <strong>{user.full_name || 'Sin nombre'}</strong>
                  <span>{user.email}</span>
                  <div className="users-admin-badges">
                    {user.is_admin && <span className="users-admin-badge admin">Administrador</span>}
                    {user.is_household_member
                      ? <span className="users-admin-badge member">Acceso al hogar</span>
                      : <span className="users-admin-badge paused">Sin acceso al presupuesto</span>}
                  </div>
                </div>
                <button className="users-admin-edit" type="button" onClick={() => startEditing(user)} aria-label={`Editar ${user.email}`}>Editar</button>
              </article>
            ))}
          </div>
        </section>

        <section className="users-admin-form-panel" aria-labelledby="users-form-title">
          <div className="mono users-admin-kicker">{editingId ? 'EDITAR PERFIL' : 'NUEVO ACCESO'}</div>
          <h2 id="users-form-title">{editingId ? 'Actualizar cuenta.' : 'Invitar a casa.'}</h2>
          <p className="users-admin-form-intro">{editingId ? 'Actualiza los datos y permisos de esta persona.' : 'Crea una cuenta confirmada para que pueda iniciar sesión.'}</p>

          <form className="users-admin-form" onSubmit={handleSubmit}>
            <div className="users-admin-field">
              <label htmlFor="account-name">Nombre</label>
              <input id="account-name" autoComplete="name" maxLength={100} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required value={form.fullName} />
            </div>
            <div className="users-admin-field">
              <label htmlFor="account-email">Correo electrónico</label>
              <input id="account-email" autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
            </div>
            <div className="users-admin-field">
              <label htmlFor="account-password">{editingId ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}</label>
              <input
                id="account-password"
                autoComplete="new-password"
                minLength={12}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required={!editingId}
                type="password"
                value={form.password}
              />
              <span className="users-admin-hint">{editingId ? 'Déjalo en blanco para conservar la actual.' : 'Usa al menos 12 caracteres.'}</span>
            </div>

            <fieldset className="users-admin-permissions">
              <legend>Permisos</legend>
              <label><input checked={form.isHouseholdMember} onChange={(event) => setForm({ ...form, isHouseholdMember: event.target.checked })} type="checkbox" /> Acceso al presupuesto del hogar</label>
              <label><input checked={form.isAdmin} onChange={(event) => setForm({ ...form, isAdmin: event.target.checked })} type="checkbox" /> Puede administrar cuentas</label>
            </fieldset>

            {error && <p className="users-admin-feedback error" role="alert">{error}</p>}
            {notice && <p className="users-admin-feedback success" role="status">{notice}</p>}

            <div className="users-admin-form-actions">
              {editingId && <button className="users-admin-cancel" onClick={startNewUser} type="button">Cancelar edición</button>}
              <button className="users-admin-save" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear cuenta'}</button>
            </div>
          </form>
          <div className="users-admin-security">Las contraseñas se gestionan de forma segura por Supabase Auth.</div>
        </section>
      </div>
    </section>
  );
}