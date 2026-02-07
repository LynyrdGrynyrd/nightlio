import RemindersManager from '../components/settings/RemindersManager';
import ExportData from '../components/settings/ExportData';
import ImportData from '../components/settings/ImportData';
import ThemeSelector from '../components/settings/ThemeSelector';
import CustomizeMoods from '../components/settings/CustomizeMoods';
import ScaleManager from '../components/settings/ScaleManager';
import SecuritySettings from '../components/settings/SecuritySettings';
import { Settings } from 'lucide-react';

const SettingsView = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage app preferences and data</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <ThemeSelector />
        </section>

        <section>
          <CustomizeMoods />
        </section>

        <section>
          <ScaleManager />
        </section>

        <section>
          <RemindersManager />
        </section>

        <section>
          <SecuritySettings />
        </section>

        <section>
          <ExportData />
        </section>

        <section>
          <ImportData />
        </section>

        <section className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-2">Other Settings</h3>
          <p className="text-muted-foreground">Manage profile, appearance and privacy here (Coming soon).</p>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
