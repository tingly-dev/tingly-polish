import React from 'react';
import { ConfigPage } from './components/ConfigPage';
import { HistoryPage } from './components/HistoryPage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/Tabs';
import { Settings, History } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = React.useState<'config' | 'history'>('config');

  return (
    <div className="w-[400px] h-[500px] bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TP</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Tingly Polish</h1>
            <p className="text-xs text-muted-foreground">AI Translation & Polish</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'config' | 'history')}>
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="config" className="flex-1 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Config
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="config" className="m-0 mt-2">
          <ConfigPage />
        </TabsContent>

        <TabsContent value="history" className="m-0 mt-2">
          <HistoryPage />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="border-t px-4 py-2">
        <p className="text-xs text-center text-muted-foreground">
          Type triple space in any input to trigger
        </p>
      </div>
    </div>
  );
}

export default App;
