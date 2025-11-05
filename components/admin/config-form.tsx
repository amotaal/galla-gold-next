// components/admin/config-form.tsx
// Purpose: Configuration Form - Edit system configuration values

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ConfigItem {
  key: string;
  value: any;
  dataType: string;
  displayName: string;
  description: string;
  unit?: string;
  defaultValue: any;
}

interface ConfigFormProps {
  config: ConfigItem;
  onSave: (key: string, value: any, reason: string) => Promise<void>;
  onReset: (key: string) => Promise<void>;
}

export function ConfigForm({ config, onSave, onReset }: ConfigFormProps) {
  const [value, setValue] = useState(config.value);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!reason || reason.length < 5) {
      toast.error("Please provide a reason (minimum 5 characters)");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(config.key, value, reason);
      toast.success("Configuration updated successfully");
      setReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset this configuration to default value?")) {
      try {
        await onReset(config.key);
        setValue(config.defaultValue);
        toast.success("Configuration reset to default");
      } catch (error: any) {
        toast.error(error.message || "Failed to reset configuration");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {config.displayName}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={config.key}>
            Value{" "}
            {config.unit && (
              <span className="text-muted-foreground">({config.unit})</span>
            )}
          </Label>
          <Input
            id={config.key}
            type={config.dataType === "number" ? "number" : "text"}
            value={value}
            onChange={(e) =>
              setValue(
                config.dataType === "number"
                  ? parseFloat(e.target.value)
                  : e.target.value
              )
            }
            step={config.dataType === "number" ? "0.01" : undefined}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Default: {config.defaultValue} {config.unit}
          </p>
        </div>

        <div>
          <Label htmlFor={`${config.key}-reason`}>Reason for Change *</Label>
          <Textarea
            id={`${config.key}-reason`}
            placeholder="Explain why you're changing this configuration..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || value === config.value}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ConfigForm;
