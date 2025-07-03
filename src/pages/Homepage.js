// Homepage.js
import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/Homepage.css';

function Homepage() {
  // State management
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showAddGroupPopup, setShowAddGroupPopup] = useState(false);

  // Refs
  const searchSectionRef = useRef(null);
  const featuredSectionRef = useRef(null);

  const navigate = useNavigate();

  // Read URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Set platform from URL
    const platformParam = params.get('platform');
    if (platformParam === 'whatsapp' || platformParam === 'telegram') {
      setSelectedPlatform(platformParam);
    }

    // Set filters from URL
    setSelectedCategory(params.get('category') || '');
    setSelectedCountry(params.get('country') || '');
    setSelectedLanguage(params.get('language') || '');
    
    // Initialize stats with animation
    const animateStats = () => {
      const statsElements = document.querySelectorAll('.stat-number');
      statsElements.forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        let count = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const updateCount = () => {
          count += increment;
          if (count < target) {
            el.textContent = Math.ceil(count);
            requestAnimationFrame(updateCount);
          } else {
            el.textContent = target;
          }
        };
        
        requestAnimationFrame(updateCount);
      });
    };
    
    // Set stats after a delay to allow DOM to render
    setTimeout(() => {
      animateStats();
    }, 500);
  }, []);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [catsSnap, consSnap, langsSnap] = await Promise.all([
          getDoc(doc(db, 'dropdowns', 'category')),
          getDoc(doc(db, 'dropdowns', 'countries')),
          getDoc(doc(db, 'dropdowns', 'languages'))
        ]);

        const sortedCategories = catsSnap.exists() ? [...catsSnap.data().options].sort() : [];
        const sortedCountries = consSnap.exists() ? [...consSnap.data().options].sort() : [];
        const sortedLanguages = langsSnap.exists() ? [...langsSnap.data().options].sort() : [];

        setCategories(sortedCategories);
        setCountries(sortedCountries);
        setLanguages(sortedLanguages);
      } catch (error) {
        console.error('Error loading dropdowns:', error);
      }
    };

    fetchDropdowns();

    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setShowAdminButton(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const collectionName = selectedPlatform === 'whatsapp' 
          ? 'ApprovedWA' 
          : 'ApprovedTG';
          
        let q = query(
          collection(db, collectionName),
          orderBy('createdAt', 'desc'),
          limit(21)
        );

        const snapshot = await getDocs(q);
        let groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (selectedCategory) {
          groupsData = groupsData.filter(group => 
            group.category.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        if (selectedCountry) {
          groupsData = groupsData.filter(group => 
            group.country.toLowerCase() === selectedCountry.toLowerCase()
          );
        }
        if (selectedLanguage) {
          groupsData = groupsData.filter(group => 
            group.language.toLowerCase() === selectedLanguage.toLowerCase()
          );
        }

        setGroups(groupsData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === 20);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [selectedPlatform, selectedCategory, selectedCountry, selectedLanguage]);

  const handleLoadMore = async () => {
    if (!lastVisible || isLoading) return;

    setIsLoading(true);
    try {
      const collectionName = selectedPlatform === 'whatsapp' 
        ? 'ApprovedWA' 
        : 'ApprovedTG';
        
      const q = query(
        collection(db, collectionName), 
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      let newGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (selectedCategory) {
        newGroups = newGroups.filter(group => 
          group.category.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      if (selectedCountry) {
        newGroups = newGroups.filter(group => 
          group.country.toLowerCase() === selectedCountry.toLowerCase()
        );
      }
      if (selectedLanguage) {
        newGroups = newGroups.filter(group => 
          group.language.toLowerCase() === selectedLanguage.toLowerCase()
        );
      }
      
      setGroups(prev => [...prev, ...newGroups]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading more groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCountry('');
    setSelectedLanguage('');
    setSearchQuery('');
  };

  // Handle filter link clicks
  const handleFilterClick = (type, value) => {
    const url = new URL(window.location.origin);
    url.searchParams.set('platform', selectedPlatform);
    url.searchParams.set(type, value);
    window.open(url.toString(), '_blank');
  };

  // Handle join group button click
  const handleJoinGroup = (group) => {
    const launchUrl = `/viewgroup/${selectedPlatform}/${group.id}`;
    window.open(launchUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle share button click
  const handleShareGroup = (group) => {
    const groupUrl = `${window.location.origin}/viewgroup/${selectedPlatform}/${group.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: group.name,
        text: group.description || 'Join this community on Multilinks.cloud',
        url: groupUrl
      })
      .catch(console.error);
    } else {
      // Fallback for desktop browsers
      navigator.clipboard.writeText(groupUrl);
      alert('Link copied to clipboard!');
    }
  };

  // Handle add group buttons
  const handleAddWhatsAppGroup = () => {
    const currentOrigin = window.location.origin;
    const fullUrl = `${currentOrigin}/add-whatsapp-group`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    setShowAddGroupPopup(false);
  };

  const handleAddTelegramGroup = () => {
    const currentOrigin = window.location.origin;
    const fullUrl = `${currentOrigin}/add-telegram-group`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    setShowAddGroupPopup(false);
  };

  // Search filter
  const filteredGroups = groups.filter(group => {
    const search = searchQuery.toLowerCase();
    return !search || (
      group.name?.toLowerCase().includes(search) ||
      group.description?.toLowerCase().includes(search) ||
      group.category?.toLowerCase().includes(search) ||
      group.country?.toLowerCase().includes(search) ||
      group.language?.toLowerCase().includes(search) ||
      group.tags?.some(tag => tag.toLowerCase().includes(search))
    );
  });

  // Helper functions
  const getGroupAvatar = (group) => group.iconUrl || group.avatar;
  const truncateText = (text, max) => text?.length > max ? `${text.slice(0, max)}...` : text;
  
  // Scroll to search section
  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="homepage-container">
      {showAdminButton && (
        <button className="admin-button" onClick={() => navigate('/login')}>
          ⚙️ Admin Panel
        </button>
      )}

      {/* Add Group Popup */}
      {showAddGroupPopup && (
        <div className="add-group-popup">
          <div className="popup-content">
            <div className="popup-header">
              <h3>Add Your Group</h3>
              <button className="close-popup" onClick={() => setShowAddGroupPopup(false)}>
                &times;
              </button>
            </div>
            <div className="popup-options">
              <button className="popup-option whatsapp" onClick={handleAddWhatsAppGroup}>
                <div className="option-icon">
                  <img src="/whatsapp.png" alt="WhatsApp" />
                </div>
                <span>Add WhatsApp Group</span>
              </button>
              <button className="popup-option telegram" onClick={handleAddTelegramGroup}>
                <div className="option-icon">
                  <img src="/telegram.png" alt="Telegram" />
                </div>
                <span>Add Telegram Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="/" className="logo-nav">
            <div className="logo-icon">
              <img src="/logo512.png" alt="Multilinks Logo" />
            </div>
            Multilinks
          </a>
          <div className="nav-actions">
            <button className="nav-btn nav-btn-outline" onClick={scrollToSearch}>
              Browse
            </button>
            <button 
              className="nav-btn nav-btn-primary" 
              onClick={() => setShowAddGroupPopup(true)}
            >
              Add Group
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="floating-element">
          <svg width="60" height="60" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div className="floating-element">
          <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        </div>
        <div className="floating-element">
          <svg width="50" height="50" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
          </svg>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span>🚀</span>
            Join 500K+ members worldwide
          </div>
          
          <h1 className="hero-title">Find Your Perfect Community</h1>
          <p className="hero-subtitle">
            Discover and connect with thousands of active WhatsApp and Telegram groups across every topic imaginable
          </p>
          
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={scrollToSearch}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              Explore Groups
            </button>
          </div>

          {/* Search Section */}
          <div className="search-section" ref={searchSectionRef}>
            <div className="search-container">
              <svg className="search-icon" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search for communities, topics, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filters">
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">📂 All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select 
                className="filter-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="">🌍 All Regions</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              
              <select 
                className="filter-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="">🗣️ All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              
              <div className="platform-select">
                <div 
                  className={`platform-option ${selectedPlatform === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => setSelectedPlatform('whatsapp')}
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="platform-icon" />
                  WhatsApp
                </div>
                <div 
                  className={`platform-option ${selectedPlatform === 'telegram' ? 'active' : ''}`}
                  onClick={() => setSelectedPlatform('telegram')}
                >
                  <img src="/telegram.png" alt="Telegram" className="platform-icon" />
                  Telegram
                </div>
              </div>
              
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats">
        <div className="stat-item">
          <span className="stat-number" data-count="352">0</span>
          <span className="stat-label">Active Groups</span>
        </div>
        <div className="stat-item">
          <span className="stat-number" data-count="758">0</span>
          <span className="stat-label">Community Members</span>
        </div>
        <div className="stat-item">
          <span className="stat-number" data-count="170">0</span>
          <span className="stat-label">Countries</span>
        </div>
        <div className="stat-item">
          <span className="stat-number" data-count="24">0</span>
          <span className="stat-label">Categories</span>
        </div>
      </div>

      {/* Featured Groups */}
      <section className="featured-section" ref={featuredSectionRef}>
        <div className="section-header">
          <h2 className="section-title">Featured Communities</h2>
          <p className="section-subtitle">Join these trending groups and connect with like-minded people</p>
        </div>
        
        <div className="groups-grid">
          {filteredGroups.length === 0 && !isLoading ? (
            <div className="no-groups">No groups found matching your criteria</div>
          ) : (
            filteredGroups.map((group, index) => (
              <div 
                key={group.id} 
                className={`group-card loading stagger-${(index % 5) + 1}`}
              >
                <div className="group-header">
                  <div className="group-avatar">
                    {getGroupAvatar(group) ? (
                      <img src={getGroupAvatar(group)} alt={group.name} />
                    ) : (
                      <img 
                        src={selectedPlatform === 'whatsapp' ? "/whatsapp.png" : "/telegram.png"} 
                        alt={selectedPlatform} 
                        className="platform-logo"
                      />
                    )}
                  </div>
                  <div className="group-info">
                    <h3>{group.name}</h3>
                    <div className="group-members">
                      {group.members || '1,000+'} members
                    </div>
                  </div>
                </div>
                <p className="group-description">
                  {truncateText(group.description, 120)}
                </p>
                <div className="group-meta">
                  <span className="meta-inline">
                    <button
                      className="filter-link"
                      onClick={() => handleFilterClick('category', group.category)}
                    >
                      🏷️ {group.category}
                    </button>
                    <button
                      className="filter-link"
                      onClick={() => handleFilterClick('country', group.country)}
                    >
                      🌍 {group.country}
                    </button>
                    <button
                      className="filter-link"
                      onClick={() => handleFilterClick('language', group.language)}
                    >
                      🗣️ {group.language}
                    </button>
                  </span>
                </div>
                <div className="group-tags">
                  {group.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="group-actions">
                  <button 
                    className="btn-join"
                    onClick={() => handleJoinGroup(group)}
                  >
                    Join Group
                  </button>
                  <button 
                    className="btn-share"
                    onClick={() => handleShareGroup(group)}
                  >
                    <img 
                     src="/share.ico" 
                      alt="Share" 
                      className="share-icon" 
                      width="16" 
                      height="16" 
  />
                    Share
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {hasMore && (
          <div className="load-more">
            <button 
              onClick={handleLoadMore} 
              disabled={isLoading}
              className="load-more-btn"
            >
              {isLoading ? 'Loading...' : 'Load More Groups'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Homepage;