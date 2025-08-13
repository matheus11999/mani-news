import React, { useEffect, useState } from 'react';
import { TrendingUp, Clock, Globe } from 'lucide-react';
import NewsCard from '../components/NewsCard';
import LoadingSpinner, { NewsCardSkeleton, FeaturedCardSkeleton } from '../components/LoadingSpinner';
import { useNews } from '../context/NewsContext';

function HomePage() {
  const { posts, loading, dbStatus, fetchPosts } = useNews();
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    // If database is disconnected, show demo content
    if (dbStatus === 'disconnected') {
      showDemoContent();
    } else {
      fetchPosts();
    }
  }, [dbStatus, fetchPosts]);

  useEffect(() => {
    if (posts && posts.length > 0) {
      const featured = posts.filter(post => post.isFeatured).slice(0, 3);
      const latest = posts.filter(post => !post.isFeatured).slice(0, 8);
      setFeaturedPosts(featured);
      setLatestPosts(latest);
    }
  }, [posts]);

  const showDemoContent = () => {
    const demoData = {
      featured: [
        {
          id: 1,
          slug: 'demo-noticia-1',
          title: 'Economia brasileira mostra sinais de recuperação no terceiro trimestre',
          excerpt: 'Dados do IBGE apontam crescimento do PIB e redução do desemprego.',
          featuredImage: '/images/placeholder.svg',
          category: { name: 'Economia', slug: 'economia' },
          publishedAt: new Date().toISOString(),
          isFeatured: true
        },
        {
          id: 2,
          slug: 'demo-noticia-2',
          title: 'Nova tecnologia promete revolucionar o setor de energias renováveis',
          excerpt: 'Pesquisadores desenvolvem sistema mais eficiente de captação solar.',
          featuredImage: '/images/placeholder.svg',
          category: { name: 'Tecnologia', slug: 'tecnologia' },
          publishedAt: new Date().toISOString(),
          isFeatured: true
        }
      ],
      latest: [
        {
          id: 3,
          slug: 'demo-noticia-3',
          title: 'Congresso aprova nova lei de proteção de dados pessoais',
          excerpt: 'Medida amplia direitos dos cidadãos sobre suas informações.',
          featuredImage: '/images/placeholder.svg',
          category: { name: 'Política', slug: 'politica' },
          publishedAt: new Date().toISOString(),
          views: 1250
        },
        {
          id: 4,
          slug: 'demo-noticia-4',
          title: 'Seleção brasileira se prepara para próxima Copa do Mundo',
          excerpt: 'Técnico convoca novos talentos para amistosos internacionais.',
          featuredImage: '/images/placeholder.svg',
          category: { name: 'Esportes', slug: 'esportes' },
          publishedAt: new Date().toISOString(),
          views: 890
        },
        {
          id: 5,
          slug: 'demo-noticia-5',
          title: 'Descoberta arqueológica revela nova civilização pré-colombiana',
          excerpt: 'Achados no Peru podem reescrever história da América do Sul.',
          featuredImage: '/images/placeholder.svg',
          category: { name: 'Mundo', slug: 'mundo' },
          publishedAt: new Date().toISOString(),
          views: 567
        },
        {
          id: 6,
          slug: 'demo-noticia-6',
          title: 'Startup brasileira desenvolve aplicativo inovador de saúde',
          excerpt: 'Solução promete facilitar acesso a consultas médicas online.',
          featuredImage: '/images/placeholder.svg',
          category: { name: 'Tecnologia', slug: 'tecnologia' },
          publishedAt: new Date().toISOString(),
          views: 723
        }
      ]
    };

    setFeaturedPosts(demoData.featured);
    setLatestPosts(demoData.latest);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Featured Posts Skeleton */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Destaques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeaturedCardSkeleton />
            <FeaturedCardSkeleton />
            <FeaturedCardSkeleton />
          </div>
        </div>

        {/* Latest Posts Skeleton */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Últimas Notícias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <NewsCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breaking News Banner */}
      <div className="breaking-news">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-2">
            <span className="bg-white text-red-600 px-2 py-1 rounded text-xs font-bold mr-3">
              URGENTE
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-sm">
                <span>
                  Sistema PWA do Mani News funcionando perfeitamente • 
                  Dashboard administrativo disponível • 
                  Todas as funcionalidades operacionais
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status Warning */}
      {dbStatus === 'disconnected' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Modo Demo:</strong> O banco de dados não está conectado. 
                  Exibindo conteúdo de demonstração. 
                  <a href="/health" className="underline hover:text-yellow-800">
                    Verificar status do sistema
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-primary-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Destaques</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <NewsCard 
                  key={post.id || post.slug} 
                  post={post} 
                  variant="featured" 
                />
              ))}
            </div>
          </section>
        )}

        {/* Latest News */}
        <section>
          <div className="flex items-center mb-6">
            <Clock className="w-6 h-6 text-primary-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Últimas Notícias</h2>
          </div>
          
          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestPosts.map((post) => (
                <NewsCard 
                  key={post.id || post.slug} 
                  post={post} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notícia encontrada
              </h3>
              <p className="text-gray-500">
                As notícias aparecerão aqui quando o banco de dados estiver conectado.
              </p>
            </div>
          )}
        </section>

        {/* Load More Button */}
        {latestPosts.length > 0 && (
          <div className="text-center mt-12">
            <button className="btn btn-secondary">
              Carregar mais notícias
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;