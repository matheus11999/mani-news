import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function NewsCard({ post, variant = 'default' }) {
  const formatDate = (date) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy • HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'politica': 'bg-red-500',
      'economia': 'bg-green-500',
      'esportes': 'bg-blue-500',
      'tecnologia': 'bg-purple-500',
      'mundo': 'bg-orange-500',
      'cultura': 'bg-pink-500',
      'saude': 'bg-teal-500',
      'educacao': 'bg-indigo-500'
    };
    return colors[category?.slug] || 'bg-gray-500';
  };

  if (variant === 'featured') {
    return (
      <Link to={`/noticia/${post.slug}`} className="block group">
        <article className="news-card h-full">
          <div className="relative h-64 sm:h-80">
            <img
              src={post.featuredImage || '/images/placeholder.svg'}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`category-badge ${getCategoryColor(post.category)} text-white`}>
                  {post.category?.name}
                </span>
                {post.isFeatured && (
                  <span className="category-badge bg-yellow-500 text-white">
                    Destaque
                  </span>
                )}
              </div>
              <h2 className="text-white text-xl font-bold group-hover:text-gray-200 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-200 text-sm mt-1 line-clamp-2">
                {post.excerpt}
              </p>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link to={`/noticia/${post.slug}`} className="block group">
        <article className="news-card">
          <div className="flex">
            <div className="w-32 sm:w-48 flex-shrink-0">
              <img
                src={post.featuredImage || '/images/placeholder.svg'}
                alt={post.title}
                className="w-full h-24 sm:h-32 object-cover"
              />
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`category-badge ${getCategoryColor(post.category)} text-white text-xs`}>
                  {post.category?.name}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                {post.title}
              </h3>
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
                {post.views && (
                  <div className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    <span>{post.views}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/noticia/${post.slug}`} className="block group">
      <article className="news-card h-full">
        <div className="relative h-48">
          <img
            src={post.featuredImage || '/images/placeholder.svg'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <span className={`category-badge ${getCategoryColor(post.category)} text-white`}>
              {post.category?.name}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
            {post.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-3">
              {post.author && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>{post.author.name}</span>
                </div>
              )}
              {post.views && (
                <div className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  <span>{post.views}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default NewsCard;