import { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";

interface VoiceCommand {
  action: string;
  params?: Record<string, any>;
}

export class VoiceCommandHandler {
  private navigate: NavigateFunction;
  
  constructor(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  async executeCommand(command: VoiceCommand): Promise<void> {
    console.log('Executing command:', command);
    
    switch (command.action) {
      case 'navigate':
        this.handleNavigation(command.params?.page);
        break;
      
      case 'create_automation':
        await this.handleCreateAutomation(command.params);
        break;
      
      case 'fill_form':
        this.handleFillForm(command.params);
        break;
      
      case 'create_post':
        await this.handleCreatePost(command.params);
        break;
      
      case 'generate_content':
        await this.handleGenerateContent(command.params);
        break;
      
      default:
        console.log('Unknown command:', command.action);
    }
  }

  private handleNavigation(page: string): void {
    const routes: Record<string, string> = {
      'dashboard': '/',
      'inbox': '/inbox',
      'automações': '/automations',
      'automacoes': '/automations',
      'chat': '/chat-ia',
      'creator': '/creator-studio',
      'comentários': '/comments',
      'comentarios': '/comments',
      'prompts': '/prompts',
      'analytics': '/analytics',
      'conexões': '/connections',
      'conexoes': '/connections',
      'suporte': '/suporte',
      'planos': '/planos',
      'configurações': '/settings',
      'configuracoes': '/settings',
    };

    const route = routes[page?.toLowerCase()];
    if (route) {
      this.navigate(route);
      toast.success(`Navegando para ${page}`);
    } else {
      toast.error(`Página ${page} não encontrada`);
    }
  }

  private async handleCreateAutomation(params: any): Promise<void> {
    // Navigate to automations page
    this.navigate('/automations');
    toast.success('Abrindo criador de automações');
    
    // If params provided, fill the form
    if (params?.trigger || params?.action) {
      setTimeout(() => {
        this.fillAutomationForm(params);
      }, 500);
    }
  }

  private fillAutomationForm(params: any): void {
    // Fill automation form fields
    if (params.name) {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.value = params.name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    if (params.trigger) {
      const triggerSelect = document.querySelector('select[name="trigger"]') as HTMLSelectElement;
      if (triggerSelect) {
        triggerSelect.value = params.trigger;
        triggerSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    if (params.action) {
      const actionSelect = document.querySelector('select[name="action"]') as HTMLSelectElement;
      if (actionSelect) {
        actionSelect.value = params.action;
        actionSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    toast.success('Formulário preenchido automaticamente');
  }

  private handleFillForm(params: any): void {
    if (!params || !params.fields) return;

    Object.entries(params.fields).forEach(([fieldName, value]) => {
      const input = document.querySelector(
        `input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`
      ) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      
      if (input) {
        input.value = value as string;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    toast.success('Campos preenchidos automaticamente');
  }

  private async handleCreatePost(params: any): Promise<void> {
    this.navigate('/creator-studio');
    toast.success('Abrindo Creator Studio');

    if (params?.caption || params?.platform) {
      setTimeout(() => {
        if (params.caption) {
          const captionInput = document.querySelector('textarea[placeholder*="legenda"]') as HTMLTextAreaElement;
          if (captionInput) {
            captionInput.value = params.caption;
            captionInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }

        if (params.platform) {
          const platformButton = document.querySelector(
            `button[data-platform="${params.platform}"]`
          ) as HTMLButtonElement;
          if (platformButton) {
            platformButton.click();
          }
        }
      }, 500);
    }
  }

  private async handleGenerateContent(params: any): Promise<void> {
    this.navigate('/creator-studio');
    toast.success('Gerando conteúdo com IA');

    if (params?.prompt) {
      setTimeout(() => {
        const promptInput = document.querySelector('textarea[placeholder*="Descreva"]') as HTMLTextAreaElement;
        if (promptInput) {
          promptInput.value = params.prompt;
          promptInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Trigger generate button
          const generateButton = document.querySelector('button:has(svg.lucide-sparkles)') as HTMLButtonElement;
          if (generateButton) {
            setTimeout(() => generateButton.click(), 300);
          }
        }
      }, 500);
    }
  }
}

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const lowerTranscript = transcript.toLowerCase();

  // Navigation commands
  const navMatch = lowerTranscript.match(/(?:ir para|abrir|navegar para|acessar)\s+(?:a\s+página\s+(?:de\s+)?)?(\w+)/);
  if (navMatch) {
    return { action: 'navigate', params: { page: navMatch[1] } };
  }

  // Create automation
  if (lowerTranscript.includes('criar automação') || lowerTranscript.includes('nova automação')) {
    return { action: 'create_automation' };
  }

  // Create post
  if (lowerTranscript.includes('criar post') || lowerTranscript.includes('novo post')) {
    return { action: 'create_post' };
  }

  // Generate content
  if (lowerTranscript.includes('gerar conteúdo') || lowerTranscript.includes('criar arte')) {
    const promptMatch = lowerTranscript.match(/(?:gerar|criar)\s+(?:conteúdo|arte)\s+(?:sobre|com|de)\s+(.+)/);
    if (promptMatch) {
      return { 
        action: 'generate_content', 
        params: { prompt: promptMatch[1] } 
      };
    }
    return { action: 'generate_content' };
  }

  return null;
}
