import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, getDocs, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
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

  // Dropdown states
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  // Input field values for dropdowns
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [countryInputValue, setCountryInputValue] = useState('');
  const [languageInputValue, setLanguageInputValue] = useState('');

  // Refs for dropdown containers
  const categoryRef = useRef(null);
  const countryRef = useRef(null);
  const languageRef = useRef(null);

  const navigate = useNavigate();

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
        
        setFilteredCategories(sortedCategories);
        setFilteredCountries(sortedCountries);
        setFilteredLanguages(sortedLanguages);
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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategories(false);
        setCategoryInputValue(selectedCategory);
        setFilteredCategories(categories);
      }
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setShowCountries(false);
        setCountryInputValue(selectedCountry);
        setFilteredCountries(countries);
      }
      if (languageRef.current && !languageRef.current.contains(e.target)) {
        setShowLanguages(false);
        setLanguageInputValue(selectedLanguage);
        setFilteredLanguages(languages);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categories, countries, languages, selectedCategory, selectedCountry, selectedLanguage]);

  // Handle dropdown filtering
  const handleCategorySearch = (value) => {
    setCategoryInputValue(value);
    setFilteredCategories(
      value ? categories.filter(c => 
        c.toLowerCase().includes(value.toLowerCase())
      ) : categories
    );
  };

  const handleCountrySearch = (value) => {
    setCountryInputValue(value);
    setFilteredCountries(
      value ? countries.filter(c => 
        c.toLowerCase().includes(value.toLowerCase())
      ) : countries
    );
  };

  const handleLanguageSearch = (value) => {
    setLanguageInputValue(value);
    setFilteredLanguages(
      value ? languages.filter(l => 
        l.toLowerCase().includes(value.toLowerCase())
      ) : languages
    );
  };

  // Handle dropdown selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryInputValue(category);
    setFilteredCategories(categories);
    setShowCategories(false);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setCountryInputValue(country);
    setFilteredCountries(countries);
    setShowCountries(false);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setLanguageInputValue(language);
    setFilteredLanguages(languages);
    setShowLanguages(false);
  };

  // Sync input values with selected values
  useEffect(() => {
    setCategoryInputValue(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setCountryInputValue(selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    setLanguageInputValue(selectedLanguage);
  }, [selectedLanguage]);

  // Handle input focus - show dropdown and reset filter
  const handleCategoryFocus = () => {
    setShowCategories(true);
    setFilteredCategories(categories);
  };

  const handleCountryFocus = () => {
    setShowCountries(true);
    setFilteredCategories(countries);
  };

  const handleLanguageFocus = () => {
    setShowLanguages(true);
    setFilteredLanguages(languages);
  };

  // Handle input click - ensure dropdown shows even if already focused
  const handleCategoryClick = () => {
    if (!showCategories) {
      setShowCategories(true);
      setFilteredCategories(categories);
    }
  };

  const handleCountryClick = () => {
    if (!showCountries) {
      setShowCountries(true);
      setFilteredCountries(countries);
    }
  };

  const handleLanguageClick = () => {
    if (!showLanguages) {
      setShowLanguages(true);
      setFilteredLanguages(languages);
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const collectionName = selectedPlatform === 'whatsapp' ? 'whatsapp' : 'telegramGroups';
        let q = query(
          collection(db, collectionName),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const snapshot = await getDocs(q);
        let groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Case-insensitive filtering
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

  // Load more groups
  const handleLoadMore = async () => {
    if (!lastVisible || isLoading) return;

    setIsLoading(true);
    try {
      const collectionName = selectedPlatform === 'whatsapp' ? 'whatsapp' : 'telegramGroups';
      const q = query(
        collection(db, collectionName), 
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      let newGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Apply filters
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
    setCategoryInputValue('');
    setCountryInputValue('');
    setLanguageInputValue('');
    setFilteredCategories(categories);
    setFilteredCountries(countries);
    setFilteredLanguages(languages);
  };

  // NEW FEATURE: Handle join group button click - open in new tab
  const handleJoinGroup = (group) => {
    // Create URL for the launching page
    const launchUrl = `/viewgroup/${selectedPlatform}/${group.id}`;
    
    // Open in new tab
    window.open(launchUrl, '_blank', 'noopener,noreferrer');
  };

  // NEW FEATURE: Handle add group buttons - open in new tab
  const handleAddWhatsAppGroup = () => {
    // Get current origin (domain + port)
    const currentOrigin = window.location.origin;
    const fullUrl = `${currentOrigin}/add-whatsapp-group`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddTelegramGroup = () => {
    // Get current origin (domain + port)
    const currentOrigin = window.location.origin;
    const fullUrl = `${currentOrigin}/add-telegram-group`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="homepage-container">
      {showAdminButton && (
        <button className="admin-button" onClick={() => navigate('/login')}>
          ⚙️ Admin Panel
        </button>
      )}

      <header className="main-header">
        <div className="header-content">
          <h1>Multilinks.cloud</h1>
          <h2>Find your community</h2>
        </div>
      </header>

      <div className="logo-section">
        <img src={logo} alt="Logo" className="site-logo" />
      </div>

      <div className="action-buttons">
        <button 
          className="btn whatsapp-btn"
          onClick={handleAddWhatsAppGroup}
        >
          Add WhatsApp Group
        </button>
        <button 
          className="btn telegram-btn"
          onClick={handleAddTelegramGroup}
        >
          Add Telegram Group
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-section">
        {/* Category Dropdown */}
        <div className="filter-group dropdown-container" ref={categoryRef}>
          <label>Category:</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={categoryInputValue}
              onChange={(e) => handleCategorySearch(e.target.value)}
              onFocus={handleCategoryFocus}
              onClick={handleCategoryClick}
              placeholder="Search categories..."
              className="filter-input"
            />
            <span className="dropdown-arrow" />
          </div>
          {showCategories && (
            <div className="dropdown-list">
              {filteredCategories.map(category => (
                <div
                  key={category}
                  className="dropdown-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCategorySelect(category);
                  }}
                >
                  {category}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Country Dropdown */}
        <div className="filter-group dropdown-container" ref={countryRef}>
          <label>Country:</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={countryInputValue}
              onChange={(e) => handleCountrySearch(e.target.value)}
              onFocus={handleCountryFocus}
              onClick={handleCountryClick}
              placeholder="Search countries..."
              className="filter-input"
            />
            <span className="dropdown-arrow" />
          </div>
          {showCountries && (
            <div className="dropdown-list">
              {filteredCountries.map(country => (
                <div
                  key={country}
                  className="dropdown-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCountrySelect(country);
                  }}
                >
                  {country}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Dropdown */}
        <div className="filter-group dropdown-container" ref={languageRef}>
          <label>Language:</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={languageInputValue}
              onChange={(e) => handleLanguageSearch(e.target.value)}
              onFocus={handleLanguageFocus}
              onClick={handleLanguageClick}
              placeholder="Search languages..."
              className="filter-input"
            />
            <span className="dropdown-arrow" />
          </div>
          {showLanguages && (
            <div className="dropdown-list">
              {filteredLanguages.map(language => (
                <div
                  key={language}
                  className="dropdown-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleLanguageSelect(language);
                  }}
                >
                  {language}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          className="clear-filters-btn"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      <div className="platform-toggle">
        <button
          className={`toggle-btn whatsapp ${selectedPlatform === 'whatsapp' ? 'active' : ''}`}
          onClick={() => setSelectedPlatform('whatsapp')}
        >
          WhatsApp
        </button>
        <button
          className={`toggle-btn telegram ${selectedPlatform === 'telegram' ? 'active' : ''}`}
          onClick={() => setSelectedPlatform('telegram')}
        >
          Telegram
        </button>
      </div>

      <div className="groups-container">
        {filteredGroups.length === 0 && !isLoading ? (
          <div className="no-groups">No groups found matching your criteria</div>
        ) : (
          <div className="group-list">
            {filteredGroups.map(group => (
              <div key={group.id} className="group-card">
                <div className="card-content">
                  <div className="group-avatar">
                    {getGroupAvatar(group) ? (
                      <img src={getGroupAvatar(group)} alt={group.name} />
                    ) : (
                      <div className={`default-avatar ${selectedPlatform}`}>
                        {selectedPlatform === 'whatsapp' ? 'WA' : 'TG'}
                      </div>
                    )}
                  </div>
                  
                  <div className="group-details">
                    <div className="group-header">
                      <span className={`platform-indicator ${selectedPlatform}`}>
                        {selectedPlatform === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
                      </span>
                      <h3 className="group-name">{group.name}</h3>
                    </div>

                    {group.description && (
                      <p className="group-description">
                        {truncateText(group.description, 95)}
                      </p>
                    )}

                    <div className="group-meta">
                      <div className="meta-item">
                        <span className="meta-label">Category:</span>
                        {group.category}
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Country:</span>
                        {group.country}
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Language:</span>
                        {group.language}
                      </div>
                    </div>

                    {group.tags?.length > 0 && (
                      <div className="group-tags">
                        {group.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="group-actions">
                      <button
                        onClick={() => handleJoinGroup(group)}
                        className={`join-button ${selectedPlatform}`}
                      >
                        Join {selectedPlatform === 'whatsapp' ? 'WhatsApp Group' : 'Telegram Group'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}

export default Homepage;