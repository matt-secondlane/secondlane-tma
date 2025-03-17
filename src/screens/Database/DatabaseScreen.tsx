import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import styles from './DatabaseScreen.module.css';
import api from '../../services/api';
import { Project } from '../../types/api';
import { Loader } from '../../components/Loader';

// Separate component for project
const ProjectCard = memo(({ project, onSelect }: { project: Project; onSelect: (project: Project) => void }) => {
  const [imgSrc, setImgSrc] = useState(project.logo || '/assets/default-project-logo.svg');

  const handleImageError = () => {
    console.log(`Failed to load logo for ${project.project_name}:`, project.logo);
    setImgSrc('/assets/default-project-logo.svg');
  };

  return (
    <div 
      className={styles.projectCard}
      onClick={() => {
        WebApp.HapticFeedback.impactOccurred('light');
        onSelect(project);
      }}
    >
      <img 
        src={imgSrc}
        alt={project.project_name} 
        className={styles.projectLogo}
        onError={handleImageError}
      />
      <h2 className={styles.projectName}>{project.project_name}</h2>
    </div>
  );
});

const DatabaseScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const loadingRef = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>();
  const currentSearchRef = useRef('');
  // Temporarily commenting out unused variable
  // const abortControllerRef = useRef<AbortController | null>(null);

  const handleProjectSelect = (project: Project) => {
    WebApp.HapticFeedback.impactOccurred('light');
    navigate(`/database/project/${project.project_id}`);
  };

  // Projects loading function
  const loadProjects = useCallback(async (page: number, search: string) => {
    if (loadingRef.current) {
      return;
    }

    // Temporarily disable AbortController usage
    // if (abortControllerRef.current && page > 1) {
    //   abortControllerRef.current.abort();
    // }
    // abortControllerRef.current = new AbortController();

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log(`Loading projects page ${page} with search: "${search}"`);
      
      const response = await api.get('/projects', {
        params: {
          offset: (page - 1) * 10,
          limit: 10,
          search: search || ''
        }
        // Temporarily disable signal usage
        // signal: abortControllerRef.current.signal
      });

      console.log(`Received projects response for page ${page}:`, response);

      // Check if search query hasn't changed during loading
      if (currentSearchRef.current !== search) {
        console.log('Search query changed during loading, ignoring results');
        return;
      }
      
      let projectsData: Project[];
      let total: number = 0;
      
      if (Array.isArray(response.data)) {
        projectsData = response.data;
        total = response.headers['x-total-count'] || projectsData.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data;
        total = response.data.total || response.data.meta?.total || projectsData.length;
      } else {
        console.error('Unexpected API response structure:', response.data);
        throw new Error('Unexpected API response structure');
      }
      
      if (page === 1) {
        setProjects(projectsData);
      } else {
        setProjects(prev => {
          const existingIds = new Set(prev.map(p => p.project_id));
          const newProjects = projectsData.filter(project => !existingIds.has(project.project_id));
          return [...prev, ...newProjects];
        });
      }
      
      setTotalCount(total);
      setHasMore(projectsData.length === 10 && (page - 1) * 10 + projectsData.length < total);
      
    } catch (err) {
      // if (err instanceof Error && err.name === 'AbortError') {
      //   console.log('Request was aborted');
      //   return;
      // }
      console.error('Error loading projects:', err);
      console.error('Error type:', err instanceof Error ? err.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      setError('Failed to load projects');
      setHasMore(false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      // if (abortControllerRef.current?.signal.aborted) {
      //   abortControllerRef.current = null;
      // }
    }
  }, []);

  // Search handler with debounce
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    currentSearchRef.current = value;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setProjects([]);
      setCurrentPage(1);
      setHasMore(true);
      loadProjects(1, value);
    }, 500);
  }, [loadProjects]);

  // Load next page on scroll
  const lastProjectRef = useCallback((node: HTMLDivElement) => {
    if (!node || isLoading || !hasMore || loadingRef.current) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current && !isLoading) {
        setCurrentPage(prevPage => {
          const nextPage = prevPage + 1;
          loadProjects(nextPage, searchQuery);
          return nextPage;
        });
      }
    }, {
      rootMargin: '100px' // Preload until end of list
    }); 
    
    observer.current.observe(node);
  }, [hasMore, isLoading, loadProjects, searchQuery]);

  // Initial load
  useEffect(() => {
    loadProjects(1, '');
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Temporarily disable canceling requests on unmount
      // if (abortControllerRef.current) {
      //   abortControllerRef.current.abort();
      // }
    };
  }, [loadProjects]);

  // Update filtered projects
  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  return (
    <div className="screen-content">
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search project..."
          value={searchQuery}
          onChange={handleSearch}
        />
        {totalCount > 0 && (
          <div className={styles.totalCount}>
            Found: {totalCount} projects (Page {currentPage})
          </div>
        )}
      </div>
      
      <div className={styles.projectsList}>
        {filteredProjects.map((project, index) => {
          if (filteredProjects.length === index + 1) {
            return (
              <div ref={lastProjectRef} key={project.project_id}>
                <ProjectCard 
                  project={project}
                  onSelect={handleProjectSelect}
                />
              </div>
            );
          } else {
            return (
              <div key={project.project_id}>
                <ProjectCard 
                  project={project}
                  onSelect={handleProjectSelect}
                />
              </div>
            );
          }
        })}
      </div>
      
      {isLoading && (
        <div className={styles.loader}>
          <Loader />
        </div>
      )}
      {error && <div className={styles.error}>Error: {error}</div>}
      {!hasMore && projects.length > 0 && (
        <div className={styles.noMore}>No more projects to load</div>
      )}
    </div>
  );
};

export default DatabaseScreen; 