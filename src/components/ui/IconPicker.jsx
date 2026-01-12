import {
    Activity,
    Gamepad2,
    BookOpen,
    Coffee,
    Dumbbell,
    Music,
    Briefcase,
    Users,
    Code,
    Utensils,
    Plane,
    Home,
    Sun,
    Moon,
    CloudRain,
    Heart,
    Smile,
    Zap,
    Tv,
    ShoppingBag,
    Car,
    Bike
} from 'lucide-react';

const ICON_LIST = [
    { name: 'Activity', component: Activity, label: 'Activity' },
    { name: 'Gamepad2', component: Gamepad2, label: 'Gaming' },
    { name: 'BookOpen', component: BookOpen, label: 'Reading' },
    { name: 'Coffee', component: Coffee, label: 'Coffee' },
    { name: 'Dumbbell', component: Dumbbell, label: 'Exercise' },
    { name: 'Music', component: Music, label: 'Music' },
    { name: 'Briefcase', component: Briefcase, label: 'Work' },
    { name: 'Users', component: Users, label: 'Social' },
    { name: 'Code', component: Code, label: 'Coding' },
    { name: 'Utensils', component: Utensils, label: 'Food' },
    { name: 'Plane', component: Plane, label: 'Travel' },
    { name: 'Home', component: Home, label: 'Home' },
    { name: 'Sun', component: Sun, label: 'Day' },
    { name: 'Moon', component: Moon, label: 'Night' },
    { name: 'CloudRain', component: CloudRain, label: 'Rain' },
    { name: 'Heart', component: Heart, label: 'Love' },
    { name: 'Smile', component: Smile, label: 'Happy' },
    { name: 'Zap', component: Zap, label: 'Energy' },
    { name: 'Tv', component: Tv, label: 'Movies/TV' },
    { name: 'ShoppingBag', component: ShoppingBag, label: 'Shopping' },
    { name: 'Car', component: Car, label: 'Drive' },
    { name: 'Bike', component: Bike, label: 'Cycling' }
];

const IconPicker = ({ onSelect, selectedIcon }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '0.5rem',
            padding: '0.5rem',
            maxHeight: '200px',
            overflowY: 'auto'
        }}>
            {ICON_LIST.map((item) => {
                const Icon = item.component;
                return (
                    <button
                        key={item.name}
                        type="button"
                        onClick={() => onSelect(item.name)}
                        title={item.label}
                        style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '40px',
                            height: '40px',
                            background: selectedIcon === item.name ? 'var(--accent-bg)' : 'var(--bg-card)',
                            color: selectedIcon === item.name ? 'white' : 'var(--text)',
                            border: selectedIcon === item.name ? 'none' : '1px solid var(--border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Icon size={20} />
                    </button>
                );
            })}
        </div>
    );
};

export const getIconComponent = (iconName) => {
    if (!iconName) return null;
    const icon = ICON_LIST.find(i => i.name === iconName);
    return icon ? icon.component : null;
};

export default IconPicker;
