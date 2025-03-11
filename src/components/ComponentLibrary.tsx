
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import ComponentCard from './ComponentCard';
import { defaultComponents } from '@/utils/defaultComponents';

interface ComponentLibraryProps {
  onSelectComponent: (code: string) => void;
  className?: string;
}

type Category = 'all' | 'buttons' | 'layout' | 'inputs' | 'feedback' | 'badges' | 'avatars';

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onSelectComponent,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex flex-col space-y-2">
        <h2 className="text-lg font-semibold">Component Library</h2>
        <p className="text-sm text-muted-foreground">
          Click on a component to add it to your editor
        </p>
        
        <div className="relative mt-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search components..."
            className="w-full rounded-md border border-input bg-transparent pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2">
        {filteredComponents.length > 0 ? (
          filteredComponents.map((component) => (
            <ComponentCard
              key={component.id}
              name={component.name}
              description={component.description}
              code={component.code}
              onSelect={onSelectComponent}
              className="animate-fade-in"
            />
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground text-sm">
            No components match your search
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
