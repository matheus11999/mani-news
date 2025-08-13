import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const NewsContext = createContext();

const initialState = {
  posts: [],
  categories: [],
  loading: false,
  error: null,
  currentPost: null,
  searchResults: [],
  dbStatus: 'disconnected'
};

function newsReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_POSTS':
      return { ...state, posts: action.payload, loading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_CURRENT_POST':
      return { ...state, currentPost: action.payload, loading: false };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload, loading: false };
    case 'SET_DB_STATUS':
      return { ...state, dbStatus: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function NewsProvider({ children }) {
  const [state, dispatch] = useReducer(newsReducer, initialState);

  // API functions
  const fetchPosts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get('/api/posts');
      dispatch({ type: 'SET_POSTS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      dispatch({ type: 'SET_CATEGORIES', payload: response.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPost = async (slug) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`/api/posts/${slug}`);
      dispatch({ type: 'SET_CURRENT_POST', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const searchPosts = async (query) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const checkHealthStatus = async () => {
    try {
      const response = await axios.get('/health');
      dispatch({ type: 'SET_DB_STATUS', payload: response.data.database.status });
    } catch (error) {
      dispatch({ type: 'SET_DB_STATUS', payload: 'disconnected' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check health status on mount
  useEffect(() => {
    checkHealthStatus();
    fetchCategories();
  }, []);

  const value = {
    ...state,
    fetchPosts,
    fetchCategories,
    fetchPost,
    searchPosts,
    checkHealthStatus,
    clearError
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}