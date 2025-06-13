import React, { useState, useEffect } from 'react';
import {
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  linkWithPopup,
} from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './UserProfile.module.css';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const UserProfile = ({ user, setNotification }) => {
  const [profile, setProfile] = useState({
    direccion: '',
    fechaNacimiento: '',
    edad: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const linkedProviders = user.providerData.map(p => p.providerId);

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob + "T00:00:00");
    if (isNaN(birthDate.getTime())) {
      return '';
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const age = calculateAge(data.fechaNacimiento);
          setProfile(prev => ({ ...prev, ...data, edad: age }));
        }
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        setNotification({ type: 'error', message: 'No se pudo cargar la información del perfil.' });
      }
    };

    if (user?.uid) {
        fetchUserProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    const userDocRef = doc(db, 'users', user.uid);
    
    const profileDataToSave = {
      direccion: profile.direccion || "",
      fechaNacimiento: profile.fechaNacimiento || "",
    };

    console.log("Datos a guardar en Firestore:", profileDataToSave);

    try {
      await setDoc(userDocRef, profileDataToSave, { merge: true });

      const age = calculateAge(profileDataToSave.fechaNacimiento);
      setProfile(prev => ({ ...prev, ...profileDataToSave, edad: age }));
      setIsEditing(false);
      setNotification({ type: 'success', message: '¡Perfil actualizado exitosamente!' });
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      setNotification({ type: 'error', message: `Error al actualizar: ${error.message}` });
    }
  };

  const handleLinkProvider = async (provider) => {
    try {
      await linkWithPopup(auth.currentUser, provider);
      setNotification({ type: 'success', message: '¡Cuenta vinculada exitosamente!' });
    } catch (error) {
      if (error.code === 'auth/credential-already-in-use') {
        setNotification({ type: 'error', message: 'Error: esta cuenta ya está asociada a otro usuario.' });
      } else {
        setNotification({ type: 'error', message: `Error al vincular: ${error.message}` });
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setNotification({ type: 'info', message: 'Has cerrado sesión.' });
  };


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email || 'U'}&background=random`}
          alt="Foto de perfil"
          className={styles.avatar}
        />
        <div className={styles.userInfo}>
          <h2>Bienvenido,</h2>
          <p>{user.displayName || user.email}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información Adicional</h3>
        {isEditing ? (
          <div className={styles.editProfileForm}>
            <div className={styles.formGroup}>
              <label htmlFor="direccion">Dirección</label>
              <input type="text" id="direccion" name="direccion" value={profile.direccion || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
              <input type="date" id="fechaNacimiento" name="fechaNacimiento" value={profile.fechaNacimiento || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            {profile.fechaNacimiento && <p><strong>Edad:</strong> {calculateAge(profile.fechaNacimiento)} años</p>}
            <button onClick={handleSaveProfile} className={styles.saveButton}>Guardar Cambios</button>
            <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>Cancelar</button>
          </div>
        ) : (
          <div>
            <p><strong>Dirección:</strong> {profile.direccion || 'No especificada'}</p>
            <p><strong>Fecha de Nacimiento:</strong> {profile.fechaNacimiento || 'No especificada'}</p>
            {profile.edad !== '' && <p><strong>Edad:</strong> {profile.edad} años</p>}
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>Editar Perfil</button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Proveedores de Cuenta Vinculados</h3>
        <ul className={styles.providerList}>
          {linkedProviders.map(providerId => (
            <li key={providerId} className={styles.providerItem}>
              {providerId === 'password' ? 'Email/Contraseña' : providerId.replace('.com', '')}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Vincular más cuentas</h3>
        <div className={styles.linkButtonsContainer}>
          {!linkedProviders.includes('google.com') && (
            <button onClick={() => handleLinkProvider(googleProvider)} className={styles.linkButton}>
              <img src="https://crystalpng.com/wp-content/uploads/2025/05/google-logo.png" alt="Google Logo" />
              Vincular con Google
            </button>
          )}
          {!linkedProviders.includes('facebook.com') && (
            <button onClick={() => handleLinkProvider(facebookProvider)} className={`${styles.linkButton} ${styles.facebookButton}`}>
              <svg fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
              Vincular con Facebook
            </button>
          )}
        </div>
      </div>

      <button onClick={handleLogout} className={styles.logoutButton}>
        Cerrar Sesión
      </button>
    </div>
  );
};

export default UserProfile;