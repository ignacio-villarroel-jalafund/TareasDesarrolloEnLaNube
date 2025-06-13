import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import styles from './AuthComponent.module.css';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const AuthComponent = ({ setNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        direccion: "",
        fechaNacimiento: "",
      });
      setNotification({ type: 'success', message: '¡Usuario registrado exitosamente!' });
    } catch (error) {
      setNotification({ type: 'error', message: `Error al registrar: ${error.message}` });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setNotification({ type: 'success', message: '¡Inicio de sesión exitoso!' });
    } catch (error) {
      setNotification({ type: 'error', message: `Error al iniciar sesión: ${error.message}` });
    }
  };

  const handleProviderLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          direccion: "",
          fechaNacimiento: "",
        });
      }
      setNotification({ type: 'success', message: '¡Inicio de sesión con proveedor exitoso!' });
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData.email;
        const methods = await fetchSignInMethodsForEmail(auth, email);
        setNotification({ type: 'error', message: `Ya existe una cuenta con este email. Inicia sesión con ${methods.join(", ")} para vincular.` });
      } else {
        setNotification({ type: 'error', message: `Error: ${error.message}` });
      }
    }
  };


  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {isRegistering ? 'Crear una cuenta' : 'Iniciar Sesión'}
      </h2>
      <form onSubmit={isRegistering ? handleRegister : handleLogin} className={styles.form}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
            minLength="6"
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
        </button>
      </form>
      <div className={styles.toggleAuth}>
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
      <div className={styles.divider}>O continuar con</div>
      <div className={styles.providerButtons}>
        <button onClick={() => handleProviderLogin(googleProvider)} className={styles.providerButton}>
          <img src="https://crystalpng.com/wp-content/uploads/2025/05/google-logo.png" alt="Google Logo" />
          Google
        </button>
        <button onClick={() => handleProviderLogin(facebookProvider)} className={`${styles.providerButton} ${styles.facebookButton}`}>
          <svg fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
          Facebook
        </button>
      </div>
    </div>
  );
};

export default AuthComponent;