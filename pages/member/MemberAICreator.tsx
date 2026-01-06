import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemberLayout } from '@/components/member/MemberLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot,
  Loader2,
  Copy,
  RefreshCw,
  Wand2,
  FileText,
  Image as ImageIcon,
  Video,
  Palette,
  Download,
  Paperclip,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ClipboardList,
  Eye,
  CheckCircle2,
  Crown,
  FileDown,
  Lightbulb,
  Zap,
  MessageSquarePlus,
  Share2,
  Maximize2,
  Clapperboard,
  Camera,
  Star,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { useUserRole } from '@/hooks/useUserRole';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useSavedCreations, type SavedCreation } from '@/hooks/useSavedCreations';
import { UpgradeLimitDialog } from '@/components/member/UpgradeLimitDialog';
import { MarkdownRenderer } from '@/components/member/MarkdownRenderer';
import { VoiceInput } from '@/components/member/VoiceInput';
import { ImageLightbox } from '@/components/member/ImageLightbox';
import { ProjectTemplates, type ProjectTemplate } from '@/components/member/ProjectTemplates';
import { exportProjectBriefToPDF } from '@/utils/projectBriefPdfExport';
import { ScenePlanGenerator, type ScenePlan } from '@/components/member/ScenePlanGenerator';
import { SceneGeneratorV2 } from '@/components/beta/SceneGeneratorV2';
import { AICreatorV2 } from '@/components/beta/AICreatorV2';
import { PhotoToScenePlan } from '@/components/member/PhotoToScenePlan';
import { PhotoToScenePlanV2 } from '@/components/beta/PhotoToScenePlanV2';
import { SmartTemplates, type SmartTemplate } from '@/components/beta/SmartTemplates';
import { LayoutTemplate } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  referenceImage?: string;
  isGeneratingImage?: boolean;
  timestamp?: Date;
}

interface ProjectDetails {
  name: string;
  mediaType: string;
  deadline: string;
  description: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-media-assistant`;

const suggestionChips = [
  { label: 'Video Project', icon: Video, prompt: 'I want to create a professional video for my business. Can you help me define the style, format, and key elements?' },
  { label: 'Photo Shoot', icon: ImageIcon, prompt: 'I need professional photos taken. Help me plan the shoot including locations, lighting, and style preferences.' },
  { label: 'Graphic Design', icon: Palette, prompt: 'I need a graphic design created. Let\'s discuss the style, colors, and visual elements that would work best.' },
  { label: 'Brand Content', icon: FileText, prompt: 'I want to create content for my brand. Help me develop a content strategy that aligns with my brand identity.' },
];

export default function MemberAICreator() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { trackUsage, canUseFeature, getUsage, getLimit, getDisplayLimit, getFeatureName } = useFeatureUsage();
  const { isAdmin } = useUserRole();
  const { hasBetaAccess } = useBetaAccess();
  const { creations, loading: loadingCreations, toggleFavorite, deleteCreation } = useSavedCreations();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('creator');
  
  // V2 toggle state
  const [useV2Creator, setUseV2Creator] = useState(false);
  const [useV2SceneGenerator, setUseV2SceneGenerator] = useState(false);
  const [useV2PhotoScene, setUseV2PhotoScene] = useState(false);
  const [useV2Templates, setUseV2Templates] = useState(false);
  
  // Show saved creations panel
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  
  // Can switch between versions - admin only
  const canSwitchVersions = isAdmin;
  
  // Beta users automatically get V2
  const shouldUseV2Creator = (canSwitchVersions && useV2Creator) || (!canSwitchVersions && hasBetaAccess);
  const shouldUseV2Scene = (canSwitchVersions && useV2SceneGenerator) || (!canSwitchVersions && hasBetaAccess);
  const shouldUseV2PhotoScene = (canSwitchVersions && useV2PhotoScene) || (!canSwitchVersions && hasBetaAccess);
  const shouldUseV2Templates = (canSwitchVersions && useV2Templates) || (!canSwitchVersions && hasBetaAccess);

  const mediaTypes = [
    { value: 'video', label: t.videoProduction, icon: Video },
    { value: 'photo', label: t.photoShoot, icon: ImageIcon },
    { value: 'graphic', label: t.graphicDesign, icon: Palette },
    { value: 'content', label: t.brandContent, icon: FileText },
  ];

  const quickPrompts = [
    { label: t.showMockup, icon: Wand2 },
    { label: t.makeMoreProfessional, icon: Zap },
    { label: t.addMoreDetails, icon: MessageSquarePlus },
    { label: t.suggestAlternatives, icon: Lightbulb },
  ];

  const videoQuickPrompts = [
    { label: t.planMyScenes, icon: Clapperboard },
    { label: t.showMockup, icon: Wand2 },
    { label: t.addMoreDetails, icon: MessageSquarePlus },
    { label: t.suggestShotTypes, icon: Video },
  ];

  const steps = [
    { id: 1, title: t.projectDetails, subtitle: t.basicInfo, icon: ClipboardList },
    { id: 2, title: t.createWithAi, subtitle: t.describeVision, icon: Wand2 },
    { id: 3, title: t.review, subtitle: t.finalCheck, icon: Eye },
  ];
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [showTemplates, setShowTemplates] = useState(true);
  
  // Upgrade dialog state
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<'ai_creation' | 'mockup_generation'>('ai_creation');
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Project details state
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    name: '',
    mediaType: '',
    deadline: '',
    description: '',
  });
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Scene plan state (for video mode)
  const [generatedScenePlan, setGeneratedScenePlan] = useState<ScenePlan | null>(null);

  // Handler to add scene plan to chat when generated
  const handleScenePlanGenerated = (scenePlan: ScenePlan) => {
    setGeneratedScenePlan(scenePlan);
    
    let scenePlanMessage = `## 🎬 Scene Plan: ${scenePlan.projectTitle}\n\n`;
    scenePlanMessage += `**Total Duration:** ${scenePlan.totalDuration} | **Scenes:** ${scenePlan.scenes.length}\n\n`;
    
