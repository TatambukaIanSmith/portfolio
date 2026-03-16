import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  Calendar, 
  User, 
  Share2, 
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

interface Article {
  title: string;
  description: string;
  source: string;
  image: string | null;
  url: string;
  publishedAt: string;
  category: string;
}

interface NewsReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  allArticles?: Article[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const NewsReaderModal: React.FC<NewsReaderModalProps> = ({
  isOpen,
  onClose,
  article,
  allArticles = [],
  currentIndex = 0,
  onNavigate
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (article) {
      // Calculate reading time (average 200 words per minute)
      const wordCount = article.description.split(' ').length + article.title.split(' ').length;
      const estimatedTime = Math.ceil(wordCount / 200);
      setReadingTime(Math.max(1, estimatedTime));
    }
  }, [article]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${article.title} - ${window.location.href}`);
      }
    } else if (article) {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${article.title} - ${window.location.href}`);
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Here you could save to localStorage or send to backend
    if (article) {
      const bookmarks = JSON.parse(localStorage.getItem('news_bookmarks') || '[]');
      if (isBookmarked) {
        const filtered = bookmarks.filter((b: any) => b.url !== article.url);
        localStorage.setItem('news_bookmarks', JSON.stringify(filtered));
      } else {
        bookmarks.push(article);
        localStorage.setItem('news_bookmarks', JSON.stringify(bookmarks));
      }
    }
  };

  const canNavigate = allArticles.length > 1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allArticles.length - 1;

  if (!article) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-space-900 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header - Mobile Responsive */}
            <div className="sticky top-0 z-10 bg-space-900/95 backdrop-blur-xl border-b border-white/10 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  {canNavigate && (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => onNavigate?.('prev')}
                        disabled={!hasPrev}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <span className="text-xs sm:text-sm text-white/60">
                        {currentIndex + 1}/{allArticles.length}
                      </span>
                      <button
                        onClick={() => onNavigate?.('next')}
                        disabled={!hasNext}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 min-w-0">
                    <span className="px-2 sm:px-3 py-1 bg-accent-primary/20 text-accent-primary text-xs font-medium rounded-full">
                      {article.source}
                    </span>
                    <div className="flex items-center text-white/40 text-xs sm:text-sm">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {readingTime} min read
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                  <button
                    onClick={toggleBookmark}
                    className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                      isBookmarked 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-white/5 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all"
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-all"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content - Mobile Responsive */}
            <div className="overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-120px)]">
              {/* Hero Image */}
              {article.image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="p-4 sm:p-8">
                {/* Meta Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center text-white/40 text-sm space-y-1 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatTime(article.publishedAt)}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {article.source}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  {article.title}
                </h1>

                {/* Article Body */}
                <div className="prose prose-invert prose-sm sm:prose-lg max-w-none">
                  <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                    {article.description}
                  </p>
                  
                  {/* Extended content simulation */}
                  <div className="space-y-3 sm:space-y-4 text-white/70 leading-relaxed text-sm sm:text-base">
                    <p>
                      This groundbreaking development represents a significant milestone in the field, 
                      with implications that extend far beyond initial expectations. Industry experts 
                      are calling it a game-changer that could reshape how we approach similar challenges 
                      in the future.
                    </p>
                    
                    <p>
                      The research team, led by renowned specialists, has been working on this project 
                      for several years. Their dedication and innovative approach have finally yielded 
                      results that exceed even the most optimistic projections.
                    </p>
                    
                    <p>
                      Looking ahead, this breakthrough opens up new possibilities for further research 
                      and development. The potential applications are vast, ranging from immediate 
                      practical implementations to long-term strategic advantages.
                    </p>
                    
                    <blockquote className="border-l-4 border-accent-primary pl-4 sm:pl-6 italic text-white/60 my-6 sm:my-8 text-sm sm:text-base">
                      "This represents a fundamental shift in our understanding and capabilities. 
                      The implications will be felt across multiple sectors and disciplines."
                    </blockquote>
                    
                    <p>
                      As we move forward, continued monitoring and analysis will be crucial to fully 
                      understand the long-term impact of these developments. The scientific community 
                      remains optimistic about the potential benefits and applications.
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 sm:px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">
                      #{article.category}
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">
                      #breaking
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">
                      #trending
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewsReaderModal;