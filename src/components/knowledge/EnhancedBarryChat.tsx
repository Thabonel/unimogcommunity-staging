import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCw, Trash2, AlertCircle, LogIn, BookOpen, FileText, ChevronRight, Image as ImageIcon, ZoomIn, ZoomOut, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// Removed ScrollArea import - using native scrolling for better mouse wheel support
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSecureChatGPT } from '@/hooks/use-secure-chatgpt';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { DiagramService, DiagramData } from '@/services/chatgpt/diagramService';

interface EnhancedBarryChatProps {
  className?: string;
  location?: { latitude: number; longitude: number };
  userModel?: string | null;
}

export function EnhancedBarryChat({ className, location, userModel }: EnhancedBarryChatProps) {
  const [input, setInput] = useState('');
  const [selectedManual, setSelectedManual] = useState<string | null>(null);
  const [manualContent, setManualContent] = useState<string>('');
  const [selectedPageImage, setSelectedPageImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [generatedDiagrams, setGeneratedDiagrams] = useState<DiagramData[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('current');
  const [newDiagramAvailable, setNewDiagramAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    messages, 
    manualReferences,
    isLoading, 
    error, 
    isAuthenticated,
    sendMessage, 
    clearChat,
    retry
  } = useSecureChatGPT(location);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load manual content when a reference is selected
  const loadManualPage = async (reference: { manual: string; page: number; pageImageUrl?: string | null; hasVisualContent?: boolean }) => {
    try {
      const { manual, page, pageImageUrl, hasVisualContent } = reference;
      
      // Set the page image if available
      if (pageImageUrl) {
        setSelectedPageImage(pageImageUrl);
        setImageZoom(1); // Reset zoom
      } else {
        setSelectedPageImage(null);
      }
      
      // Set manual content based on whether we have visual content
      if (hasVisualContent && pageImageUrl) {
        setManualContent(`Displaying page ${page} from "${manual}"\n\nThis page contains technical diagrams and illustrations. Use the zoom controls to examine details.`);
      } else {
        setManualContent(`Page ${page} from "${manual}"\n\nText-based content from this manual page. Page image not available for this manual.`);
      }
      
      setSelectedManual(`${manual} - Page ${page}`);
    } catch (err) {
      console.error('Error loading manual:', err);
      setManualContent('Failed to load manual content');
      setSelectedPageImage(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !isAuthenticated) return;
    
    const message = input;
    setInput('');
    
    try {
      const response = await sendMessage(message);
      
      // Check if Barry's response suggests diagrams
      if (response) {
        const diagrams = DiagramService.parseResponseForDiagrams(response);
        
        // Also check for specific diagram requests in user message
        const userRequestedDiagram = checkForDiagramRequest(message);
        if (userRequestedDiagram) {
          const diagram = generateRequestedDiagram(userRequestedDiagram);
          if (diagram) {
            diagrams.push(diagram);
          }
        }
        
        // If we have diagrams, show them with feedback
        if (diagrams.length > 0) {
          setGeneratedDiagrams(diagrams);
          setSelectedDiagram(diagrams[0]); // Show first diagram by default
          setNewDiagramAvailable(true);
          setActiveTab('diagrams'); // Auto-switch to diagrams tab
          
          // Clear the notification after a few seconds
          setTimeout(() => setNewDiagramAvailable(false), 5000);
        }
      }
    } catch (err) {
      // Error is handled by the hook
    }
    
    // Refocus textarea
    textareaRef.current?.focus();
  };

  // Helper function to check if user is requesting a diagram
  const checkForDiagramRequest = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('show') || lowerMessage.includes('diagram') || lowerMessage.includes('illustration')) {
      if (lowerMessage.includes('portal axle') || lowerMessage.includes('drain plug')) return 'portal_axle';
      if (lowerMessage.includes('differential') || lowerMessage.includes('diff lock')) return 'differential';
      if (lowerMessage.includes('oil') && (lowerMessage.includes('flow') || lowerMessage.includes('circuit'))) return 'oil_circuit';
      if (lowerMessage.includes('wiring') || lowerMessage.includes('electrical')) return 'wiring';
    }
    return null;
  };

  // Generate requested diagram
  const generateRequestedDiagram = (type: string): DiagramData | null => {
    // Try SVG first for better quality
    let diagram = DiagramService.generateSvgDiagram(type + '_detailed');
    if (!diagram) {
      diagram = DiagramService.generateAsciiDiagram(type);
    }
    return diagram;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full min-h-[400px]", className)}>
        <Alert className="max-w-md">
          <LogIn className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p>You need to be logged in to chat with Barry.</p>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <div className={cn("flex items-center justify-center h-full min-h-[400px] bg-gray-50", className)}>
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Barry Chat Error</h2>
            <p className="text-gray-600 mb-4">Unable to load the AI chat interface. Please try refreshing the page.</p>
            <Button onClick={() => window.location.reload()}>Refresh Chat</Button>
          </div>
        </div>
      }
    >
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4 h-full", className)}>
        {/* Chat Panel */}
        <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chat with Barry</CardTitle>
            <div className="flex items-center gap-2">
              {error && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retry}
                  disabled={isLoading}
                  title="Retry last message"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area with native scrolling for better mouse wheel support */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4"
            style={{ 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.timestamp && (
                      <div className={cn(
                        "text-xs mt-1 opacity-70",
                        message.role === 'user' ? 'text-right' : 'text-left'
                      )}>
                        {format(message.timestamp, 'HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">Barry is thinking...</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Diagram notification */}
              {newDiagramAvailable && generatedDiagrams.length > 0 && (
                <div className="flex justify-center mt-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Diagram available in the right panel →
                    </span>
                  </div>
                </div>
              )}
              {/* Scroll anchor for auto-scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Manual References */}
          {manualReferences.length > 0 && (
            <div className="border-t p-3">
              <div className="text-xs font-medium mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Manual References:
              </div>
              <div className="flex flex-wrap gap-2">
                {manualReferences.map((ref, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className={cn(
                      "cursor-pointer hover:bg-secondary/80 flex items-center gap-1",
                      ref.hasVisualContent && "border-blue-200 bg-blue-50"
                    )}
                    onClick={() => loadManualPage(ref)}
                  >
                    {ref.hasVisualContent ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    {ref.manual} p.{ref.page}
                    {ref.section && ` - ${ref.section}`}
                    {ref.hasVisualContent && (
                      <span className="text-xs text-blue-600 ml-1">
                        ({ref.visualContentType})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mx-4 mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={userModel ? `Ask Barry about your ${userModel}...` : "Ask Barry about your Unimog..."}
                className="min-h-[60px] resize-none"
                disabled={isLoading}
                rows={2}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manual Content & Diagrams Panel */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedDiagram ? (
                <>
                  <Cpu className="h-5 w-5" />
                  Diagram View
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5" />
                  Manual Content
                </>
              )}
            </div>
            {(selectedPageImage || selectedDiagram) && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                  disabled={imageZoom <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {Math.round(imageZoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageZoom(Math.min(2, imageZoom + 0.25))}
                  disabled={imageZoom >= 2}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="current">Current Reference</TabsTrigger>
              <TabsTrigger value="diagrams" className="relative">
                Diagrams
                {generatedDiagrams.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {generatedDiagrams.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">All Manuals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="flex-1 px-4 pb-4">
              <ScrollArea className="h-full">
                {selectedManual ? (
                  <div className="space-y-4">
                    <div className="font-medium text-sm">{selectedManual}</div>
                    
                    {/* Page Image Display */}
                    {selectedPageImage ? (
                      <div className="space-y-2">
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                          <img
                            src={selectedPageImage}
                            alt={`Manual page from ${selectedManual}`}
                            className="w-full h-auto"
                            style={{
                              transform: `scale(${imageZoom})`,
                              transformOrigin: 'top left',
                              transition: 'transform 0.2s ease'
                            }}
                            onError={(e) => {
                              console.error('Error loading manual page image:', e);
                              setSelectedPageImage(null);
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Click and drag to pan • Use zoom controls above
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans">{manualContent}</pre>
                      </div>
                    )}
                    
                    {/* Text content always shown below image */}
                    {selectedPageImage && (
                      <div className="prose prose-sm max-w-none border-t pt-4">
                        <pre className="whitespace-pre-wrap font-sans">{manualContent}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-center">
                      Manual excerpts and diagrams will appear here when Barry references technical documentation
                    </p>
                    <p className="text-xs text-center mt-2 opacity-75">
                      Pages with illustrations will show blue badges in the references section
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            {/* Diagrams Tab */}
            <TabsContent value="diagrams" className="flex-1 px-4 pb-4">
              <ScrollArea className="h-full">
                {generatedDiagrams.length > 0 ? (
                  <div className="space-y-4">
                    {/* Diagram Selector */}
                    {generatedDiagrams.length > 1 && (
                      <div className="flex flex-wrap gap-2 pb-3 border-b">
                        {generatedDiagrams.map((diagram, idx) => (
                          <Badge
                            key={idx}
                            variant={selectedDiagram === diagram ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => setSelectedDiagram(diagram)}
                          >
                            <Cpu className="h-3 w-3 mr-1" />
                            {diagram.title || `Diagram ${idx + 1}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Display Selected Diagram */}
                    {selectedDiagram && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">{selectedDiagram.title}</h3>
                        
                        {/* Render based on diagram type */}
                        {selectedDiagram.type === 'ascii' && (
                          <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                            <pre className="font-mono text-sm">{selectedDiagram.content}</pre>
                          </div>
                        )}
                        
                        {selectedDiagram.type === 'svg' && (
                          <div className="border rounded-lg p-4 bg-white dark:bg-gray-900"
                               style={{
                                 transform: `scale(${imageZoom})`,
                                 transformOrigin: 'top left',
                                 transition: 'transform 0.2s ease'
                               }}>
                            <div dangerouslySetInnerHTML={{ __html: selectedDiagram.content }} />
                          </div>
                        )}
                        
                        {selectedDiagram.type === 'mermaid' && (
                          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                            <pre className="text-sm">{selectedDiagram.content}</pre>
                            <p className="text-xs text-muted-foreground mt-2">
                              Mermaid diagram - copy to a Mermaid viewer for visualization
                            </p>
                          </div>
                        )}
                        
                        {selectedDiagram.description && (
                          <p className="text-sm text-muted-foreground">
                            {selectedDiagram.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Cpu className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-center">
                      Diagrams will appear here when Barry generates technical illustrations
                    </p>
                    <p className="text-xs text-center mt-2 opacity-75">
                      Ask Barry to "show a diagram" or "illustrate" something
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="all" className="flex-1 px-4 pb-4">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse all available Unimog manuals:
                  </p>
                  {/* This would be populated with actual manuals from the database */}
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      U1700L Service Manual
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      U1700L Parts Catalog
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Portal Axle Maintenance Guide
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <ChevronRight className="h-4 w-4 mr-2" />
                      OM352 Engine Manual
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
}