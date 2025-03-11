import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ComponentCard from './ComponentCard';
import { defaultComponents } from '@/utils/defaultComponents';

interface ComponentLibraryProps {
  onSelectComponent: (code: string) => void;
  className?: string;
  onSearch?: (query: string) => void;
  externalSearchQuery?: string;
}

type Category = 'all' | 'buttons' | 'layout' | 'inputs' | 'feedback' | 'badges' | 'avatars';

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onSelectComponent,
  className,
  onSearch,
  externalSearchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingTags, setTrendingTags] = useState<string[]>(['buttons', 'cards', 'forms', 'dark mode', 'gradients', 'animations']);

  // Sync with external search query if provided
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    if (onSearch) {
      onSearch(tag);
    }
  };

  const filteredComponents = defaultComponents.filter(component => {
    const matchesCategory = selectedCategory === 'all' || component.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      component.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const categories: { label: string; value: Category }[] = [
    { label: 'All', value: 'all' },
    { label: 'Buttons', value: 'buttons' },
    { label: 'Layout', value: 'layout' },
    { label: 'Inputs', value: 'inputs' },
    { label: 'Feedback', value: 'feedback' },
    { label: 'Badges', value: 'badges' },
    { label: 'Avatars', value: 'avatars' },
  ];

  // Random trending tags (simulated)
  useEffect(() => {
    // Shuffle trending tags every 24 hours in a real app
    const allTags = ['buttons', 'cards', 'forms', 'dark mode', 'gradients', 'animations', 
                     'dropdowns', 'modals', 'navigation', 'social', 'e-commerce', 'charts', 
                     'loaders', 'heroes', 'footers'];
    setTrendingTags(allTags.sort(() => 0.5 - Math.random()).slice(0, 6));
  }, []);

  return (
    <div className={cn("flex flex-col space-y-4 overflow-y-auto h-full", className)}>
      {/* Hero Section - similar to Unsplash */}
      {!searchQuery && selectedCategory === 'all' && (
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-secondary/10 p-6 mb-4">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">The internet's source for reusable React components</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Powered by creators everywhere
            </p>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="rounded-full px-3 py-1 text-xs bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search bar - prominent like Unsplash */}
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search for any component..."
          className="w-full rounded-full border border-input bg-background/80 backdrop-blur-sm pl-12 pr-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Categories */}
      <div className="flex flex-wrap gap-2 mt-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              selectedCategory === category.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {filteredComponents.length > 0 && (
        <div className="text-sm text-muted-foreground pb-1 border-b border-border/20">
          {filteredComponents.length} component{filteredComponents.length !== 1 ? 's' : ''} available
        </div>
      )}

      {/* Masonry-style grid - similar to Unsplash */}
      <div className="masonry-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 overflow-y-auto pr-2">
        {filteredComponents.length > 0 ? (
          filteredComponents.map((component, index) => (
            <ComponentCard
              key={component.id}
              name={component.name}
              description={component.description}
              code={component.code}
              onSelect={onSelectComponent}
              // Alternate sizes for masonry effect
              className={cn(
                "animate-fade-in",
                index % 3 === 0 ? "row-span-1" : index % 4 === 0 ? "row-span-2" : "row-span-1"
              )}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2 text-muted-foreground/50"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
            <p className="text-sm">No components match your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
