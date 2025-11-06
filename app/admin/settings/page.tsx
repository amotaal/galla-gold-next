// /app/admin/settings/page.tsx
// System configuration management page for super admins

import { redirect } from "next/navigation";
import { getSession, requireSuperAdmin } from "@/server/auth/session";
import {
  getAllConfigs,
  getSystemConfigs,
  updateSystemConfig,
} from "@/server/actions/admin/config";
import { ConfigForm } from "@/components/admin/config-form";
import { AdminCard, AdminSection } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Shield,
  DollarSign,
  Percent,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
  Coins,
  ArrowUpDown,
  FileCheck,
  Bell,
} from "lucide-react";

export default async function SettingsPage() {
  // Only super admins can access this page
  let session;
  try {
    session = await requireSuperAdmin();
  } catch (error) {
    redirect("/admin");
  }

  const userId = session.user.id;

  // Fetch all system configurations
  const result = await getAllConfigs(userId);
  const configs = result.success ? result.data : {};

  // Group configs by category
  const configCategories = {
    fees: {
      title: "Transaction Fees",
      icon: Percent,
      description: "Configure platform fees for various transactions",
      configs: [
        {
          key: "GOLD_PURCHASE_FEE",
          label: "Gold Purchase Fee (%)",
          type: "number",
          min: 0,
          max: 10,
          step: 0.01,
        },
        {
          key: "GOLD_SALE_FEE",
          label: "Gold Sale Fee (%)",
          type: "number",
          min: 0,
          max: 10,
          step: 0.01,
        },
        {
          key: "DEPOSIT_FEE",
          label: "Deposit Fee (%)",
          type: "number",
          min: 0,
          max: 5,
          step: 0.01,
        },
        {
          key: "WITHDRAWAL_FEE",
          label: "Withdrawal Fee (%)",
          type: "number",
          min: 0,
          max: 5,
          step: 0.01,
        },
        {
          key: "MIN_WITHDRAWAL_FEE",
          label: "Minimum Withdrawal Fee ($)",
          type: "number",
          min: 0,
          max: 100,
          step: 1,
        },
      ],
    },
    limits: {
      title: "Transaction Limits",
      icon: ArrowUpDown,
      description: "Set minimum and maximum transaction amounts",
      configs: [
        {
          key: "MIN_DEPOSIT",
          label: "Minimum Deposit ($)",
          type: "number",
          min: 1,
          max: 1000,
          step: 1,
        },
        {
          key: "MAX_DEPOSIT",
          label: "Maximum Deposit ($)",
          type: "number",
          min: 100,
          max: 1000000,
          step: 100,
        },
        {
          key: "DAILY_DEPOSIT_LIMIT",
          label: "Daily Deposit Limit ($)",
          type: "number",
          min: 1000,
          max: 1000000,
          step: 1000,
        },
        {
          key: "MIN_GOLD_PURCHASE",
          label: "Min Gold Purchase (grams)",
          type: "number",
          min: 0.1,
          max: 10,
          step: 0.1,
        },
        {
          key: "MAX_GOLD_PURCHASE",
          label: "Max Gold Purchase (grams)",
          type: "number",
          min: 1,
          max: 10000,
          step: 1,
        },
        {
          key: "DAILY_TRANSACTION_LIMIT",
          label: "Daily Transaction Limit ($)",
          type: "number",
          min: 1000,
          max: 1000000,
          step: 1000,
        },
      ],
    },
    gold: {
      title: "Gold Settings",
      icon: Coins,
      description: "Configure gold pricing and markups",
      configs: [
        {
          key: "GOLD_PRICE_MARKUP",
          label: "Gold Price Markup (%)",
          type: "number",
          min: 0,
          max: 10,
          step: 0.01,
        },
        {
          key: "GOLD_PRICE_UPDATE_INTERVAL",
          label: "Price Update Interval (minutes)",
          type: "number",
          min: 1,
          max: 60,
          step: 1,
        },
        {
          key: "GOLD_STORAGE_FEE",
          label: "Annual Storage Fee (%)",
          type: "number",
          min: 0,
          max: 5,
          step: 0.01,
        },
        {
          key: "MIN_GOLD_BALANCE",
          label: "Min Gold Balance (grams)",
          type: "number",
          min: 0,
          max: 1,
          step: 0.01,
        },
      ],
    },
    kyc: {
      title: "KYC Settings",
      icon: FileCheck,
      description: "KYC verification requirements and limits",
      configs: [
        {
          key: "KYC_REQUIRED_AMOUNT",
          label: "KYC Required Above ($)",
          type: "number",
          min: 100,
          max: 100000,
          step: 100,
        },
        {
          key: "KYC_EXPIRY_DAYS",
          label: "KYC Expiry (days)",
          type: "number",
          min: 30,
          max: 730,
          step: 30,
        },
        { key: "KYC_AUTO_APPROVE", label: "Auto-Approve KYC", type: "boolean" },
        {
          key: "KYC_DOCUMENT_MAX_SIZE",
          label: "Max Document Size (MB)",
          type: "number",
          min: 1,
          max: 20,
          step: 1,
        },
      ],
    },
    system: {
      title: "System Settings",
      icon: Settings,
      description: "General system configuration",
      configs: [
        { key: "MAINTENANCE_MODE", label: "Maintenance Mode", type: "boolean" },
        {
          key: "NEW_REGISTRATIONS",
          label: "Allow New Registrations",
          type: "boolean",
        },
        {
          key: "EMAIL_NOTIFICATIONS",
          label: "Email Notifications",
          type: "boolean",
        },
        {
          key: "SMS_NOTIFICATIONS",
          label: "SMS Notifications",
          type: "boolean",
        },
        {
          key: "SESSION_TIMEOUT",
          label: "Session Timeout (minutes)",
          type: "number",
          min: 5,
          max: 1440,
          step: 5,
        },
        {
          key: "MAX_LOGIN_ATTEMPTS",
          label: "Max Login Attempts",
          type: "number",
          min: 3,
          max: 10,
          step: 1,
        },
      ],
    },
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-amber-500">
              System Settings
            </h1>
            <p className="text-zinc-400 mt-2">
              Configure platform settings and parameters
            </p>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-0">
            <Shield className="w-3 h-3 mr-1" />
            Super Admin Only
          </Badge>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-400">Important Notice</p>
            <p className="text-sm text-zinc-400 mt-1">
              Changes to system settings take effect immediately and affect all
              users. Please review changes carefully before saving. All changes
              are logged in the audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-6">
        {Object.entries(configCategories).map(([category, categoryData]) => {
          const Icon = categoryData.icon;

          return (
            <AdminCard
              key={category}
              title={
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-amber-400" />
                  <span>{categoryData.title}</span>
                </div>
              }
            >
              <p className="text-sm text-zinc-400 mb-6">
                {categoryData.description}
              </p>

              <form className="space-y-4">
                {categoryData.configs.map((config) => (
                  <ConfigForm
                    key={config.key}
                    config={{
                      key: config.key,
                      value: config.value,
                      type: config.type,
                    }}
                    label={config.label}
                    type={config.type as "number" | "boolean" | "string"}
                    value={configs[config.key]}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onSave={async (value) => {
                      "use server";
                      await updateSystemConfig(userId, {
                        key: config.key,
                        value,
                        category,
                      });
                    }}
                  />
                ))}
              </form>
            </AdminCard>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Reset to Defaults
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Restore factory settings
              </p>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Export Configuration
              </p>
              <p className="text-xs text-zinc-400 mt-1">Download as JSON</p>
            </div>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                View Change History
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                See all modifications
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4" />
            </Button>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
