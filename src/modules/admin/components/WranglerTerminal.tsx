
import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayIcon, RotateCcwIcon, SaveIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
}

interface WranglerTerminalProps {
  defaultScript?: string;
  onScriptRun?: (script: string) => Promise<void>;
  className?: string;
}

const WranglerTerminal: React.FC<WranglerTerminalProps> = ({ 
  defaultScript = '', 
  onScriptRun,
  className = ''
}) => {
  const [script, setScript] = useState<string>(defaultScript);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [savedScripts, setSavedScripts] = useState<{ name: string; script: string }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of logs when they change
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string, level: 'info' | 'error' | 'warning' | 'success' = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  const handleRunScript = async () => {
    if (!script.trim()) {
      toast({
        title: "Empty Script",
        description: "Please enter a script to run",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    addLog(`Running script: ${script.split('\n')[0]}...`, 'info');
    
    try {
      if (onScriptRun) {
        await onScriptRun(script);
        addLog("Script completed successfully", 'success');
      } else {
        // Mock execution for demo
        addLog("Mock execution (no handler provided)", 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        addLog("Script completed successfully", 'success');
      }
    } catch (error) {
      console.error('Script execution error:', error);
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const saveScript = () => {
    const name = prompt("Enter a name for this script:");
    if (name) {
      setSavedScripts(prev => [...prev, { name, script }]);
      toast({
        title: "Script Saved",
        description: `"${name}" has been saved`,
      });
    }
  };

  const loadScript = (savedScript: string) => {
    setScript(savedScript);
    toast({
      title: "Script Loaded",
      description: "Saved script loaded to editor",
    });
  };

  return (
    <Card className={`border rounded-lg overflow-hidden shadow-md ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full border-b rounded-none">
          <TabsTrigger value="editor" className="flex-1">Code Editor</TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">Terminal Output</TabsTrigger>
          <TabsTrigger value="saved" className="flex-1">Saved Scripts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="p-0">
          <div className="flex flex-col h-[400px]">
            <div className="bg-gray-900 p-2 text-white text-xs font-mono">
              <span className="text-blue-400">wrangler&gt;</span> Edit your script below
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="flex-grow p-4 font-mono text-sm resize-none bg-gray-950 text-gray-300 border-none focus:outline-none focus:ring-0"
              placeholder="# Enter your Wrangler commands here
npx wrangler d1 execute animorphs-db --command 'SELECT * FROM users LIMIT 10'"
              disabled={isRunning}
            />
            <div className="bg-gray-800 p-2 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={saveScript}
                disabled={isRunning || !script.trim()}
              >
                <SaveIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                onClick={handleRunScript}
                disabled={isRunning || !script.trim()}
                size="sm"
              >
                {isRunning ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Run Script
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="logs" className="p-0">
          <div className="flex flex-col h-[400px]">
            <div className="bg-gray-900 p-2 text-white flex justify-between items-center">
              <span className="text-xs font-mono">Terminal Output</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLogs}
                className="h-6 text-xs"
              >
                Clear
              </Button>
            </div>
            <div className="flex-grow p-2 font-mono text-sm overflow-auto bg-black text-green-500">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic p-2">No logs yet</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-500 text-xs mr-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`
                      ${log.level === 'error' ? 'text-red-400' : ''}
                      ${log.level === 'warning' ? 'text-yellow-400' : ''}
                      ${log.level === 'success' ? 'text-green-400' : ''}
                      ${log.level === 'info' ? 'text-blue-400' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="p-0">
          <div className="h-[400px] overflow-auto p-4">
            {savedScripts.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                <p>No saved scripts</p>
                <p className="text-xs mt-2">Save scripts from the editor tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedScripts.map((saved, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{saved.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadScript(saved.script)}
                      >
                        Load
                      </Button>
                    </div>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {saved.script.length > 100 
                        ? `${saved.script.substring(0, 100)}...` 
                        : saved.script}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default WranglerTerminal;
