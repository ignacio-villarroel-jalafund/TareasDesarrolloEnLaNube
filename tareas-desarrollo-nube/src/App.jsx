import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import AuthComponent from './components/AuthComponent';
import UserProfile from './components/UserProfile';
import Notification from './components/Notification';
import styles from './App.module.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ message: null, type: 'info' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCloseNotification = () => {
    setNotification({ message: null, type: 'info' });
  };

  if (loading) {
    return (
      <div className={styles.appContainer}>
        <div className={styles.loadingText}>Cargando...</div>
      </div>
    );
  }

  return (
    <main className={styles.appContainer}>
      <div className={styles.contentWrapper}>
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={handleCloseNotification}
        />
        {user ? (
          <UserProfile user={user} setNotification={setNotification} />
        ) : (
          <AuthComponent setNotification={setNotification} />
        )}
      </div>
      <footer className={styles.footer}>
        <p>App de Autenticación con React y Firebase.</p>
      </footer>
    </main>
  );
}

export default App;