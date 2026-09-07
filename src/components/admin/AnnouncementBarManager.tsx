"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AnnouncementBarConfig } from "@/types/announcement";
import {
  DEFAULT_ANNOUNCEMENT_CONFIG,
  DEFAULT_ANNOUNCEMENT_MESSAGES,
} from "@/data/default-announcements";

const QUICK_PRESETS = [
  "Express Nationwide Dispatch — 1 to 3 Working Days Across All 36 States",
  "Fìlà Yorùbá — Handcrafted for Thoroughbred Gentlemen",
  "Imperial Artisanship — Master Embroidered Velvet, Aso-Oke & Sányán Silk",
  "Complimentary Luxury Gift Packaging Included On All Royal Orders",
  "Limited Heritage Drop — Handcrafted in Small Artisan Batches",
  "Free Premium Dust Bag & Heritage Care Guide Included",
  "Bespoke Artisanal Sizing Available — Contact Our Royal Concierge",
];

const SPEED_PRESETS = [
  { label: "Fast", seconds: 16, desc: "Quick & energetic" },
  { label: "Normal (Recommended)", seconds: 25, desc: "Optimal reading cadence" },
  { label: "Gentle", seconds: 35, desc: "Calm & relaxed pace" },
  { label: "Deliberate", seconds: 48, desc: "For longer notices" },
];

