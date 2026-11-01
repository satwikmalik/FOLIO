import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Field from '../../components/Field.jsx';
import Notice from '../../components/Notice.jsx';

export default function AccountSettings() {
  const { user, logout } = useAuth();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  // Delete account state
  const [confirmUsername, setConfirmUsername] = useState('');
  const [delError, setDelError] = useState('');
  const [delBusy, setDelBusy] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwBusy(true);
    setPwError('');
    setPwSuccess('');

    try {
      await api('/profile/password', {
        method: 'PUT',
        body: { currentPassword, newPassword },
      });
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  async function handleDeleteSubmit(e) {
    e.preventDefault();
    if (confirmUsername !== user.username) {
      setDelError('Username does not match.');
      return;
    }
    if (!window.confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
      return;
    }

    setDelBusy(true);
    setDelError('');

    try {
      await api('/profile/account', {
        method: 'DELETE',
        body: { username: confirmUsername },
      });
      logout();
    } catch (err) {
      setDelError(err.message);
      setDelBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Account settings</h1>
      </div>

      <section className="panel" style={{ maxWidth: '480px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>Change password</h2>
        {pwError && <Notice type="error">{pwError}</Notice>}
        {pwSuccess && <Notice>{pwSuccess}</Notice>}

        <form onSubmit={handlePasswordSubmit}>
          <Field
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            hint="At least 8 characters."
            required
          />
          <div className="actions">
            <button className="btn primary" disabled={pwBusy}>
              {pwBusy ? 'Updating…' : 'Change password'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel" style={{ maxWidth: '480px', borderColor: 'var(--soft)' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>Delete account</h2>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '14px' }}>
          Deleting your account is permanent. It removes your profile, all projects, skills, and messages.
        </p>
        {delError && <Notice type="error">{delError}</Notice>}

        <form onSubmit={handleDeleteSubmit}>
          <Field
            label={`Type "${user.username}" to confirm`}
            value={confirmUsername}
            onChange={(e) => setConfirmUsername(e.target.value)}
            placeholder={user.username}
            required
          />
          <div className="actions">
            <button
              className="btn"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              disabled={delBusy || confirmUsername !== user.username}
            >
              {delBusy ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
