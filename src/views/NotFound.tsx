import { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    padding: '2rem',
    color: 'var(--text)'
  };

  const headingStyle: CSSProperties = {
    fontSize: '4rem',
    marginBottom: '1rem'
  };

  const paragraphStyle: CSSProperties = {
    fontSize: '1.5rem',
    marginBottom: '2rem'
  };

  const linkStyle: CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--primary)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: 'var(--radius)',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>404</h1>
      <p style={paragraphStyle}>Page not found</p>
      <Link to="/" style={linkStyle}>
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
