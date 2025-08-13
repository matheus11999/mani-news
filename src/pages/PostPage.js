import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, User, Eye, Share2, ChevronRight, Facebook, Twitter, WhatsApp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNews } from '../context/NewsContext';

function PostPage() {
  const { slug } = useParams();
  const { currentPost, loading, error, fetchPost, dbStatus } = useNews();
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (dbStatus === 'disconnected') {
      // Show demo post
      setDemoPost();
    } else {
      fetchPost(slug);
    }
  }, [slug, dbStatus, fetchPost]);

  const setDemoPost = () => {
    const demoPost = {
      id: 1,
      slug: slug,
      title: 'Economia brasileira mostra sinais de recuperação no terceiro trimestre',
      content: `
        <p>A economia brasileira apresentou sinais positivos de recuperação no terceiro trimestre de 2024, segundo dados preliminares divulgados pelo Instituto Brasileiro de Geografia e Estatística (IBGE). O Produto Interno Bruto (PIB) registrou crescimento de 0,8% em relação ao trimestre anterior.</p>
        
        <p>Os setores que mais contribuíram para este crescimento foram:</p>
        
        <ul>
          <li><strong>Serviços:</strong> +1,2% no trimestre</li>
          <li><strong>Indústria:</strong> +0,5% no trimestre</li>
          <li><strong>Agropecuária:</strong> -0,3% no trimestre</li>
        </ul>
        
        <p>O ministro da Economia destacou que estes números refletem a eficácia das políticas econômicas implementadas pelo governo nos últimos meses. "Estamos no caminho certo para uma recuperação sustentável", declarou em entrevista coletiva.</p>
        
        <h3>Perspectivas para o próximo trimestre</h3>
        
        <p>Analistas econômicos projetam que o crescimento deve se manter estável no quarto trimestre, com expectativas de expansão entre 0,6% e 1,0%. Fatores como o aumento do consumo das famílias e investimentos em infraestrutura devem contribuir para este cenário positivo.</p>
        
        <p>A taxa de desemprego também apresentou melhora, caindo para 8,2% no período, o menor índice registrado nos últimos dois anos. Este dado reforça o otimismo em relação à recuperação econômica do país.</p>
      `,
      excerpt: 'Dados do IBGE apontam crescimento do PIB e redução do desemprego no terceiro trimestre.',
      featuredImage: '/images/placeholder.svg',
      category: { name: 'Economia', slug: 'economia' },
      author: {
        name: 'João Silva',
        bio: 'Jornalista especializado em economia',
        avatar: '/images/placeholder.svg'
      },
      publishedAt: new Date().toISOString(),
      views: 1250,
      tags: ['economia', 'pib', 'brasil', 'crescimento']
    };

    // Demo related posts
    const demoRelated = [
      {
        id: 2,
        slug: 'inflacao-agosto-2024',
        title: 'Inflação recua em agosto e fica abaixo da meta',
        excerpt: 'IPCA registra 0,15% no mês, menor alta desde janeiro.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Economia', slug: 'economia' },
        publishedAt: new Date().toISOString()
      },
      {
        id: 3,
        slug: 'mercado-trabalho-setembro',
        title: 'Mercado de trabalho cria 180 mil vagas em setembro',
        excerpt: 'Dados do Caged mostram recuperação do emprego formal.',
        featuredImage: '/images/placeholder.svg',
        category: { name: 'Economia', slug: 'economia' },
        publishedAt: new Date().toISOString()
      }
    ];

    // Simulate the context state
    setTimeout(() => {
      setRelatedPosts(demoRelated);
    }, 100);
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), "dd 'de' MMMM 'de' yyyy • HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const shareUrls = {
    facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(currentPost?.title || '')}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${currentPost?.title || ''} ${window.location.href}`)}`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && dbStatus !== 'disconnected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Notícia não encontrada</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="btn btn-primary">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  // Use demo post when database is disconnected
  const post = currentPost || {
    title: 'Economia brasileira mostra sinais de recuperação no terceiro trimestre',
    content: `
      <p>A economia brasileira apresentou sinais positivos de recuperação no terceiro trimestre de 2024, segundo dados preliminares divulgados pelo Instituto Brasileiro de Geografia e Estatística (IBGE). O Produto Interno Bruto (PIB) registrou crescimento de 0,8% em relação ao trimestre anterior.</p>
      
      <p>Os setores que mais contribuíram para este crescimento foram:</p>
      
      <ul>
        <li><strong>Serviços:</strong> +1,2% no trimestre</li>
        <li><strong>Indústria:</strong> +0,5% no trimestre</li>
        <li><strong>Agropecuária:</strong> -0,3% no trimestre</li>
      </ul>
      
      <p>O ministro da Economia destacou que estes números refletem a eficácia das políticas econômicas implementadas pelo governo nos últimos meses. "Estamos no caminho certo para uma recuperação sustentável", declarou em entrevista coletiva.</p>
      
      <h3>Perspectivas para o próximo trimestre</h3>
      
      <p>Analistas econômicos projetam que o crescimento deve se manter estável no quarto trimestre, com expectativas de expansão entre 0,6% e 1,0%. Fatores como o aumento do consumo das famílias e investimentos em infraestrutura devem contribuir para este cenário positivo.</p>
      
      <p>A taxa de desemprego também apresentou melhora, caindo para 8,2% no período, o menor índice registrado nos últimos dois anos. Este dado reforça o otimismo em relação à recuperação econômica do país.</p>
    `,
    featuredImage: '/images/placeholder.svg',
    category: { name: 'Economia', slug: 'economia' },
    author: {
      name: 'João Silva',
      bio: 'Jornalista especializado em economia',
      avatar: '/images/placeholder.svg'
    },
    publishedAt: new Date().toISOString(),
    views: 1250,
    tags: ['economia', 'pib', 'brasil', 'crescimento']
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="breadcrumb">
            <Link to="/" className="breadcrumb-item">Início</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to={`/categoria/${post.category?.slug}`} className="breadcrumb-item">
              {post.category?.name}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Notícia</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {/* Featured Image */}
            <div className="relative h-64 md:h-96">
              <img
                src={post.featuredImage || '/images/placeholder.svg'}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="category-badge bg-primary-600 text-white">
                  {post.category?.name}
                </span>
              </div>
            </div>

            {/* Article Header */}
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                {post.author && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{post.author.name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  <span>{post.views || 0} visualizações</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsShareOpen(!isShareOpen)}
                    className="flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    <span>Compartilhar</span>
                  </button>
                  
                  {isShareOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                      <div className="flex space-x-2">
                        <a
                          href={shareUrls.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Facebook className="w-5 h-5" />
                        </a>
                        <a
                          href={shareUrls.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-sky-500 hover:bg-sky-50 rounded"
                        >
                          <Twitter className="w-5 h-5" />
                        </a>
                        <a
                          href={shareUrls.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <WhatsApp className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Article Content */}
              <div 
                className="article-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Info */}
              {post.author && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-start">
                    <img
                      src={post.author.avatar || '/images/placeholder.svg'}
                      alt={post.author.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{post.author.name}</h4>
                      {post.author.bio && (
                        <p className="text-sm text-gray-600 mt-1">{post.author.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Notícias Relacionadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <NewsCard 
                    key={relatedPost.id} 
                    post={relatedPost} 
                    variant="horizontal" 
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostPage;