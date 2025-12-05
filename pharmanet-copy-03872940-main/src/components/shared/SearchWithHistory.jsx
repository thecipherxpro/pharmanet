import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Clock, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SEARCH_HISTORY_KEY = 'pharmanet_search_history';
const MAX_HISTORY = 5;

export default function SearchWithHistory({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className = "",
  storageKey = SEARCH_HISTORY_KEY
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToHistory = (query) => {
    if (!query.trim()) return;

    try {
      let history = [...searchHistory];
      history = history.filter(item => item !== query);
      history.unshift(query);
      history = history.slice(0, MAX_HISTORY);
      
      localStorage.setItem(storageKey, JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(storageKey);
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      saveToHistory(value);
      setShowHistory(false);
      inputRef.current?.blur();
    }
  };

  const handleHistoryClick = (query) => {
    onChange(query);
    setShowHistory(false);
    saveToHistory(query);
  };

  const handleFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={`pl-9 pr-10 ${className}`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border-gray-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-gray-600">Recent Searches</span>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {searchHistory.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(query)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 group"
                >
                  <Clock className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                  <span className="text-sm text-gray-700 truncate">{query}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}