import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
          <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <Search className="w-16 h-16 text-gray-400" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Página não encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link 
            to="/" 
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar à página inicial
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="btn btn-secondary w-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar à página anterior
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Ou navegue pelas seções:
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link 
              to="/categoria/politica" 
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Política
            </Link>
            <Link 
              to="/categoria/economia" 
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Economia
            </Link>
            <Link 
              to="/categoria/esportes" 
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Esportes
            </Link>
            <Link 
              to="/categoria/tecnologia" 
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Tecnologia
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-xs text-gray-500">
          <p>
            Se você acredita que isso é um erro, entre em contato conosco em{' '}
            <a 
              href="mailto:contato@maninews.com" 
              className="text-primary-600 hover:text-primary-700"
            >
              contato@maninews.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;