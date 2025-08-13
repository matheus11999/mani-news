import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronRight as Next } from 'lucide-react';
import NewsCard from '../components/NewsCard';
import LoadingSpinner, { NewsCardSkeleton } from '../components/LoadingSpinner';
import { useNews } from '../context/NewsContext';

function CategoryPage() {
  const { slug } = useParams();
  const { loading, dbStatus } = useNews();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    if (dbStatus === 'disconnected') {
      showDemoContent();
    } else {
      fetchCategoryData();
    }
  }, [slug, dbStatus]);

  const showDemoContent = () => {
    const categories = {
      'politica': {
        name: 'Política',
        slug: 'politica',
        description: 'Últimas notícias sobre política brasileira e internacional',
        posts: [
          {
            id: 1,
            slug: 'congresso-aprova-lei',
            title: 'Congresso aprova nova lei de proteção de dados pessoais',
            excerpt: 'Medida amplia direitos dos cidadãos sobre suas informações.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Política', slug: 'politica' },
            publishedAt: new Date().toISOString(),
            views: 1250
          },
          {
            id: 2,
            slug: 'eleicoes-municipais-2024',
            title: 'Eleições municipais 2024: prazo para registro de candidatos termina amanhã',
            excerpt: 'Partidos têm até às 19h desta quinta-feira para apresentar candidaturas.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Política', slug: 'politica' },
            publishedAt: new Date().toISOString(),
            views: 890
          }
        ]
      },
      'economia': {
        name: 'Economia',
        slug: 'economia',
        description: 'Notícias sobre mercado financeiro, indicadores econômicos e negócios',
        posts: [
          {
            id: 3,
            slug: 'pib-crescimento-q3',
            title: 'PIB brasileiro cresce 0,8% no terceiro trimestre',
            excerpt: 'IBGE divulga dados preliminares da economia nacional.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Economia', slug: 'economia' },
            publishedAt: new Date().toISOString(),
            views: 2100
          },
          {
            id: 4,
            slug: 'bolsa-valores-alta',
            title: 'Bolsa de valores fecha em alta pelo terceiro dia consecutivo',
            excerpt: 'Ibovespa sobe 1,2% e fecha acima dos 120 mil pontos.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Economia', slug: 'economia' },
            publishedAt: new Date().toISOString(),
            views: 567
          }
        ]
      },
      'esportes': {
        name: 'Esportes',
        slug: 'esportes',
        description: 'Cobertura completa do mundo esportivo nacional e internacional',
        posts: [
          {
            id: 5,
            slug: 'selecao-convocacao',
            title: 'Seleção brasileira se prepara para próxima Copa do Mundo',
            excerpt: 'Técnico convoca novos talentos para amistosos internacionais.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Esportes', slug: 'esportes' },
            publishedAt: new Date().toISOString(),
            views: 890
          },
          {
            id: 6,
            slug: 'olimpiadas-paris-2024',
            title: 'Brasil conquista mais uma medalha nas Olimpíadas de Paris',
            excerpt: 'Atleta brasileira se destaca na ginástica artística.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Esportes', slug: 'esportes' },
            publishedAt: new Date().toISOString(),
            views: 1450
          }
        ]
      },
      'tecnologia': {
        name: 'Tecnologia',
        slug: 'tecnologia',
        description: 'Inovações, startups e tendências do mundo da tecnologia',
        posts: [
          {
            id: 7,
            slug: 'startup-brasileira-saude',
            title: 'Startup brasileira desenvolve aplicativo inovador de saúde',
            excerpt: 'Solução promete facilitar acesso a consultas médicas online.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Tecnologia', slug: 'tecnologia' },
            publishedAt: new Date().toISOString(),
            views: 723
          },
          {
            id: 8,
            slug: 'ia-medicina-diagnostico',
            title: 'Inteligência artificial revoluciona diagnósticos médicos',
            excerpt: 'Nova tecnologia aumenta precisão em 95% dos casos.',
            featuredImage: '/images/placeholder.svg',
            category: { name: 'Tecnologia', slug: 'tecnologia' },
            publishedAt: new Date().toISOString(),
            views: 1560
          }
        ]
      }
    };

    const categoryData = categories[slug] || {
      name: 'Categoria não encontrada',
      slug: slug,
      description: 'Esta categoria não possui conteúdo disponível.',
      posts: []
    };

    setCategory(categoryData);
    setPosts(categoryData.posts);
    setPagination({
      current: 1,
      total: 1,
      hasNext: false,
      hasPrev: false
    });
  };

  const fetchCategoryData = async () => {
    // This would fetch from API when database is connected
    try {
      const response = await fetch(`/api/categoria/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data.category);
        setPosts(data.posts);
        setPagination(data.pagination);
      } else {
        showDemoContent();
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      showDemoContent();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="h-4 bg-gray-200 loading-skeleton w-48" />
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 loading-skeleton w-64 mb-4" />
            <div className="h-4 bg-gray-200 loading-skeleton w-96" />
          </div>
        </div>

        {/* Posts Skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <NewsCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
          <p className="text-gray-600 mb-6">A categoria que você procura não existe.</p>
          <Link to="/" className="btn btn-primary">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="breadcrumb">
            <Link to="/" className="breadcrumb-item">Início</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-gray-600">{category.description}</p>
          )}
        </div>
      </div>

      {/* Database Status Warning */}
      {dbStatus === 'disconnected' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto">
            <p className="text-sm text-yellow-700">
              <strong>Modo Demo:</strong> Exibindo conteúdo de demonstração para a categoria {category.name}.
            </p>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="container mx-auto px-4 py-8">
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-12">
                {pagination.hasPrev && (
                  <Link
                    to={`/categoria/${slug}?page=${pagination.current - 1}`}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Link>
                )}

                <span className="text-sm text-gray-700">
                  Página {pagination.current} de {pagination.total}
                </span>

                {pagination.hasNext && (
                  <Link
                    to={`/categoria/${slug}?page=${pagination.current + 1}`}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:text-gray-700 hover:bg-gray-50"
                  >
                    Próxima
                    <Next className="w-4 h-4 ml-1" />
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma notícia encontrada
            </h3>
            <p className="text-gray-500">
              Não há notícias disponíveis nesta categoria no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage;