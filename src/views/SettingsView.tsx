import RemindersManager from '../components/settings/RemindersManager';
import ExportData from '../components/Settings/ExportData';
import ImportData from '../components/settings/ImportData';
import ThemeSelector from '../components/Settings/ThemeSelector';
import CustomizeMoods from '../components/Settings/CustomizeMoods';
import SecuritySettings from '../components/settings/SecuritySettings';
import { CSSProperties } from 'react';

// ========== Component ==========

const SettingsView = () => {
  const containerStyle: CSSProperties = {
    textAlign: 'left',
    paddingBottom: '3rem'
  };

  const titleStyle: CSSProperties = {
    marginTop: 0,
    color: 'var(--text)',
    marginBottom: '1.5rem'
  };

  const sectionStyle: CSSProperties = {
    marginBottom: '2rem'
  };

  const otherTitleStyle: CSSProperties = {
    fontSize: '1.1rem',
    marginBottom: '1rem'
  };

  const otherTextStyle: CSSProperties = {
    color: 'var(--text-muted)'
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Settings</h2>

      <section style={sectionStyle}>
        <ThemeSelector />
      </section>

      <section style={sectionStyle}>
        <CustomizeMoods />
      </section>

      <section style={sectionStyle}>
        <RemindersManager />
      </section>

      <section style={sectionStyle}>
        <SecuritySettings />
      </section>

      <section style={sectionStyle}>
        <ExportData />
      </section>

      <section style={sectionStyle}>
        <ImportData />
      </section>

      <section>
        <h3 style={otherTitleStyle}>Other Settings</h3>
        <p style={otherTextStyle}>Manage profile, appearance and privacy here (Coming soon).</p>
      </section>
    </div>
  );
};

export default SettingsView;
