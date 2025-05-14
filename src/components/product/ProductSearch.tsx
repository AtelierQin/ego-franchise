import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ProductSearchProps {
  onSearch: (searchTerm: string) => void;
  onCategorySelect: (category: string | null) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ onSearch, onCategorySelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      // 提取唯一的分类
      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleCategoryClick = (category: string | null) => {
    if (selectedCategory === category) {
      // 如果点击的是当前选中的分类，则取消选择
      setSelectedCategory(null);
      onCategorySelect(null);
    } else {
      setSelectedCategory(category);
      onCategorySelect(category);
    }
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSearchSubmit} className="flex mb-4">
        <input
          type="text"
          placeholder="搜索商品名称..."
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="bg-primary text-white px-6 py-2 rounded-r-md hover:bg-primary-dark transition-colors"
        >
          搜索
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-full text-sm ${selectedCategory === null ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => handleCategoryClick(null)}
        >
          全部
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm ${selectedCategory === category ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductSearch;