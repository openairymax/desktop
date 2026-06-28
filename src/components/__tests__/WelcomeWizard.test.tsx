import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import WelcomeWizard from '../WelcomeWizard';

const mockSaveSettings = vi.fn().mockResolvedValue(undefined);

vi.mock('../../services/agentos-sdk', () => ({
  default: {
    saveSettings: (...args: unknown[]) => mockSaveSettings(...args),
  },
}));

const mockSetLanguage = vi.fn();

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    language: 'zh',
    setLanguage: mockSetLanguage,
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'zh', name: '简体中文' },
    ],
  }),
}));

describe('WelcomeWizard', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWizard = () => {
    return render(<WelcomeWizard onComplete={mockOnComplete} />);
  };

  it('renders the wizard with progress bar', () => {
    renderWizard();
    expect(screen.getByText('AgentRT')).toBeInTheDocument();
    expect(screen.getByText('工业级 AI 智能体操作系统')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders step 1 welcome content', () => {
    renderWizard();
    expect(screen.getByText('欢迎使用 AgentRT')).toBeInTheDocument();
    expect(screen.getByText('三层认知循环')).toBeInTheDocument();
    expect(screen.getByText('四层记忆卷载')).toBeInTheDocument();
    expect(screen.getByText('安全穹顶 Cupolas')).toBeInTheDocument();
    expect(screen.getByText('双系统思考')).toBeInTheDocument();
  });

  it('navigates to step 2 on clicking next', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('认识 AgentRT 架构')).toBeInTheDocument();
    expect(screen.getByText('微内核 CoreKern')).toBeInTheDocument();
    expect(screen.getByText('三层认知循环 CoreLoopThree')).toBeInTheDocument();
    expect(screen.getByText('四层记忆卷载 MemoryRovol')).toBeInTheDocument();
    expect(screen.getByText('安全穹顶 Cupolas')).toBeInTheDocument();
  });

  it('navigates forward and backward through steps', () => {
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('认识 AgentRT 架构')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('选择界面语言')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    expect(screen.getByText('认识 AgentRT 架构')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '上一步' }));
    expect(screen.getByText('欢迎使用 AgentRT')).toBeInTheDocument();
  });

  it('does not show back button on step 1', () => {
    renderWizard();
    expect(screen.queryByRole('button', { name: '上一步' })).not.toBeInTheDocument();
  });

  it('renders step 3 language selection', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    expect(screen.getByText('选择界面语言')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('简体中文')).toBeInTheDocument();
  });

  it('calls setLanguage when clicking English', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    fireEvent.click(screen.getByText('English'));
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  it('calls setLanguage when clicking 简体中文', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    fireEvent.click(screen.getByRole('button', { name: '下一步' }));

    fireEvent.click(screen.getByText('简体中文'));
    expect(mockSetLanguage).toHaveBeenCalledWith('zh');
  });

  it('renders step 4 service mode selection', () => {
    renderWizard();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    }

    expect(screen.getByText('服务运行模式')).toBeInTheDocument();
    expect(screen.getByText('Docker Compose')).toBeInTheDocument();
    expect(screen.getByText('本地开发模式')).toBeInTheDocument();
    expect(screen.getByText('守护服务列表')).toBeInTheDocument();
    expect(screen.getByText('gateway_d 网关')).toBeInTheDocument();
    expect(screen.getByText('llm_d 大模型')).toBeInTheDocument();
  });

  it('allows selecting local service mode', () => {
    renderWizard();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    }

    fireEvent.click(screen.getByText('本地开发模式'));
    expect(screen.getByText('本地开发模式')).toBeInTheDocument();
  });

  it('renders step 5 completion summary', () => {
    renderWizard();
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    }

    expect(screen.getByText('准备就绪！')).toBeInTheDocument();
    expect(screen.getByText('界面语言')).toBeInTheDocument();
    expect(screen.getByText('服务模式')).toBeInTheDocument();
    expect(screen.getByText('项目路径')).toBeInTheDocument();
    expect(screen.getByText('核心模块')).toBeInTheDocument();
  });

  it('shows start button on step 5', () => {
    renderWizard();
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    }

    expect(screen.getByText('开始使用')).toBeInTheDocument();
  });

  it('calls onComplete and saves settings when start is clicked', async () => {
    renderWizard();
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    }

    fireEvent.click(screen.getByText('开始使用'));

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith({
        language: 'zh',
        projectPath: '',
        serviceMode: 'docker',
      });
      expect(localStorage.getItem('agentos-wizard-completed')).toBe('true');
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('calls onComplete even when saveSettings fails', async () => {
    mockSaveSettings.mockRejectedValueOnce(new Error('save failed'));

    renderWizard();
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    }

    fireEvent.click(screen.getByText('开始使用'));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('renders MCIS tagline in sidebar', () => {
    renderWizard();
    expect(screen.getByText('MCIS · 微内核 · 三层认知循环 · 四层记忆卷载')).toBeInTheDocument();
  });

  it('renders stats in sidebar', () => {
    renderWizard();
    expect(screen.getByText('<10K')).toBeInTheDocument();
    expect(screen.getByText('L1-L4')).toBeInTheDocument();
    expect(screen.getByText('+500%')).toBeInTheDocument();
    expect(screen.getByText('6守护')).toBeInTheDocument();
  });
});