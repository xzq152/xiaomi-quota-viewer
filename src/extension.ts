import * as vscode from 'vscode';
import * as https from 'https';

interface QuotaItem {
  name: string;
  used: number;
  limit: number;
  percent: number;
}

interface UsageData {
  percent: number;
  items: QuotaItem[];
}

interface ApiResponse {
  code: number;
  message: string;
  data: {
    monthUsage: UsageData;
    usage: UsageData;
  };
}

let statusBarItem: vscode.StatusBarItem;
let refreshTimer: NodeJS.Timer | undefined;

function formatTokenCount(count: number): string {
  if (count >= 1_0000_0000) {
    return `${(count / 1_0000_0000).toFixed(2)}亿`;
  }
  if (count >= 1_0000) {
    return `${(count / 1_0000).toFixed(2)}万`;
  }
  return count.toLocaleString();
}

function getCookie(): string {
  const config = vscode.workspace.getConfiguration('xiaomiQuota');
  return config.get<string>('cookie') || '';
}

async function fetchQuota(cookie: string): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'platform.xiaomimimo.com',
      path: '/api/v1/tokenPlan/usage',
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
        'User-Agent': 'VSCode-Xiaomi-Quota-Extension'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data) as ApiResponse;
          resolve(json);
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function updateStatusBar(): Promise<void> {
  const cookie = getCookie();
  
  if (!cookie) {
    statusBarItem.text = '$(key) 小米额度: 未配置';
    statusBarItem.tooltip = '点击设置 Cookie';
    statusBarItem.command = 'xiaomiQuota.setCookie';
    return;
  }

  try {
    statusBarItem.text = '$(sync~spin) 小米额度: 加载中...';
    const response = await fetchQuota(cookie);
    
    if (response.code !== 0) {
      statusBarItem.text = '$(warning) 小米额度: 认证失败';
      statusBarItem.tooltip = `错误: ${response.message || '请检查 Cookie'}\n点击重新设置`;
      statusBarItem.command = 'xiaomiQuota.setCookie';
      return;
    }

    const { monthUsage, usage } = response.data;
    const monthPercent = (monthUsage.percent * 100).toFixed(2);
    const totalPercent = (usage.percent * 100).toFixed(2);
    
    const monthItem = monthUsage.items.find(i => i.name === 'month_total_token');
    const totalItem = usage.items.find(i => i.name === 'plan_total_token');
    
    let icon = '$(graph)';
    if (monthUsage.percent > 0.8) {
      icon = '$(warning)';
    } else if (monthUsage.percent > 0.5) {
      icon = '$(info)';
    }
    
    statusBarItem.text = `${icon} 小米额度: ${monthPercent}%`;
    
    const tooltipContent = [
      '═══════════════════════════════',
      '        小米模型额度详情',
      '═══════════════════════════════',
      '',
      '📊 本月使用:',
      `   使用量: ${monthItem ? formatTokenCount(monthItem.used) : 'N/A'}`,
      `   总额度: ${monthItem ? formatTokenCount(monthItem.limit) : 'N/A'}`,
      `   比例: ${monthPercent}%`,
      '',
      '📈 总计使用:',
      `   使用量: ${totalItem ? formatTokenCount(totalItem.used) : 'N/A'}`,
      `   总额度: ${totalItem ? formatTokenCount(totalItem.limit) : 'N/A'}`,
      `   比例: ${totalPercent}%`,
      '',
      '═══════════════════════════════',
      '点击刷新 | 右键查看更多选项'
    ].join('\n');
    
    statusBarItem.tooltip = new vscode.MarkdownString(tooltipContent);
    statusBarItem.command = 'xiaomiQuota.refresh';
    
  } catch (error) {
    statusBarItem.text = '$(error) 小米额度: 查询失败';
    statusBarItem.tooltip = `错误: ${error instanceof Error ? error.message : '未知错误'}\n点击重试`;
    statusBarItem.command = 'xiaomiQuota.refresh';
  }
}

function setupAutoRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer as unknown as number);
  }
  
  const config = vscode.workspace.getConfiguration('xiaomiQuota');
  const interval = config.get<number>('refreshInterval') || 60;
  
  if (interval > 0) {
    refreshTimer = setInterval(() => {
      updateStatusBar();
    }, interval * 1000);
  }
}

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const setCookieCommand = vscode.commands.registerCommand('xiaomiQuota.setCookie', async () => {
    const cookie = await vscode.window.showInputBox({
      prompt: '请输入小米平台 Cookie（从浏览器开发者工具获取）',
      password: true,
      placeHolder: 'api-platform_serviceToken=xxx; userId=xxx; ...',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Cookie 不能为空';
        }
        return null;
      }
    });

    if (cookie) {
      const config = vscode.workspace.getConfiguration('xiaomiQuota');
      await config.update('cookie', cookie.trim(), vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Cookie 已保存');
      updateStatusBar();
    }
  });

  const refreshCommand = vscode.commands.registerCommand('xiaomiQuota.refresh', () => {
    updateStatusBar();
  });

  context.subscriptions.push(setCookieCommand, refreshCommand);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('xiaomiQuota')) {
        setupAutoRefresh();
        updateStatusBar();
      }
    })
  );

  updateStatusBar();
  setupAutoRefresh();
}

export function deactivate() {
  if (refreshTimer) {
    clearInterval(refreshTimer as unknown as number);
  }
}
