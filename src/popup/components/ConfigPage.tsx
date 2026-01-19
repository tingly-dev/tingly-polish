import { useState, useEffect } from 'react';
import type { Config } from '../../domain/types';
import { DEFAULT_CONFIG } from '../../domain/types';
import {
  getConfig,
  updateConfig,
  resetConfig,
} from '../lib/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';

export function ConfigPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getConfig();
      setConfig(data);
    } catch (error) {
      showMessage('error', 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(config);
      showMessage('success', 'Configuration saved successfully');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default configuration?')) return;

    setSaving(true);
    try {
      const defaultConfig = await resetConfig();
      setConfig(defaultConfig);
      showMessage('success', 'Configuration reset to defaults');
    } catch (error) {
      showMessage('error', 'Failed to reset configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Config>(field: K, value: Config[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure your LLM API settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => updateField('apiKey', e.target.value)}
              placeholder="Enter your API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={config.baseUrl}
              onChange={(e) => updateField('baseUrl', e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={config.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="gpt-4o-mini"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useMock"
              checked={config.useMock}
              onChange={(e) => updateField('useMock', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="useMock" className="cursor-pointer">
              Use Mock API (for testing)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Configuration</CardTitle>
          <CardDescription>
            Customize system and user prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={config.systemPrompt}
              onChange={(e) => updateField('systemPrompt', e.target.value)}
              rows={3}
              placeholder="System prompt for LLM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPromptTranslate">Translation Prompt</Label>
            <Textarea
              id="userPromptTranslate"
              value={config.userPromptTranslate}
              onChange={(e) => updateField('userPromptTranslate', e.target.value)}
              rows={3}
              placeholder="Use {text} and {targetLanguage} as placeholders"
            />
            <p className="text-xs text-muted-foreground">
              Available placeholders: {'{text}'}, {'{targetLanguage}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPromptPolish">Polish Prompt</Label>
            <Textarea
              id="userPromptPolish"
              value={config.userPromptPolish}
              onChange={(e) => updateField('userPromptPolish', e.target.value)}
              rows={3}
              placeholder="Use {text} as placeholder"
            />
            <p className="text-xs text-muted-foreground">
              Available placeholder: {'{text}'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={async () => {
              const defaults = DEFAULT_CONFIG;
              updateField('systemPrompt', defaults.systemPrompt);
              updateField('userPromptTranslate', defaults.userPromptTranslate);
              updateField('userPromptPolish', defaults.userPromptPolish);
            }}
            className="w-full"
          >
            Restore Default Prompts
          </Button>
        </CardContent>
      </Card>

      {/* Trigger Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Configuration</CardTitle>
          <CardDescription>
            Configure keyboard shortcuts for triggering actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="triggerTranslate">Translation Trigger</Label>
            <Input
              id="triggerTranslate"
              value={config.triggerTranslate}
              onChange={(e) => updateField('triggerTranslate', e.target.value)}
              placeholder="   (triple space)"
            />
            <p className="text-xs text-muted-foreground">
              Type this pattern in an input to trigger translation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="triggerPolish">Polish Trigger</Label>
            <Input
              id="triggerPolish"
              value={config.triggerPolish}
              onChange={(e) => updateField('triggerPolish', e.target.value)}
              placeholder="   (triple space)"
            />
            <p className="text-xs text-muted-foreground">
              Type this pattern in an input to trigger polish
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language</Label>
            <select
              id="targetLanguage"
              value={config.targetLanguage}
              onChange={(e) => updateField('targetLanguage', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Italian">Italian</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Russian">Russian</option>
              <option value="Arabic">Arabic</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          Reset All
        </Button>
      </div>
    </div>
  );
}
