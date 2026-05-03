import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  onProfileUpdated?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sincroniza valores quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setName(userName);
      setEmail(userEmail);
      setNewPassword('');
      setCurrentPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, userName, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validações
    if (!currentPassword) {
      setError('Você deve digitar sua senha atual para atualizar o perfil.');
      return;
    }

    if (name.trim() === '' && email.trim() === '' && !newPassword) {
      setError('Informe pelo menos um campo para atualizar.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const updateData: Record<string, string> = {
      currentPassword,
    };

    if (name.trim() !== userName) {
      updateData.name = name.trim();
    }

    if (email.trim() !== userEmail) {
      updateData.email = email.trim();
    }

    if (newPassword) {
      updateData.newPassword = newPassword;
    }

    console.log('Dados enviados:', {
      updateData,
      comparações: {
        'name mudou?': name.trim() !== userName,
        'email mudou?': email.trim() !== userEmail,
        'senha nova?': !!newPassword,
        nomeAnterior: userName,
        nomeNovo: name.trim(),
        emailAnterior: userEmail,
        emailNovo: email.trim(),
      }
    });

    setIsLoading(true);
    try {
      const response = await api.put('/api/auth/update-profile', updateData);

      const refreshedToken = response.data?.token;
      if (typeof refreshedToken === 'string' && refreshedToken.trim() !== '') {
        localStorage.setItem('token', refreshedToken);
      }

      setSuccessMsg('Perfil atualizado com sucesso!');
      
      // Reseta os campos
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');

      // Callback para atualizar dados do usuário na aplicação
      if (onProfileUpdated) {
        setTimeout(() => {
          onProfileUpdated();
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      const errorMsg = err.response?.data || err.message || 'Erro ao atualizar perfil.';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Error Message */}
          {error && (
            <div className="form-error">
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="form-success">
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nome
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              disabled={isLoading}
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>

          {/* Divider */}
          <div className="form-divider">
            <span>Alterar Senha (opcional)</span>
          </div>

          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              Nova Senha
            </label>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha (deixe em branco para não alterar)"
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password Field */}
          {newPassword && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Current Password Field (Required for all changes) */}
          <div className="form-group form-group-highlight">
            <label htmlFor="currentPassword" className="form-label">
              Sua Senha Atual <span className="form-required">*</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual para confirmar alterações"
              disabled={isLoading}
              required
            />
            <div className="form-hint">
              Você precisa digitar sua senha atual para confirmar as alterações.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
