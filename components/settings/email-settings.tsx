"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useOrganization } from "@/lib/context/organization";

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  email_enabled: boolean;
}

export function EmailSettings() {
  const { organizationId, organization, loading: orgLoading } = useOrganization();
  const [settings, setSettings] = useState<EmailSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_email: '',
    email_enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    console.log('Organization context:', { organizationId, organization, orgLoading });
    if (organizationId && !orgLoading) {
      fetchSettings();
    }
  }, [organizationId, orgLoading]);

  const fetchSettings = async () => {
    try {
      console.log('Fetching email settings for organizationId:', organizationId);
      
      if (!organizationId) {
        console.error('No organizationId available');
        setError('Organization not loaded. Please refresh the page.');
        return;
      }

      const response = await fetch(`/api/settings/email?organizationId=${organizationId}`);
      const data = await response.json();
      
      console.log('Email settings response:', data);
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        setError(data.error || 'Failed to fetch email settings');
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          smtpHost: settings.smtp_host,
          smtpPort: settings.smtp_port,
          smtpUsername: settings.smtp_username,
          smtpPassword: settings.smtp_password,
          smtpFromEmail: settings.smtp_from_email,
          emailEnabled: settings.email_enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Email settings saved successfully');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/settings/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Test email sent successfully! Check your inbox.');
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure SMTP settings for sending password reset emails and notifications
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {orgLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Loading organization settings...</AlertDescription>
          </Alert>
        )}

        {!orgLoading && !organizationId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No organization found. Please refresh the page or contact support.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {!orgLoading && organizationId && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Email</Label>
                <p className="text-sm text-muted-foreground">
                  Enable email functionality for password resets and notifications
                </p>
              </div>
              <Switch
                checked={settings.email_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_enabled: checked })
                }
              />
            </div>

            {settings.email_enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      placeholder="smtp.gmail.com"
                      value={settings.smtp_host}
                      onChange={(e) =>
                        setSettings({ ...settings, smtp_host: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">SMTP Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      placeholder="587"
                      value={settings.smtp_port}
                      onChange={(e) =>
                        setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_username">SMTP Username</Label>
                  <Input
                    id="smtp_username"
                    type="email"
                    placeholder="your-email@gmail.com"
                    value={settings.smtp_username}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_username: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="Your app password"
                    value={settings.smtp_password}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_password: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    For Gmail, use an App Password instead of your regular password
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_from_email">From Email</Label>
                  <Input
                    id="smtp_from_email"
                    type="email"
                    placeholder="noreply@yourcompany.com"
                    value={settings.smtp_from_email}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_from_email: e.target.value })
                    }
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Gmail Setup Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Enable 2-Factor Authentication on your Gmail account</li>
                    <li>Go to Google Account settings → Security → App passwords</li>
                    <li>Generate an app password for "Mail"</li>
                    <li>Use the generated 16-character password above</li>
                  </ol>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading || !organizationId}>
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
              
              {settings.email_enabled && (
                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={testing || !settings.smtp_host || !organizationId}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testing ? 'Sending...' : 'Send Test Email'}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}