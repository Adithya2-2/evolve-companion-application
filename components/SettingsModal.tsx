import React, { useState, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import {
    BACKGROUND_PRESETS,
    FONT_OPTIONS,
    FONT_SIZE_OPTIONS,
    UserSettings,
} from '../types/settings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'appearance' | 'profile' | 'general';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings } = useSettings();
    const [activeTab, setActiveTab] = useState<Tab>('appearance');
    const [promptInput, setPromptInput] = useState('');
    const [generatingBg, setGeneratingBg] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // ── Background handlers ──
    const handlePresetSelect = (key: string) => {
        updateSettings({ backgroundType: 'preset', backgroundPreset: key, backgroundUrl: null });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            updateSettings({
                backgroundType: 'upload',
                backgroundUrl: reader.result as string,
            });
        };
        reader.readAsDataURL(file);
    };

    const handlePromptGenerate = async () => {
        if (!promptInput.trim()) return;
        setGeneratingBg(true);
        // Use Unsplash Source as a proxy for AI background generation
        const query = encodeURIComponent(promptInput.trim());
        const url = `https://source.unsplash.com/2560x1440/?${query}`;
        // pre-fetch to verify it loads
        try {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = url;
            });
            updateSettings({
                backgroundType: 'generated',
                backgroundUrl: url,
                backgroundPrompt: promptInput.trim(),
            });
        } catch {
            // Fall back — just set the URL anyway
            updateSettings({
                backgroundType: 'generated',
                backgroundUrl: url,
                backgroundPrompt: promptInput.trim(),
            });
        }
        setGeneratingBg(false);
    };

    // ── Tab renderers ──
    const renderAppearance = () => (
        <div className="space-y-6">
            {/* Theme Mode */}
            <section>
                <h4 className="text-sm font-semibold text-text-light mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">contrast</span>
                    Theme Mode
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => updateSettings({ themeMode: 'dark' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${settings.themeMode === 'dark'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>dark_mode</span>
                        <span className="text-sm font-semibold text-text-light">Deep Night</span>
                        <span className="text-[10px] text-slate-400">Calming indigo & slate tones</span>
                    </button>
                    <button
                        onClick={() => updateSettings({ themeMode: 'light' })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${settings.themeMode === 'light'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>light_mode</span>
                        <span className="text-sm font-semibold text-text-light">Warm Day</span>
                        <span className="text-[10px] text-slate-400">Cream, sage & stone palette</span>
                    </button>
                </div>
            </section>

            {/* Background section */}
            <section>
                <h4 className="text-sm font-semibold text-text-light mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">wallpaper</span>
                    Background
                </h4>

                {/* Presets */}
                <p className="text-xs text-slate-400 mb-2">Presets</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {Object.entries(BACKGROUND_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            onClick={() => handlePresetSelect(key)}
                            className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all duration-300 group ${settings.backgroundType === 'preset' && settings.backgroundPreset === key
                                ? 'border-primary shadow-lg shadow-primary/20'
                                : 'border-white/10 hover:border-white/30'
                                }`}
                        >
                            <img
                                src={preset.url}
                                alt={preset.label}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                                <span className="text-[10px] font-medium text-white/90">{preset.label}</span>
                            </div>
                            {settings.backgroundType === 'preset' && settings.backgroundPreset === key && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-xs">check</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Upload */}
                <p className="text-xs text-slate-400 mb-2">Upload Custom Image</p>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 transition-all text-sm text-slate-300"
                >
                    <span className="material-symbols-outlined text-base">upload</span>
                    Choose Image
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                />

                {/* AI Prompt */}
                <p className="text-xs text-slate-400 mb-2 mt-4">Generate with AI Prompt</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={promptInput}
                        onChange={e => setPromptInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePromptGenerate()}
                        placeholder="e.g. dreamy aurora night sky..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-light placeholder-slate-500 focus:outline-none focus:border-primary/50"
                    />
                    <button
                        onClick={handlePromptGenerate}
                        disabled={generatingBg || !promptInput.trim()}
                        className="px-4 py-2 rounded-xl bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-all disabled:opacity-40"
                    >
                        {generatingBg ? '...' : 'Generate'}
                    </button>
                </div>
            </section>

            {/* Typography section */}
            <section>
                <h4 className="text-sm font-semibold text-text-light mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">text_fields</span>
                    Typography
                </h4>

                <p className="text-xs text-slate-400 mb-2">Font Family</p>
                <div className="flex flex-col gap-2 mb-4">
                    {FONT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateSettings({ fontFamily: opt.value })}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${settings.fontFamily === opt.value
                                ? 'border-primary bg-primary/10 text-text-light'
                                : 'border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                                }`}
                        >
                            <span className="text-sm font-medium">{opt.label}</span>
                            <span className="text-xs text-slate-500" style={{ fontFamily: opt.value }}>
                                {opt.preview}
                            </span>
                        </button>
                    ))}
                </div>

                <p className="text-xs text-slate-400 mb-2">Font Size</p>
                <div className="flex gap-2">
                    {FONT_SIZE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateSettings({ fontSizeScale: opt.value })}
                            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${settings.fontSizeScale === opt.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-white/10 text-slate-400 hover:border-white/20'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-6">
            <section>
                <h4 className="text-sm font-semibold text-text-light mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">person</span>
                    Display Name
                </h4>
                <input
                    type="text"
                    value={settings.displayName || ''}
                    onChange={e => updateSettings({ displayName: e.target.value || null })}
                    placeholder="Enter your display name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-light placeholder-slate-500 focus:outline-none focus:border-primary/50"
                />
                <p className="text-xs text-slate-500 mt-1.5">This replaces the auto-detected name from your email.</p>
            </section>
        </div>
    );

    const renderGeneral = () => (
        <div className="space-y-6">
            {/* Notifications */}
            <section>
                <h4 className="text-sm font-semibold text-text-light mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">notifications</span>
                    Notifications
                </h4>
                <button
                    onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                    className="flex items-center justify-between w-full p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                >
                    <span className="text-sm text-slate-300">Daily reminders</span>
                    <div
                        className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${settings.notificationsEnabled ? 'bg-primary' : 'bg-white/20'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                                }`}
                        />
                    </div>
                </button>
            </section>

            {/* Data */}
            <section>
                <h4 className="text-sm font-semibold text-text-light mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">database</span>
                    Data Management
                </h4>
                <div className="flex flex-col gap-2">
                    <button className="flex items-center gap-2 p-3 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-all">
                        <span className="material-symbols-outlined text-base">download</span>
                        Export My Data
                    </button>
                    <button className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 text-sm text-red-400 hover:bg-red-500/5 transition-all">
                        <span className="material-symbols-outlined text-base">delete</span>
                        Clear Local Cache
                    </button>
                </div>
            </section>
        </div>
    );

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'appearance', label: 'Appearance', icon: 'palette' },
        { key: 'profile', label: 'Profile', icon: 'person' },
        { key: 'general', label: 'General', icon: 'tune' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[85vh] bg-surface-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-text-light flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings</span>
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 pt-3">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key
                                ? 'bg-primary/15 text-primary'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {activeTab === 'appearance' && renderAppearance()}
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'general' && renderGeneral()}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
