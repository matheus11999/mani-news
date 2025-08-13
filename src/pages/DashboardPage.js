import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Server, 
  Database, 
  Smartphone, 
  Shield, 
  Plus, 
  FolderOpen, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useNews } from '../context/NewsContext';

function DashboardPage() {
  const { dbStatus, checkHealthStatus } = useNews();
  const [systemInfo, setSystemInfo] = useState({
    uptime: 0,
    memory: {},
    env: 'development'
  });

  useEffect(() => {
    checkHealthStatus();
    fetchSystemInfo();
  }, [checkHealthStatus]);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      setSystemInfo({
        uptime: data.uptime || 0,
        memory: data.memory || {},
        env: data.env || 'development'
      });
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes) => {
    if (!bytes) return '0 MB';
    return `${Math.round(bytes / 1024 / 1024)} MB`;
  };

  const statusCards = [
    {
      title: 'Servidor',
      status: 'Online',
      icon: Server,
      color: 'green',
      description: 'Express.js funcionando'
    },
    {
      title: 'Database',
      status: dbStatus === 'connected' ? 'Conectado' : 'Conectando...',
      icon: Database,
      color: dbStatus === 'connected' ? 'green' : 'yellow',
      description: 'MongoDB Atlas'
    },
    {
      title: 'PWA',
      status: 'Ativo',
      icon: Smartphone,
      color: 'blue',
      description: 'Service Worker ativo'
    },
    {
      title: 'Segurança',
      status: 'Protegido',
      icon: Shield,
      color: 'green',
      description: 'Helmet + Rate Limiting'
    }
  ];

  const quickActions = [
    {
      title: 'Nova Notícia',
      description: 'Criar nova postagem',
      icon: Plus,
      action: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      title: 'Categorias',
      description: 'Gerenciar categorias',
      icon: FolderOpen,
      action: () => alert('Funcionalidade em desenvolvimento')
    },
    {
      title: 'Analytics',
      description: 'Ver estatísticas',
      icon: BarChart3,
      action: () => alert('Funcionalidade em desenvolvimento')
    }
  ];

  const features = [
    'Service Worker',
    'Cache Offline',
    'Push Notifications',
    'Rate Limiting',
    'Segurança Avançada',
    'PWA Completo'
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard Admin</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Voltar ao Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statusCards.map((card) => {
              const Icon = card.icon;
              const colorClasses = {
                green: 'bg-green-100 text-green-600',
                yellow: 'bg-yellow-100 text-yellow-600',
                blue: 'bg-blue-100 text-blue-600'
              };

              return (
                <div key={card.title} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[card.color]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className={`text-lg font-semibold ${card.color === 'green' ? 'text-green-600' : card.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'}`}>
                        {card.status}
                      </p>
                      <p className="text-xs text-gray-500">{card.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.title}
                      onClick={action.action}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
                    >
                      <Icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Informações do Sistema</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Environment Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Ambiente</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Node.js:</dt>
                      <dd className="font-medium">v18+</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Framework:</dt>
                      <dd className="font-medium">React + Express</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Ambiente:</dt>
                      <dd className="font-medium">{systemInfo.env}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Uptime:</dt>
                      <dd className="font-medium">{formatUptime(systemInfo.uptime)}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Memória:</dt>
                      <dd className="font-medium">{formatMemory(systemInfo.memory.heapUsed)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Recursos</h3>
                  <div className="space-y-2">
                    {features.map((feature) => (
                      <div key={feature} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="w-6 h-6 text-blue-600 mt-1 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-blue-900">Dashboard em Desenvolvimento</h3>
                <p className="text-blue-800 mt-1">
                  Este é o dashboard administrativo básico convertido para React. 
                  Para implementar funcionalidades completas como criação de posts, 
                  gerenciamento de usuários e analytics, será necessário:
                </p>
                <ul className="list-disc list-inside text-blue-800 mt-2 space-y-1">
                  <li>Conectar o banco de dados MongoDB</li>
                  <li>Implementar sistema de autenticação JWT</li>
                  <li>Criar formulários de CRUD com React Hook Form</li>
                  <li>Adicionar upload de imagens com preview</li>
                  <li>Implementar editor de texto rico</li>
                </ul>
                <div className="mt-4">
                  <Link 
                    to="/health" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver Health Check →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;