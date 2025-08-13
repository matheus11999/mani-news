import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import NewsCard from '../components/NewsCard';
import LoadingSpinner, { NewsCardSkeleton } from '../components/LoadingSpinner';
import { useNews } from '../context/NewsContext';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { searchResults, loading, searchPosts, dbStatus } = useNews();
  const [searchQuery, setSearchQuery] = useState(query);
  const [demoResults, setDemoResults] = useState([]);

  useEffect(() => {
    if (query) {
      if (dbStatus === 'disconnected') {
        performDemoSearch(query);
      } else {
        searchPosts(query);
      }
    }
  }, [query, dbStatus, searchPosts]);

  const performDemoSearch = (searchTerm) => {
    const allDemoPosts = [
      {
        id: 1,
        slug: 'economia-recuperacao-q3',
        title: 'Economia brasileira mostra sinais de recuperação no terceiro trimestre',
        excerpt: 'Dados do IBGE apontam crescimento do PIB e redução do desemprego.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Economia', slug: 'economia' },
        publishedAt: new Date().toISOString(),
        views: 1250
      },
      {
        id: 2,
        slug: 'tecnologia-energia-renovavel',
        title: 'Nova tecnologia promete revolucionar o setor de energias renováveis',
        excerpt: 'Pesquisadores desenvolvem sistema mais eficiente de captação solar.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Tecnologia', slug: 'tecnologia' },
        publishedAt: new Date().toISOString(),
        views: 890
      },
      {
        id: 3,
        slug: 'politica-lei-dados',
        title: 'Congresso aprova nova lei de proteção de dados pessoais',
        excerpt: 'Medida amplia direitos dos cidadãos sobre suas informações.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Política', slug: 'politica' },
        publishedAt: new Date().toISOString(),
        views: 567
      },
      {
        id: 4,
        slug: 'esportes-selecao-copa',
        title: 'Seleção brasileira se prepara para próxima Copa do Mundo',
        excerpt: 'Técnico convoca novos talentos para amistosos internacionais.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Esportes', slug: 'esportes' },
        publishedAt: new Date().toISOString(),
        views: 1100
      },
      {
        id: 5,
        slug: 'descoberta-arqueologica-peru',
        title: 'Descoberta arqueológica revela nova civilização pré-colombiana',
        excerpt: 'Achados no Peru podem reescrever história da América do Sul.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Mundo', slug: 'mundo' },
        publishedAt: new Date().toISOString(),
        views: 723
      },
      {
        id: 6,
        slug: 'startup-brasileira-saude',
        title: 'Startup brasileira desenvolve aplicativo inovador de saúde',
        excerpt: 'Solução promete facilitar acesso a consultas médicas online.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Tecnologia', slug: 'tecnologia' },
        publishedAt: new Date().toISOString(),
        views: 456
      }
    ];

    // Simple search simulation
    const filtered = allDemoPosts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setDemoResults(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const results = dbStatus === 'disconnected' ? demoResults : searchResults;
  const totalResults = results.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="breadcrumb">
            <Link to="/" className="breadcrumb-item">Início</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Buscar</span>
          </nav>
        </div>
      </div>

      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Buscar Notícias</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Digite sua busca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <span className="btn btn-primary">Buscar</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Database Status Warning */}
      {dbStatus === 'disconnected' && query && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto">
            <p className="text-sm text-yellow-700">
              <strong>Modo Demo:</strong> Exibindo resultados de demonstração para "{query}".
            </p>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div>
            <div className="h-6 bg-gray-200 loading-skeleton w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <NewsCardSkeleton key={index} />
              ))}
            </div>
          </div>
        ) : query ? (
          <div>
            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {totalResults > 0 
                  ? `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''} para "${query}"`
                  : `Nenhum resultado encontrado para "${query}"`
                }
              </h2>
            </div>

            {/* Results Grid */}
            {totalResults > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Não encontramos notícias com os termos "{query}". 
                  Tente buscar com palavras diferentes.
                </p>
                <div className="text-sm text-gray-500">
                  <p className="mb-2">Dicas para uma busca melhor:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verifique a ortografia das palavras</li>
                    <li>Use palavras-chave mais gerais</li>
                    <li>Tente sinônimos das palavras utilizadas</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Digite algo para buscar
            </h3>
            <p className="text-gray-500">
              Use o campo de busca acima para encontrar notícias específicas.
            </p>
          </div>
        )}

        {/* Popular Searches */}
        {!query && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Buscas populares:</h3>
            <div className="flex flex-wrap gap-2">
              {['economia', 'política', 'esportes', 'tecnologia', 'brasil', 'mundo'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    setSearchParams({ q: term });
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;