import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Bot, Key, Upload, FileText, Terminal, ArrowLeft } from "lucide-react";
interface AIAssistantPageProps {
  onBack: () => void;
}
export const AIAssistantPage = ({
  onBack
}: AIAssistantPageProps) => {
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSaveApiKey = () => {
    if (!openaiApiKey.startsWith('sk-')) {
      toast({
        title: "Invalid API Key",
        description: "OpenAI API keys should start with 'sk-'",
        variant: "destructive"
      });
      return;
    }
    localStorage.setItem('ai_openai_key', openaiApiKey);
    toast({
      title: "API Key Saved",
      description: "OpenAI API key has been saved securely"
    });
  };
  const handleKnowledgeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const existingKnowledge = localStorage.getItem('ai_knowledge') || '[]';
      const knowledge = JSON.parse(existingKnowledge);
      knowledge.push({
        filename: file.name,
        content: content,
        uploadedAt: new Date().toISOString()
      });
      localStorage.setItem('ai_knowledge', JSON.stringify(knowledge));
      toast({
        title: "Knowledge File Uploaded",
        description: `${file.name} has been added to the AI knowledge base`
      });
    };
    reader.readAsText(file);
  };
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !openaiApiKey) {
      toast({
        title: "Missing Requirements",
        description: "Please enter a message and configure your OpenAI API key",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    const userMessage = {
      role: 'user' as const,
      content: chatMessage
    };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setChatMessage("");
    try {
      // Simulate AI response for now - in production this would call OpenAI API
      const response = await simulateAIResponse(chatMessage, openaiApiKey);
      setChatHistory([...newHistory, {
        role: 'assistant',
        content: response
      }]);
    } catch (error) {
      toast({
        title: "AI Request Failed",
        description: "Failed to get response from AI assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const simulateAIResponse = async (message: string, apiKey: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `AI Assistant Response to: "${message}"\n\nThis is a simulated response. In production, this would:\n1. Use your OpenAI API key: ${apiKey.substring(0, 10)}...\n2. Access server files for code analysis\n3. Provide code-aware development assistance\n4. Help with build automation and deployment\n\nTo complete the implementation, you'll need to:\n- Set up the backend API endpoints\n- Integrate with OpenAI's API\n- Implement file system access\n- Add security measures for server operations`;
  };
  return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="border-white/20 hover:bg-white/10 text-blue-500">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game
          </Button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Bot className="h-8 w-8 text-yellow-400" />
            AI Development Assistant
          </h1>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="bg-black/20 border-white/10">
            <TabsTrigger value="config" className="text-white data-[state=active]:bg-white/20">
              <Key className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="text-white data-[state=active]:bg-white/20">
              <Upload className="h-4 w-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-white data-[state=active]:bg-white/20">
              <Terminal className="h-4 w-4 mr-2" />
              AI Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card className="bg-black/20 border-white/10 text-white">
              <CardHeader>
                <CardTitle>OpenAI Configuration</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure your OpenAI API key for AI-powered development assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="text-sm text-gray-300">
                    OpenAI API Key
                  </label>
                  <Input id="apiKey" type="password" value={openaiApiKey} onChange={e => setOpenaiApiKey(e.target.value)} placeholder="sk-..." className="bg-black/50 border-white/20 text-white" />
                </div>
                <Button onClick={handleSaveApiKey} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  Save API Key
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card className="bg-black/20 border-white/10 text-white">
              <CardHeader>
                <CardTitle>Knowledge Base Management</CardTitle>
                <CardDescription className="text-gray-300">
                  Upload documentation, API credentials, and project files for AI context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">
                    Upload Knowledge Files
                  </label>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" onChange={handleKnowledgeUpload} accept=".txt,.md,.json,.php,.js,.ts,.tsx,.jsx" className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="text-white border-white/20 bg-sky-600 hover:bg-sky-500">
                      <FileText className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Supported formats: .txt, .md, .json, .php, .js, .ts, .tsx, .jsx
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="bg-black/20 border-white/10 text-white">
              <CardHeader>
                <CardTitle>AI Development Chat</CardTitle>
                <CardDescription className="text-gray-300">
                  Chat with your AI assistant for code analysis, debugging, and development help
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-96 overflow-y-auto bg-black/30 rounded-lg p-4 space-y-4">
                  {chatHistory.length === 0 ? <p className="text-gray-400 text-center">
                      Start a conversation with your AI development assistant
                    </p> : chatHistory.map((message, index) => <div key={index} className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600/20 ml-8' : 'bg-purple-600/20 mr-8'}`}>
                        <div className="text-xs text-gray-400 mb-1">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>)}
                  {isLoading && <div className="bg-purple-600/20 mr-8 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">AI Assistant</div>
                      <div>Thinking...</div>
                    </div>}
                </div>
                <div className="flex gap-2">
                  <Textarea value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Ask about code, deployment, features, or debugging..." className="bg-black/50 border-white/20 text-white" rows={3} />
                  <Button onClick={handleSendMessage} disabled={isLoading || !chatMessage.trim()} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};