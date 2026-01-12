import RemindersManager from '../components/settings/RemindersManager';
import ExportData from '../components/Settings/ExportData';
import ImportData from '../components/settings/ImportData';
import ThemeSelector from '../components/Settings/ThemeSelector';
import CustomizeMoods from '../components/Settings/CustomizeMoods';
import SecuritySettings from '../components/settings/SecuritySettings';

const SettingsView = () => {
  return (
    <div style={{ textAlign: 'left', paddingBottom: '3rem' }}>
      <h2 style={{ marginTop: 0, color: 'var(--text)', marginBottom: '1.5rem' }}>Settings</h2>

      <section style={{ marginBottom: '2rem' }}>
        <ThemeSelector />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <CustomizeMoods />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <RemindersManager />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <SecuritySettings />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <ExportData />
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <ImportData />
      </section>

      <section>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Other Settings</h3>
        <p style={{ color: 'var(--text-muted)' }}>Manage profile, appearance and privacy here (Coming soon).</p>
      </section>
    </div>
  );
};

export default SettingsView;
