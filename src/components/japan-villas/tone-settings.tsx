"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConciergeSettings {
  autoRespond: boolean;
  responseDelay: number;
  tonePresets: string[];
  activeTone: string;
  autoRespondToReviews: boolean;
  slackNotifications: boolean;
  customPrompt: string;
  properties: Array<{
    name: string;
    location: string;
    airbnbUrl?: string;
    checkIn: string;
    checkOut: string;
    beds24Id: string;
  }>;
}

const toneLabels: Record<string, string> = {
  "warm-professional": "Warm & Professional",
  "casual-friendly": "Casual & Friendly",
  "formal-luxury": "Formal & Luxury",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-violet-500" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}

interface ToneSettingsProps {
  settings: ConciergeSettings | undefined;
  loading: boolean;
  onSave: (settings: ConciergeSettings) => void;
}

export function ToneSettings({ settings, loading, onSave }: ToneSettingsProps) {
  const [local, setLocal] = useState<ConciergeSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !local) {
      setLocal(settings);
    }
  }, [settings, local]);

  if (loading || !local) {
    return (
      <div className="mt-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const update = (patch: Partial<ConciergeSettings>) => {
    setLocal((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!local) return;
    setSaving(true);
    await onSave(local);
    setSaving(false);
  };

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Response Tone</CardTitle>
          <CardDescription>
            Set the default tone for Lisa&apos;s guest responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(local.tonePresets || []).map((tone) => (
            <label key={tone} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="tone"
                checked={local.activeTone === tone}
                onChange={() => update({ activeTone: tone })}
                className="h-4 w-4 accent-violet-500"
              />
              <span className="text-sm">{toneLabels[tone] || tone}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response Tuning</CardTitle>
          <CardDescription>
            Custom instructions prepended to Lisa&apos;s responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={local.customPrompt}
            onChange={(e) => update({ customPrompt: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Response Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            checked={local.autoRespond}
            onChange={(v) => update({ autoRespond: v })}
            label="Auto-respond enabled"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Delay before auto-response (minutes)
            </span>
            <Input
              type="number"
              value={local.responseDelay}
              onChange={(e) =>
                update({ responseDelay: Number(e.target.value) })
              }
              className="h-8 w-20 text-sm"
              min={0}
            />
          </div>
          <Toggle
            checked={local.autoRespondToReviews ?? false}
            onChange={(v) => update({ autoRespondToReviews: v })}
            label="Auto-respond to reviews"
          />
          <Toggle
            checked={local.slackNotifications ?? true}
            onChange={(v) => update({ slackNotifications: v })}
            label="Send Slack notification on new message"
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-violet-600 hover:bg-violet-700"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
