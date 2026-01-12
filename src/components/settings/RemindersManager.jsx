import { useState, useEffect } from 'react';
import { Settings, Bell, Clock, Trash2, Plus } from 'lucide-react';
import './RemindersManager.css';

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const RemindersManager = () => {
    // const [permission, setPermission] = useState(Notification.permission); // Unused
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newTime, setNewTime] = useState('20:00'); // Default 8 PM
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        checkSubscription();
        loadReminders();
    }, []);

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setSubscribed(!!subscription);
        }
    };

    const loadReminders = async () => {
        try {
            const res = await fetch('/api/reminders', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReminders(data);
            }
        } catch (err) {
            console.error("Failed to load reminders", err);
        }
    };

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            // 1. Request Permission
            const perm = await Notification.requestPermission();
            // setPermission(perm);
            if (perm !== 'granted') throw new Error("Permission denied");

            // 2. Get Public Key
            const resKey = await fetch('/api/push/vapid-public-key', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!resKey.ok) throw new Error("Failed to get VAPID key");

            const { publicKey } = await resKey.json();
            const convertedVapidKey = urlBase64ToUint8Array(publicKey);

            // 3. Register Push
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            // 4. Send to Backend
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(subscription)
            });

            setSubscribed(true);
            // alert("Notifications enabled!"); 
        } catch (err) {
            console.error("Subscription failed:", err);
            alert("Failed to enable notifications. " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReminder = async () => {
        try {
            const res = await fetch('/api/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ time: newTime })
            });
            if (res.ok) {
                loadReminders();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteReminder = async (id) => {
        try {
            await fetch(`/api/reminders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            loadReminders();
        } catch (err) {
            console.error(err);
        }
    };

    const handleTestPush = async () => {
        await fetch('/api/push/test', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
    };

    return (
        <div className="reminders-manager p-6 bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-[var(--accent-500)]" />
                <h2 className="text-xl font-bold">Daily Reminders</h2>
            </div>

            <div className="mb-8">
                {!subscribed ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-[var(--text-muted)]">Enable push notifications to receive reminders on this device.</p>
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="btn btn-primary self-start"
                        >
                            {loading ? "Enabling..." : "Enable Notifications"}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Notifications Enabled
                        </div>
                        <button onClick={handleTestPush} className="text-sm text-[var(--accent-500)] hover:underline self-start">
                            Send Test Notification
                        </button>
                    </div>
                )}
            </div>

            {subscribed && (
                <div className="border-t border-[var(--border)] pt-6">
                    <h3 className="font-semibold mb-4">Your Reminders</h3>

                    <div className="space-y-3 mb-6">
                        {reminders.map(rem => (
                            <div key={rem.id} className="flex items-center justify-between p-3 bg-[var(--bg-app)] rounded-lg border border-[var(--border)]">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                                    <span className="font-mono text-lg">{rem.time}</span>
                                    <span className="text-xs text-[var(--text-muted)]">Daily</span>
                                </div>
                                <button onClick={() => handleDeleteReminder(rem.id)} className="p-2 text-red-500 hover:bg-red-50/10 rounded-full">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {reminders.length === 0 && (
                            <p className="text-sm text-[var(--text-muted)] italic">No reminders set.</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="p-2 bg-[var(--bg-app)] border border-[var(--border)] rounded-lg font-mono"
                        />
                        <button onClick={handleAddReminder} className="btn btn-outline flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Reminder
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemindersManager;