    if (scenePlan.overview) {
      scenePlanMessage += `### Overview\n${scenePlan.overview}\n\n`;
    }
    
    scenePlanMessage += `### Scene Breakdown\n\n`;
    
    scenePlan.scenes.forEach(scene => {
      scenePlanMessage += `**Scene ${scene.sceneNumber}: ${scene.title}**\n`;
      scenePlanMessage += `- ⏱️ Duration: ${scene.duration}\n`;
      scenePlanMessage += `- 📷 Shot: ${scene.shotType}\n`;
      scenePlanMessage += `- 📍 Location: ${scene.location}\n`;
      scenePlanMessage += `- ${scene.description}\n`;
      if (scene.actors.length > 0) scenePlanMessage += `- 👥 Actors: ${scene.actors.join(', ')}\n`;
      if (scene.props.length > 0) scenePlanMessage += `- 🎭 Props: ${scene.props.join(', ')}\n`;
      if (scene.audio) scenePlanMessage += `- 🎵 Audio: ${scene.audio}\n`;
      if (scene.notes) scenePlanMessage += `- 📝 Notes: ${scene.notes}\n`;
      scenePlanMessage += `\n`;
    });
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: scenePlanMessage,
      timestamp: new Date(),
    }]);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasProcessedInitialPrompt = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null;
    if (state?.initialPrompt && !hasProcessedInitialPrompt.current && user && !loading) {
      hasProcessedInitialPrompt.current = true;
      window.history.replaceState({}, document.title);
      setCurrentStep(2);
      setShowTemplates(false);
      streamChat(state.initialPrompt);
    }
  }, [location.state, user, loading]);

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setProjectDetails(prev => ({
      ...prev,
      name: template.title,
      mediaType: template.mediaType,
    }));
    setShowTemplates(false);
    setCurrentStep(2);
    streamChat(template.prompt);
  };

  const generateMockupImage = async (prompt: string, messageIndex: number) => {
    const mockupCheck = canUseFeature('mockup_generation');
    if (!mockupCheck.allowed) {
      setBlockedFeature('mockup_generation');
      setShowUpgradeDialog(true);
      return;
    }
    
    try {
      trackUsage('mockup_generation');
      
      setMessages(prev => {
        const updated = [...prev];
        updated[messageIndex] = { ...updated[messageIndex], isGeneratingImage: true };
        return updated;
      });

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          generateImage: true, 
          imagePrompt: prompt 
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate mockup');
      }

      const data = await resp.json();
      
      setMessages(prev => {
        const updated = [...prev];
        updated[messageIndex] = { 
          ...updated[messageIndex], 
          image: data.image,
          isGeneratingImage: false
        };
        return updated;
      });
      
      toast.success(t.mockupGenerated);
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate mockup image');
      setMessages(prev => {
        const updated = [...prev];
        updated[messageIndex] = { ...updated[messageIndex], isGeneratingImage: false };
        return updated;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferenceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const streamChat = async (userMessage: string, imageBase64?: string) => {
    const aiCheck = canUseFeature('ai_creation');
    if (!aiCheck.allowed) {
      setBlockedFeature('ai_creation');
      setShowUpgradeDialog(true);
      return;
    }
    
    const userMsg: Message = { 
      role: 'user', 
      content: userMessage, 
      referenceImage: imageBase64,
      timestamp: new Date()
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    trackUsage('ai_creation');
    clearReferenceImage();

    let assistantContent = '';

    const apiMessages = newMessages.map(msg => {
      if (msg.referenceImage) {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            { type: 'image_url', image_url: { url: msg.referenceImage } }
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    });

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  role: 'assistant', 
                  content: assistantContent,
                  timestamp: new Date()
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      const mockupMatch = assistantContent.match(/\[GENERATE_MOCKUP:\s*(.+?)\]/);
      if (mockupMatch) {
        const mockupPrompt = mockupMatch[1];
        const cleanedContent = assistantContent.replace(/\[GENERATE_MOCKUP:\s*.+?\]/, '').trim();
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { 
            role: 'assistant', 
            content: cleanedContent,
            timestamp: new Date()
          };
          return updated;
        });

        const messageIndex = newMessages.length;
        generateMockupImage(mockupPrompt, messageIndex);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get AI response');
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    streamChat(message, referenceImage || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setShowTemplates(false);
    streamChat(prompt);
  };

  const handleQuickPrompt = (label: string) => {
    const lastMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastMessage) {
      streamChat(`${label} for the project we discussed.`);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleCopyLastResponse = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content);
      toast.success(t.copiedToClipboard);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setShowTemplates(true);
  };

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'mockup.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportProjectBriefToPDF({
        projectName: projectDetails.name || 'Untitled Project',
        mediaType: mediaTypes.find(t => t.value === projectDetails.mediaType)?.label || projectDetails.mediaType,
        deadline: projectDetails.deadline,
        description: projectDetails.description,
        brief: getLastBrief(),
        mockups: getGeneratedImages(),
        messageCount: messages.length,
        createdAt: new Date(),
      });
      toast.success(t.pdfExportedSuccess);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(t.failedToExportPdf);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const canProceedToStep2 = projectDetails.name && projectDetails.mediaType;
  const canProceedToStep3 = messages.length > 0;

  const handleNextStep = () => {
    if (currentStep === 1 && !canProceedToStep2) {
      toast.error('Please fill in project name and select a media type');
      return;
    }
    if (currentStep === 2 && !canProceedToStep3) {
      toast.error('Please chat with the AI to create your brief first');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitProject = () => {
    toast.success('Project brief submitted! Our team will review it shortly.');
    navigate('/member/orders');
  };

  const getGeneratedImages = () => {
    return messages.filter(m => m.image).map(m => m.image!);
  };

  const getLastBrief = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.content);
    return lastAssistant?.content || '';
  };

  if (loading || !user) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-medium">
              {t.aiMediaCreator}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t.startNewProject}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Saved Creations Toggle */}
            <Button
              variant={showSavedPanel ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowSavedPanel(!showSavedPanel)}
              className="gap-2"
            >
              <Star className={cn("w-4 h-4", showSavedPanel && "fill-current")} />
              Saved ({creations.length})
            </Button>
            
            {messages.length > 0 && (
              <Button 
                variant="outline"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                {t.exportProject}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Admin V2 Toggles */}
        {canSwitchVersions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Label htmlFor="v2-creator-toggle" className="text-sm text-purple-400 flex items-center gap-1 whitespace-nowrap">
                <Zap className="w-4 h-4" />
                AI Creator V2
              </Label>
              <Switch
                id="v2-creator-toggle"
                checked={useV2Creator}
                onCheckedChange={setUseV2Creator}
              />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Label htmlFor="v2-scene-toggle" className="text-sm text-purple-400 flex items-center gap-1 whitespace-nowrap">
                <Clapperboard className="w-4 h-4" />
                Scene Gen V2
              </Label>
              <Switch
                id="v2-scene-toggle"
                checked={useV2SceneGenerator}
                onCheckedChange={setUseV2SceneGenerator}
              />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Label htmlFor="v2-photo-toggle" className="text-sm text-purple-400 flex items-center gap-1 whitespace-nowrap">
                <Camera className="w-4 h-4" />
                Photo Scene V2
              </Label>
              <Switch
                id="v2-photo-toggle"
                checked={useV2PhotoScene}
                onCheckedChange={setUseV2PhotoScene}
              />
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Label htmlFor="v2-templates-toggle" className="text-sm text-purple-400 flex items-center gap-1 whitespace-nowrap">
                <LayoutTemplate className="w-4 h-4" />
                Templates V2
              </Label>
              <Switch
                id="v2-templates-toggle"
                checked={useV2Templates}
                onCheckedChange={setUseV2Templates}
              />
            </div>
          </motion.div>
        )}

        {/* Saved Creations Panel */}
        <AnimatePresence>
          {showSavedPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Saved Creations
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowSavedPanel(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {loadingCreations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : creations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No saved creations yet. Your saved briefs, prompts, and images will appear here.
                  </p>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {creations.map((creation) => (
                        <div
                          key={creation.id}
                          className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{creation.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {creation.creation_type.replace('_', ' ')}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(creation.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleFavorite(creation.id)}
                              >
                                <Star className={cn(
                                  "w-3 h-3",
                                  creation.is_favorite && "fill-amber-500 text-amber-500"
                                )} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => {
                                  if (confirm('Delete this creation?')) {
                                    deleteCreation(creation.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Start</span>
              {shouldUseV2Templates && (
                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1 bg-purple-500/20 text-purple-400">V2</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="creator" className="gap-2">
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">AI Creator</span>
              <span className="sm:hidden">Creator</span>
              {shouldUseV2Creator && (
                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1 bg-purple-500/20 text-purple-400">V2</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scene" className="gap-2">
              <Clapperboard className="w-4 h-4" />
              <span className="hidden sm:inline">Scene Generator</span>
              <span className="sm:hidden">Scenes</span>
              {shouldUseV2Scene && (
                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1 bg-purple-500/20 text-purple-400">V2</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="photo" className="gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Photo Scene</span>
              <span className="sm:hidden">Photo</span>
              {shouldUseV2PhotoScene && (
                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1 bg-purple-500/20 text-purple-400">V2</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {shouldUseV2Templates ? (
              <SmartTemplates 
                onSelectTemplate={(template: SmartTemplate) => {
                  setProjectDetails(prev => ({
                    ...prev,
                    name: template.title,
                    mediaType: template.mediaType,
                  }));
                  setShowTemplates(false);
                  setActiveTab('creator');
                  streamChat(template.prompt);
                }}
              />
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <ProjectTemplates onSelectTemplate={(template) => {
                  setProjectDetails(prev => ({
                    ...prev,
                    name: template.title,
                    mediaType: template.mediaType,
                  }));
                  setShowTemplates(false);
                  setActiveTab('creator');
                  streamChat(template.prompt);
                }} />
              </Card>
            )}
          </TabsContent>

          {/* AI Creator Tab */}
          <TabsContent value="creator" className="space-y-6">
            {shouldUseV2Creator ? (
              <AICreatorV2 />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
                {/* Steps Sidebar */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                    <div className="space-y-2">
                      {steps.map((step) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        
                        return (
                          <button
                            key={step.id}
                            onClick={() => {
                              if (step.id < currentStep || (step.id === 2 && canProceedToStep2) || (step.id === 3 && canProceedToStep3)) {
                                setCurrentStep(step.id);
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                              isActive && "bg-primary/10",
                              !isActive && !isCompleted && "opacity-50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                isCompleted && "bg-primary text-primary-foreground",
                                isActive && !isCompleted && "bg-primary/20 text-primary border-2 border-primary",
                                !isActive && !isCompleted && "bg-muted text-muted-foreground"
                              )}
                            >
                              {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <div>
                              <p className={cn("text-sm font-medium", isActive && "text-primary")}>
                                {step.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Usage Stats */}
                    <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">AI Chats</span>
                        <span className={cn(
                          "font-medium",
                          !canUseFeature('ai_creation').allowed && "text-destructive"
                        )}>
                          {getUsage('ai_creation')}/{getDisplayLimit('ai_creation')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Mockups</span>
                        <span className={cn(
                          "font-medium",
                          !canUseFeature('mockup_generation').allowed && "text-destructive"
                        )}>
                          {getUsage('mockup_generation')}/{getDisplayLimit('mockup_generation')}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Main Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <AnimatePresence mode="wait">
                    {/* Step 1: Project Details */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        {showTemplates && (
                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6">
                            <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
                          </Card>
                        )}

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                          <div className="p-6 border-b border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h2 className="font-display text-xl font-medium">Custom Project</h2>
                                <p className="text-sm text-muted-foreground">Or set up your own project details</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6 space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="projectName">Project Name *</Label>
                              <Input
                                id="projectName"
                                placeholder="e.g., Summer Campaign 2024"
                                value={projectDetails.name}
                                onChange={(e) => setProjectDetails(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-muted/50"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label>Media Type *</Label>
                              <div className="grid grid-cols-2 gap-3">
                                {mediaTypes.map((type) => {
                                  const TypeIcon = type.icon;
                                  const isSelected = projectDetails.mediaType === type.value;
                                  return (
                                    <button
                                      key={type.value}
                                      onClick={() => setProjectDetails(prev => ({ ...prev, mediaType: type.value }))}
                                      className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                                        isSelected 
                                          ? "border-primary bg-primary/10" 
                                          : "border-border/50 bg-muted/30 hover:bg-muted/50"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                      )}>
                                        <TypeIcon className="w-5 h-5" />
                                      </div>
                                      <span className={cn(
                                        "font-medium text-sm",
                                        isSelected && "text-primary"
                                      )}>
                                        {type.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="deadline">Preferred Deadline</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="deadline"
                                  type="date"
                                  value={projectDetails.deadline}
                                  onChange={(e) => setProjectDetails(prev => ({ ...prev, deadline: e.target.value }))}
                                  className="bg-muted/50 pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="description">Brief Description (optional)</Label>
                              <Textarea
                                id="description"
                                placeholder="A quick overview of what you're looking for..."
                                value={projectDetails.description}
                                onChange={(e) => setProjectDetails(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-muted/50 min-h-[100px]"
                              />
                            </div>
                          </div>

                          <div className="p-6 border-t border-border/50 bg-muted/30">
                            <Button onClick={handleNextStep} disabled={!canProceedToStep2} className="w-full gap-2">
                              Continue to AI Creator
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    {/* Step 2: AI Chat */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                                  <Bot className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <div>
                                  <span className="font-medium">AI Creative Assistant</span>
                                  <p className="text-xs text-muted-foreground">Powered by advanced AI</p>
                                </div>
                              </div>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                canUseFeature('ai_creation').allowed 
                                  ? "bg-muted text-muted-foreground" 
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                {getUsage('ai_creation')}/{getDisplayLimit('ai_creation')} chats
                              </span>
                            </div>
                          </div>

                          <ScrollArea ref={scrollRef} className="h-[400px] p-6">
                            {messages.length === 0 && showTemplates ? (
                              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                  <Sparkles className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="font-display text-xl font-medium">Let's Create Something Amazing</h3>
                                  <p className="text-muted-foreground text-sm max-w-md">
                                    Describe your vision for <span className="text-primary font-medium">{projectDetails.name || 'your project'}</span>
                                  </p>
                                </div>
                                
                                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                  {suggestionChips.map((chip) => (
                                    <Button
                                      key={chip.label}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSuggestionClick(chip.prompt)}
                                      className="gap-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                      <chip.icon className="w-4 h-4" />
                                      {chip.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {messages.map((message, index) => (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex gap-3",
                                      message.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                  >
                                    {message.role === 'assistant' && (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                                        <Bot className="w-4 h-4 text-primary-foreground" />
                                      </div>
                                    )}
                                    <div className="max-w-[85%] space-y-3">
                                      <div
                                        className={cn(
                                          "rounded-2xl px-4 py-3",
                                          message.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                            : 'bg-muted/80 rounded-bl-md'
                                        )}
                                      >
                                        {message.role === 'assistant' ? (
                                          <MarkdownRenderer content={message.content} />
                                        ) : (
                                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        )}
                                      </div>
                                      
                                      {message.image && (
                                        <div className="relative group cursor-pointer" onClick={() => handleOpenLightbox(getGeneratedImages().indexOf(message.image!))}>
                                          <img 
                                            src={message.image} 
                                            alt="Generated mockup" 
                                            className="rounded-xl max-w-full border border-border/50 shadow-lg"
                                          />
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDownloadImage(message.image!);
                                            }}
                                          >
                                            <Download className="w-3 h-3" />
                                            Download
                                          </Button>
                                        </div>
                                      )}
                                      
                                      {message.isGeneratingImage && (
                                        <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl p-6 border border-primary/20">
                                          <div className="flex items-center gap-3 text-sm">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            <div>
                                              <p className="font-medium text-primary">Generating your mockup...</p>
                                              <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {message.role === 'user' && (
                                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-primary-foreground" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                
                                {isLoading && messages[messages.length - 1]?.content === '' && (
                                  <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                                      <Bot className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                    <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3">
                                      <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </ScrollArea>

                          {messages.length > 0 && !isLoading && (
                            <div className="px-6 py-3 border-t border-border/50 bg-muted/30">
                              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Quick:</span>
                                {(projectDetails.mediaType === 'video' ? videoQuickPrompts : quickPrompts).map((prompt) => (
                                  <Button
                                    key={prompt.label}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleQuickPrompt(prompt.label)}
                                    className="gap-1.5 text-xs h-7 whitespace-nowrap rounded-full hover:bg-primary/10"
                                  >
                                    <prompt.icon className="w-3 h-3" />
                                    {prompt.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {messages.length > 0 && (
                            <div className="px-6 py-2 border-t border-border/50 flex justify-between items-center">
                              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Start Over
                              </Button>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCopyLastResponse} className="text-muted-foreground gap-2">
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="p-4 border-t border-border/50 bg-background/50 space-y-3">
                            {referenceImage && (
                              <div className="flex items-start gap-2">
                                <div className="relative">
                                  <img 
                                    src={referenceImage} 
                                    alt="Reference" 
                                    className="w-20 h-20 object-cover rounded-lg border border-border"
                                  />
                                  <button
                                    onClick={clearReferenceImage}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1">Reference image attached</span>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="h-12 w-12 rounded-xl flex-shrink-0"
                                title="Upload reference image"
                              >
                                <Paperclip className="w-5 h-5" />
                              </Button>

                              <VoiceInput 
                                onTranscript={handleVoiceTranscript}
                                disabled={isLoading}
                              />
                              
                              <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your vision... Ask for mockups!"
                                className="min-h-[48px] max-h-[120px] resize-none bg-muted/50 border-0 focus-visible:ring-1"
                                disabled={isLoading}
                              />
                              <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                size="icon"
                                className="h-12 w-12 rounded-xl flex-shrink-0"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Send className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-between">
                            <Button variant="ghost" onClick={handlePrevStep} className="gap-2">
                              <ArrowLeft className="w-4 h-4" />
                              Back
                            </Button>
                            <Button onClick={handleNextStep} disabled={!canProceedToStep3} className="gap-2">
                              Review Project
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                          <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="icon" onClick={handlePrevStep}>
                                <ArrowLeft className="w-5 h-5" />
                              </Button>
                              <div>
                                <h2 className="font-display text-xl font-medium">Project Review</h2>
                                <p className="text-sm text-muted-foreground">Review and submit your project</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="gap-2"
                              >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                Export PDF
                              </Button>
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Ready to Submit
                              </div>
                            </div>
                          </div>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                          <div className="p-6 border-b border-border/50">
                            <h3 className="font-display text-lg font-medium">{projectDetails.name || 'Untitled Project'}</h3>
                          </div>
                          
                          <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Deadline</p>
                                  <p className="font-medium">
                                    {projectDetails.deadline 
                                      ? new Date(projectDetails.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                      : 'Not specified'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-muted-foreground">AI Interactions</p>
                                <p className="text-2xl font-display font-medium">{messages.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Mockups Generated</p>
                                <p className="text-2xl font-display font-medium">{getGeneratedImages().length}</p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                          <div className="p-6 border-b border-border/50 flex items-center justify-between">
                            <h3 className="font-medium">AI-Generated Brief</h3>
                            <Button variant="ghost" size="sm" onClick={handleCopyLastResponse} className="gap-2">
                              <Copy className="w-4 h-4" />
                              Copy
                            </Button>
                          </div>
                          <ScrollArea className="h-[250px] p-6">
                            {getLastBrief() ? (
                              <MarkdownRenderer content={getLastBrief()} />
                            ) : (
                              <p className="text-sm text-muted-foreground">No brief generated yet.</p>
                            )}
                          </ScrollArea>
                        </Card>

                        {getGeneratedImages().length > 0 && (
                          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                            <div className="p-6 border-b border-border/50">
                              <h3 className="font-medium">Generated Mockups ({getGeneratedImages().length})</h3>
                            </div>
                            <div className="p-6">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {getGeneratedImages().map((img, idx) => (
                                  <div 
                                    key={idx} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handleOpenLightbox(idx)}
                                  >
                                    <img 
                                      src={img} 
                                      alt={`Mockup ${idx + 1}`} 
                                      className="rounded-xl border border-border/50 w-full aspect-square object-cover shadow-md hover:shadow-lg transition-shadow"
                                    />
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadImage(img);
                                      }}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Card>
                        )}

                        <div className="flex gap-4">
                          <Button 
                            variant="outline" 
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex-1 gap-2"
                          >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-5 h-5" />}
                            Save as PDF
                          </Button>
                          <Button onClick={handleSubmitProject} size="lg" className="flex-1 gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Submit Project Brief
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </TabsContent>

          {/* Scene Generator Tab */}
          <TabsContent value="scene" className="space-y-6">
            {shouldUseV2Scene ? (
              <SceneGeneratorV2 />
            ) : (
              <ScenePlanGenerator
                projectName={projectDetails.name}
                existingConversation={getLastBrief()}
                onScenePlanGenerated={handleScenePlanGenerated}
              />
            )}
          </TabsContent>

          {/* Photo Scene Plan Tab */}
          <TabsContent value="photo" className="space-y-6">
            {shouldUseV2PhotoScene ? (
              <PhotoToScenePlanV2
                projectName={projectDetails.name}
                onScenePlanGenerated={(plan) => {
                  toast.success('Photo scene plan generated!');
                }}
              />
            ) : (
              <PhotoToScenePlan
                projectName={projectDetails.name}
                onScenePlanGenerated={(plan) => {
                  toast.success('Photo scene plan generated!');
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <UpgradeLimitDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        featureName={getFeatureName(blockedFeature)}
        currentUsage={getUsage(blockedFeature)}
        limit={getLimit(blockedFeature)}
      />

      <ImageLightbox
        images={getGeneratedImages()}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </MemberLayout>
  );
}
