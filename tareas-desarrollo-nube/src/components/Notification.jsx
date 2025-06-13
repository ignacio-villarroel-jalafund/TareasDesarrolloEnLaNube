import styles from './Notification.module.css';

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;

  const notificationTypeClass = styles[type] || styles.info;

  return (
    <div className={`${styles.notification} ${notificationTypeClass}`}>
      <span>{message}</span>
      <button onClick={onClose} className={styles.closeButton}>X</button>
    </div>
  );
};

export default Notification;