export default function AnnouncementBarManager() {
  const [config, setConfig] = useState<AnnouncementBarConfig>(DEFAULT_ANNOUNCEMENT_CONFIG);
  const [initialConfig, setInitialConfig] = useState<AnnouncementBarConfig>(DEFAULT_ANNOUNCEMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current config on mount
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/announcement");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.config) {
        setConfig(data.config);
        setInitialConfig(data.config);
        setHasChanges(false);
      } else {
        toast.error("Failed to load announcement bar settings");
      }
    } catch (err) {
      console.error("fetchConfig error:", err);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Track unsaved changes
  const markChanged = (newConfig: AnnouncementBarConfig) => {
    setConfig(newConfig);
    const changed =
      newConfig.isEnabled !== initialConfig.isEnabled ||
      newConfig.speed !== initialConfig.speed ||
      JSON.stringify(newConfig.messages) !== JSON.stringify(initialConfig.messages);
    setHasChanges(changed);
  };

  // Toggle Enabled
  const handleToggleEnabled = () => {
    markChanged({
      ...config,
      isEnabled: !config.isEnabled,
    });
  };

  // Update Speed
  const handleSetSpeed = (seconds: number) => {
    markChanged({
      ...config,
      speed: seconds,
    });
  };

  // Message Text Change
  const handleMessageChange = (index: number, text: string) => {
    const updatedMessages = [...config.messages];
    updatedMessages[index] = text;
    markChanged({
      ...config,
      messages: updatedMessages,
    });
  };

  // Add Message
  const handleAddMessage = (text = "") => {
    const newMsg = text.trim() || "New Royal Store Announcement";
    markChanged({
      ...config,
      messages: [...config.messages, newMsg],
    });
  };

  // Remove Message
  const handleRemoveMessage = (index: number) => {
    if (config.messages.length <= 1) {
      toast.error("At least one message is required in the announcement bar.");
      return;
    }
    const updated = config.messages.filter((_, idx) => idx !== index);
    markChanged({
      ...config,
      messages: updated,
    });
  };

  // Move Message Up / Down
  const handleMoveMessage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.messages.length) return;

    const updated = [...config.messages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    markChanged({
      ...config,
      messages: updated,
    });
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    markChanged({
      id: "default",
      isEnabled: true,
      speed: 25,
      messages: [...DEFAULT_ANNOUNCEMENT_MESSAGES],
    });
    toast.info("Reset to default Yoruba luxury messages. Click Save to apply.");
  };

  // Save Config to Server
  const handleSave = async () => {
    const cleanedMessages = config.messages
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    if (cleanedMessages.length === 0) {
      toast.error("You must have at least one non-empty announcement message.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: config.isEnabled,
          speed: config.speed,
          messages: cleanedMessages,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.config) {
        setConfig(data.config);
        setInitialConfig(data.config);
        setHasChanges(false);
        toast.success("Top Announcement Bar updated!", {
          description: "Changes are now live across the storefront.",
        });
      } else {
        toast.error(data.message || "Failed to update announcement bar.");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Preview ticker items
  const previewItems =
    config.messages.length > 0
      ? [...config.messages, ...config.messages]
      : ["No active announcements"];

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-10 h-10 border-3 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Announcement Bar configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Live Simulator Preview Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FED501] animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              Live Storefront Ticker Simulator
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#000000] text-[#FED501]">
              {config.isEnabled ? "LIVE" : "DISABLED"}
            </span>
          </div>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Hover ticker to test pause effect
          </span>
        </div>

        {/* The Live Interactive Ticker Preview */}
        <div className="p-4 sm:p-6 bg-slate-100/70">
          <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-md border border-black/10">
            <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="ml-2 font-mono text-[10px] text-slate-300">filayoruba.ng/store</span>
              </div>
              <span className="text-[10px] font-mono text-[#FED501]">
                Speed: {config.speed}s / loop
              </span>
            </div>

            {config.isEnabled ? (
              <div
                className="relative bg-[#000000] text-white text-[11px] sm:text-xs font-medium py-2.5 border-b border-white/10 overflow-hidden select-none cursor-default"
                title="Hover to pause animation"
              >
                {/* Edge Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#000000] via-[#000000]/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#000000] via-[#000000]/80 to-transparent z-10 pointer-events-none" />

                {/* Animated Marquee Strip */}
                <div className="marquee-wrapper flex overflow-hidden w-full">
                  <div
                    className="animate-marquee flex items-center shrink-0 whitespace-nowrap"
                    style={
                      {
                        "--marquee-duration": `${config.speed}s`,
                      } as React.CSSProperties
                    }
                  >
                    {previewItems.map((msg, idx) => (
                      <div key={`preview-${idx}`} className="inline-flex items-center shrink-0">
                        <span className="text-white/95 tracking-wide px-4 font-medium">
                          {msg}
                        </span>
                        <span className="inline-flex items-center text-[#FED501] opacity-90 mx-3 shrink-0">
                          <Sparkles className="w-3 h-3 text-[#FED501]" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 py-3 text-center text-xs text-slate-400 font-mono">
                [ Announcement Bar is currently DISABLED — Bar will not appear on storefront ]
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Messages Manager (2 cols on large) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Announcement Messages ({config.messages.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Messages scroll continuously in an infinite loop from right to left.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddMessage("")}
                className="px-3.5 py-1.5 bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FED501]" />
                <span>Add Message</span>
              </button>
            </div>

            {/* Message Inputs List */}
            <div className="space-y-3">
              {config.messages.map((message, index) => (
                <div
                  key={`msg-input-${index}`}
                  className="group p-3 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-start gap-3"
                >
                  {/* Sequence Badge */}
                  <span className="w-6 h-6 rounded-lg bg-[#000000] text-[#FED501] text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-1">
                    {index + 1}
                  </span>

                  {/* Input Field */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => handleMessageChange(index, e.target.value)}
                      placeholder="e.g. Express Nationwide Dispatch (1–3 Days Across Nigeria)"
                      className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#FED501] focus:border-transparent font-medium"
                      maxLength={140}
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
                      <span>Separate statements with dashes or dots for readability</span>
                      <span className="font-mono">{message.length}/140 chars</span>
                    </div>
                  </div>

                  {/* Move Up/Down/Delete Actions */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveMessage(index, "up")}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Up in sequence"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === config.messages.length - 1}
                      onClick={() => handleMoveMessage(index, "down")}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Down in sequence"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={config.messages.length <= 1}
                      onClick={() => handleRemoveMessage(index)}
                      className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets Drawer */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FED501]" />
                <span>One-Click Luxury Preset Suggestions</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Click any pre-written luxury statement below to instantly append it to your announcement rotation:
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset, pIdx) => (
                  <button
                    key={`preset-${pIdx}`}
                    type="button"
                    onClick={() => handleAddMessage(preset)}
                    className="text-left text-xs bg-slate-100 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-900 border border-slate-200/80 rounded-lg px-3 py-1.5 transition-all text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-[#FED501] shrink-0" />
                    <span className="truncate max-w-xs">{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Cadence */}
        <div className="space-y-6">
          {/* Master Display Switch */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Visibility Status
            </h3>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                {config.isEnabled ? (
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                    <EyeOff className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {config.isEnabled ? "Storefront Active" : "Storefront Hidden"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {config.isEnabled
                      ? "Visible across all storefront pages"
                      : "Hidden from customer view"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                  config.isEnabled ? "bg-[#000000]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.isEnabled ? "translate-x-6 bg-[#FED501]" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sliding Speed & Duration */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FED501]" />
                <span>Sliding Speed</span>
              </h3>
              <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                {config.speed}s cycle
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Controls the time in seconds taken for the announcement ticker to complete a full slide cycle.
            </p>

            {/* Speed Presets */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SPEED_PRESETS.map((preset) => {
                const isSelected = config.speed === preset.seconds;
                return (
                  <button
                    key={`speed-preset-${preset.seconds}`}
                    type="button"
                    onClick={() => handleSetSpeed(preset.seconds)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#000000] bg-[#000000] text-white shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{preset.label}</span>
                      <span className={isSelected ? "text-[#FED501]" : "text-slate-400"}>
                        {preset.seconds}s
                      </span>
                    </div>
                    <span
                      className={`text-[10px] block mt-0.5 ${
                        isSelected ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fine-Tuning Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Faster (10s)</span>
                <span>Slower (60s)</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="1"
                value={config.speed}
                onChange={(e) => handleSetSpeed(parseInt(e.target.value, 10))}
                className="w-full accent-[#000000] cursor-pointer"
              />
            </div>
          </div>

          {/* Action Bar (Save / Reset) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                hasChanges
                  ? "bg-[#000000] text-white hover:bg-[#1A1A1A] ring-2 ring-[#FED501]"
                  : "bg-[#000000] text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <Save className={`w-4 h-4 text-[#FED501] ${saving ? "animate-spin" : ""}`} />
              <span>{saving ? "Saving Changes..." : hasChanges ? "Save Changes (Unsaved)" : "Save Settings"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
