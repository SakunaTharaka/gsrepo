import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/AddTelegramGroup.css';

const AddTelegramGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    country: '',
    language: '',
    link: '',
    description: '',
    iconUrl: ''
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingPopup, setShowExistingPopup] = useState(false);
  const [existingGroup, setExistingGroup] = useState(null);
  const [showAddGroupPopup, setShowAddGroupPopup] = useState(false);
  const [showAdminButton, setShowAdminButton] = useState(false);

  // Dropdown states
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Input values for dropdowns
  const [categoryInputValue, setCategoryInputValue] = useState('');
  const [countryInputValue, setCountryInputValue] = useState('');
  const [languageInputValue, setLanguageInputValue] = useState('');

  // Highlighted index for keyboard navigation
  const [categoryHighlightedIndex, setCategoryHighlightedIndex] = useState(-1);
  const [countryHighlightedIndex, setCountryHighlightedIndex] = useState(-1);
  const [languageHighlightedIndex, setLanguageHighlightedIndex] = useState(-1);

  // Refs for dropdown containers
  const categoryRef = useRef(null);
  const countryRef = useRef(null);
  const languageRef = useRef(null);
  const categoryListRef = useRef(null);
  const countryListRef = useRef(null);
  const languageListRef = useRef(null);

  const telegramLinkPattern = /^https:\/\/t\.me\/(?:joinchat\/[a-zA-Z0-9_-]+|\+[a-zA-Z0-9_-]{5,32}|[a-zA-Z0-9_]{5,32})$|^(\+[a-zA-Z0-9_-]{5,32}|[a-zA-Z0-9_]{5,32})$/;

  // Admin button shortcut
  useEffect(() => {
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
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setCategoryInputValue(formData.category);
        setFilteredCategories(categories);
      }
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountryInputValue(formData.country);
        setFilteredCountries(countries);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
        setLanguageInputValue(formData.language);
        setFilteredLanguages(languages);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categories, countries, languages, formData]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [categoriesSnap, countriesSnap, languagesSnap] = await Promise.all([
          getDoc(doc(db, 'dropdowns', 'category')),
          getDoc(doc(db, 'dropdowns', 'countries')),
          getDoc(doc(db, 'dropdowns', 'languages'))
        ]);
        const sortedCategories = categoriesSnap.exists() ? [...categoriesSnap.data().options].sort() : [];
        const sortedCountries = countriesSnap.exists() ? [...countriesSnap.data().options].sort() : [];
        const sortedLanguages = languagesSnap.exists() ? [...languagesSnap.data().options].sort() : [];
        setCategories(sortedCategories);
        setCountries(sortedCountries);
        setLanguages(sortedLanguages);
        setFilteredCategories(sortedCategories);
        setFilteredCountries(sortedCountries);
        setFilteredLanguages(sortedLanguages);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        alert('Failed to load form options. Please refresh the page.');
      }
    };
    fetchDropdownData();
  }, []);

  // Sync input values with form data
  useEffect(() => {
    setCategoryInputValue(formData.category);
  }, [formData.category]);
  useEffect(() => {
    setCountryInputValue(formData.country);
  }, [formData.country]);
  useEffect(() => {
    setLanguageInputValue(formData.language);
  }, [formData.language]);

  // Dropdown filtering handlers
  const handleCategorySearch = (value) => {
    setCategoryInputValue(value);
    setCategoryHighlightedIndex(-1);
    setFilteredCategories(
      value ? categories.filter(c => c.toLowerCase().includes(value.toLowerCase()))
      : categories
    );
    if (!showCategoryDropdown) setShowCategoryDropdown(true);
  };

  const handleCountrySearch = (value) => {
    setCountryInputValue(value);
    setCountryHighlightedIndex(-1);
    setFilteredCountries(
      value ? countries.filter(c => c.toLowerCase().includes(value.toLowerCase()))
      : countries
    );
    if (!showCountryDropdown) setShowCountryDropdown(true);
  };

  const handleLanguageSearch = (value) => {
    setLanguageInputValue(value);
    setLanguageHighlightedIndex(-1);
    setFilteredLanguages(
      value ? languages.filter(l => l.toLowerCase().includes(value.toLowerCase()))
      : languages
    );
    if (!showLanguageDropdown) setShowLanguageDropdown(true);
  };

  // Dropdown selection handlers
  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
    setCategoryInputValue(category);
    setShowCategoryDropdown(false);
    setFilteredCategories(categories);
    setCategoryHighlightedIndex(-1);
  };

  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, country }));
    setCountryInputValue(country);
    setShowCountryDropdown(false);
    setFilteredCountries(countries);
    setCountryHighlightedIndex(-1);
  };

  const handleLanguageSelect = (language) => {
    setFormData(prev => ({ ...prev, language }));
    setLanguageInputValue(language);
    setShowLanguageDropdown(false);
    setFilteredLanguages(languages);
    setLanguageHighlightedIndex(-1);
  };

  // Input focus handlers — clear search text & reset to full list on re-focus
  const handleCategoryFocus = () => {
    setCategoryInputValue('');
    setFilteredCategories(categories);
    setCategoryHighlightedIndex(-1);
    setShowCategoryDropdown(true);
  };

  const handleCountryFocus = () => {
    setCountryInputValue('');
    setFilteredCountries(countries);
    setCountryHighlightedIndex(-1);
    setShowCountryDropdown(true);
  };

  const handleLanguageFocus = () => {
    setLanguageInputValue('');
    setFilteredLanguages(languages);
    setLanguageHighlightedIndex(-1);
    setShowLanguageDropdown(true);
  };

  // Scroll highlighted item into view
  const scrollHighlightedIntoView = (listRef, index) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('.dropdown-item');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  // Keyboard navigation handlers
  const handleCategoryKeyDown = (e) => {
    if (!showCategoryDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(categoryHighlightedIndex + 1, filteredCategories.length - 1);
      setCategoryHighlightedIndex(next);
      scrollHighlightedIntoView(categoryListRef, next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(categoryHighlightedIndex - 1, 0);
      setCategoryHighlightedIndex(prev);
      scrollHighlightedIntoView(categoryListRef, prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (categoryHighlightedIndex >= 0 && filteredCategories[categoryHighlightedIndex]) {
        handleCategorySelect(filteredCategories[categoryHighlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowCategoryDropdown(false);
      setCategoryInputValue(formData.category);
    }
  };

  const handleCountryKeyDown = (e) => {
    if (!showCountryDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(countryHighlightedIndex + 1, filteredCountries.length - 1);
      setCountryHighlightedIndex(next);
      scrollHighlightedIntoView(countryListRef, next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(countryHighlightedIndex - 1, 0);
      setCountryHighlightedIndex(prev);
      scrollHighlightedIntoView(countryListRef, prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (countryHighlightedIndex >= 0 && filteredCountries[countryHighlightedIndex]) {
        handleCountrySelect(filteredCountries[countryHighlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowCountryDropdown(false);
      setCountryInputValue(formData.country);
    }
  };

  const handleLanguageKeyDown = (e) => {
    if (!showLanguageDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(languageHighlightedIndex + 1, filteredLanguages.length - 1);
      setLanguageHighlightedIndex(next);
      scrollHighlightedIntoView(languageListRef, next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(languageHighlightedIndex - 1, 0);
      setLanguageHighlightedIndex(prev);
      scrollHighlightedIntoView(languageListRef, prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (languageHighlightedIndex >= 0 && filteredLanguages[languageHighlightedIndex]) {
        handleLanguageSelect(filteredLanguages[languageHighlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowLanguageDropdown(false);
      setLanguageInputValue(formData.language);
    }
  };

  // Tag management
  const handleTags = (e) => {
    const value = e.target.value;
    if (value.endsWith(',') && value.trim().length > 0) {
      const newTag = value.slice(0, -1).trim().substring(0, 30);
      if (newTag && tags.length < 20) {
        setTags(prev => [...prev, newTag]);
        setTagInput('');
      }
    } else {
      setTagInput(value.substring(0, 30));
    }
  };

  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  // Form validation and submission
  const checkExistingGroup = async (link) => {
    const normalizedLink = link.toLowerCase();
    const q = query(collection(db, 'telegramGroups'), where('link', '==', normalizedLink));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate required fields
      const requiredFields = ['name', 'category', 'country', 'language', 'link'];
      const allRequiredFilled = requiredFields.every(field => formData[field].trim());
      
      // Removed tags.length check to make tags optional
      if (!allRequiredFilled) {
        alert('Please fill all required fields');
        return;
      }

      // Validate dropdown selections
      if (!categories.includes(formData.category)) {
        alert('Please select a valid category from the dropdown');
        return;
      }
      if (!countries.includes(formData.country)) {
        alert('Please select a valid country from the dropdown');
        return;
      }
      if (!languages.includes(formData.language)) {
        alert('Please select a valid language from the dropdown');
        return;
      }

      // Validate Telegram link format
      if (!telegramLinkPattern.test(formData.link)) {
        alert('Invalid Telegram link format!\nMust be: https://t.me/username, https://t.me/joinchat/... or username');
        return;
      }

      // Check for existing group
      if (await checkExistingGroup(formData.link)) {
        setExistingGroup(formData.link);
        setShowExistingPopup(true);
        return;
      }

      // Submit to Firestore
      await addDoc(collection(db, 'telegramGroups'), {
        ...formData,
        tags,
        iconUrl: formData.iconUrl.trim(),
        createdAt: new Date(),
        members: 0,
        rating: 0,
        reviews: []
      });

      alert('Group/Channel submitted for review!');
      navigate('/');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWhatsAppGroup = () => {
    const currentOrigin = window.location.origin;
    const fullUrl = `${currentOrigin}/add-whatsapp-group`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    setShowAddGroupPopup(false);
  };

  const handleAddTelegramGroup = () => {
    // Already on this page
    setShowAddGroupPopup(false);
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
                <span>Add WhatsApp Group/Channel</span>
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
            <button className="nav-btn nav-btn-outline" onClick={() => navigate('/')}>
              Browse
            </button>
            <button 
              className="nav-btn nav-btn-primary" 
              onClick={() => setShowAddGroupPopup(true)}
            >
              Add Group/Channel
            </button>
          </div>
        </div>
      </nav>

      <div className="add-telegram-container">
        <div className="add-telegram-form-container">
          <div className="form-content">
            <h1 className="form-header">
              <span className="form-header-icon">
                <img src="/telegram.png" alt="" />
              </span>
              Add Telegram Group/Channel
            </h1>

            <form onSubmit={handleSubmit} className="form-main">
              {/* Group Name */}
              <div className="form-group">
                <label className="form-label">Group/Channel Name </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="Enter group/channel name"
                  required
                  maxLength={60}
                />
              </div>

              {/* Category Dropdown */}
              <div className="form-group dropdown-container" ref={categoryRef}>
                <label className="form-label">Category </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={categoryInputValue}
                    onChange={(e) => handleCategorySearch(e.target.value)}
                    onFocus={handleCategoryFocus}
                    onKeyDown={handleCategoryKeyDown}
                    className="form-input"
                    placeholder="Search category..."
                    autoComplete="off"
                    required
                  />
                  <span className="dropdown-arrow"></span>
                </div>
                {showCategoryDropdown && (
                  <div className="dropdown-list" ref={categoryListRef}>
                    {filteredCategories.map((cat, i) => (
                      <div
                        key={i}
                        className={`dropdown-item${i === categoryHighlightedIndex ? ' dropdown-item-highlighted' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCategorySelect(cat);
                        }}
                        onMouseEnter={() => setCategoryHighlightedIndex(i)}
                      >
                        {cat}
                      </div>
                    ))}
                    {filteredCategories.length === 0 && (
                      <div className="dropdown-empty">No categories found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Country Dropdown */}
              <div className="form-group dropdown-container" ref={countryRef}>
                <label className="form-label">Country </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={countryInputValue}
                    onChange={(e) => handleCountrySearch(e.target.value)}
                    onFocus={handleCountryFocus}
                    onKeyDown={handleCountryKeyDown}
                    className="form-input"
                    placeholder="Search country..."
                    autoComplete="off"
                    required
                  />
                  <span className="dropdown-arrow"></span>
                </div>
                {showCountryDropdown && (
                  <div className="dropdown-list" ref={countryListRef}>
                    {filteredCountries.map((country, i) => (
                      <div
                        key={i}
                        className={`dropdown-item${i === countryHighlightedIndex ? ' dropdown-item-highlighted' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCountrySelect(country);
                        }}
                        onMouseEnter={() => setCountryHighlightedIndex(i)}
                      >
                        {country}
                      </div>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="dropdown-empty">No countries found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Language Dropdown */}
              <div className="form-group dropdown-container" ref={languageRef}>
                <label className="form-label">Language </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={languageInputValue}
                    onChange={(e) => handleLanguageSearch(e.target.value)}
                    onFocus={handleLanguageFocus}
                    onKeyDown={handleLanguageKeyDown}
                    className="form-input"
                    placeholder="Search language..."
                    autoComplete="off"
                    required
                  />
                  <span className="dropdown-arrow"></span>
                </div>
                {showLanguageDropdown && (
                  <div className="dropdown-list" ref={languageListRef}>
                    {filteredLanguages.map((lang, i) => (
                      <div
                        key={i}
                        className={`dropdown-item${i === languageHighlightedIndex ? ' dropdown-item-highlighted' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleLanguageSelect(lang);
                        }}
                        onMouseEnter={() => setLanguageHighlightedIndex(i)}
                      >
                        {lang}
                      </div>
                    ))}
                    {filteredLanguages.length === 0 && (
                      <div className="dropdown-empty">No languages found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Telegram Link */}
              <div className="form-group">
                <label className="form-label">Telegram Link </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  className="form-input"
                  placeholder="https://t.me/+username or https://t.me/username or username"
                  required
                />
                {formData.link && !telegramLinkPattern.test(formData.link) && (
                  <p className="form-error">Invalid link format! Must be: https://t.me/username or username</p>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label-optional">
                  Description ({250 - formData.description.length} characters remaining)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input textarea"
                  placeholder="Group/channel description..."
                  maxLength={250}
                />
              </div>

              {/* Tags - Updated to show as optional */}
              <div className="form-group">
                <label className="form-label">Tags (Optional, Max 20 tags, 30 characters each)</label>
                <div className="tag-input-container">
                  <div className="tag-container">
                    {tags.map((tag, index) => (
                      <div key={index} className="tag-item">
                        {tag}
                        <span className="tag-remove" onClick={() => removeTag(index)}>×</span>
                      </div>
                    ))}
                  </div>
                  {tags.length < 20 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={handleTags}
                      className="tag-input"
                      placeholder="Type tags separated by comma..."
                    />
                  )}
                </div>
              </div>

              {/* Guidelines */}
              <div className="submission-guidelines">
                <h3>Submission Guidelines</h3>
                <ul>
                  <li>Groups must follow community guidelines</li>
                  <li>No spam or promotional content</li>
                  <li>Admin reserves right to remove listings</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="submit-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="spinner-container">
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    Submitting...
                  </div>
                ) : 'Submit Group/Channel'}
              </button>
            </form>

            {/* Guide Section */}
            <div className="guide-section">
              <div className="note-section">
                <h3>📢 Note:</h3>
                <p><strong>Your Telegram group is publicly visible. Anyone can view and join using your shared invite link. Please follow the rules below before submitting.</strong></p>
              </div>

              <div className="rules-section">
                <h3>✅ Group Publisher Rules</h3>
                <ol>
                  <li>Only submit groups you own or manage.</li>
                  <li>No adult, illegal, or spam content.</li>
                  <li>Group names and descriptions must match their actual purpose.</li>
                  <li>Avoid repeatedly submitting the same group.</li>
                  <li>Violators will be blacklisted permanently.</li>
                </ol>
              </div>

              <div className="telegram-guide">
                <h3>📘 Telegram Group Guide</h3>
                
                <div className="guide-subsection">
                  <h4>🔹 Telegram Group Types</h4>
                  <ol>
                    <li><strong>Private Group:</strong> Hidden from search. Only those with an invite link can join.</li>
                    <li><strong>Public Group:</strong> Searchable and joinable via @username or invite link. Group name and chat history are visible.</li>
                  </ol>
                </div>

                <div className="guide-subsection">
                  <h4>🛠️ How to Create a Telegram Group</h4>
                  <ol>
                    <li>Open <strong>Telegram</strong>.</li>
                    <li>Tap the <strong>menu</strong> (☰) or the <strong>pencil icon</strong> &gt; choose <strong>New Group</strong>.</li>
                    <li>Select at least one contact.</li>
                    <li>Enter a <strong>Group Name</strong> and optionally set a <strong>Group Photo</strong>.</li>
                    <li>Tap <strong>Create</strong>.</li>
                  </ol>
                </div>

                <div className="guide-subsection">
                  <h4>🌐 How to Make It Public & Get a Group Link</h4>
                  <ol>
                    <li>Go to the group chat.</li>
                    <li>Tap the group name at the top.</li>
                    <li>Tap the <strong>✏️ Edit</strong> icon.</li>
                    <li>Go to <strong>Group Type</strong>.</li>
                    <li>Choose <strong>Public Group</strong>.</li>
                    <li>Set a unique <strong>username</strong> (e.g., <code>@yourgroupname</code>) or use <strong>Invite Link</strong> to get a join link.</li>
                  </ol>
                </div>

                <div className="guide-subsection">
                  <h4>🚫 How to Revoke a Telegram Group Link</h4>
                  <div className="method">
                    <h5><strong>To Revoke a Public Username:</strong></h5>
                    <ul>
                      <li>Change the username in Group Settings or make the group Private.</li>
                    </ul>
                  </div>
                  <div className="method">
                    <h5><strong>To Revoke a Private Invite Link:</strong></h5>
                    <ol>
                      <li>Open <strong>Group Info</strong> &gt; <strong>Invite Links</strong>.</li>
                      <li>Tap the three-dot menu next to the link.</li>
                      <li>Select <strong>Revoke link</strong>.</li>
                    </ol>
                  </div>
                  <p className="note">This will disable the current invite link. A new one can be generated anytime.</p>
                </div>

                <div className="guide-subsection">
                  <h4>👑 Group Admin Features</h4>
                  <ul>
                    <li>Add/remove members.</li>
                    <li>Promote other users to admin.</li>
                    <li>Control who can post messages or media.</li>
                    <li>Pin messages.</li>
                    <li>Set slow mode or filters.</li>
                    <li>Enable join approval.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>💡 General Telegram Group Features</h4>
                  <ul>
                    <li>Up to <strong>200,000 members</strong>.</li>
                    <li>Public or private groups.</li>
                    <li>Bot support, polls, reactions, and threads.</li>
                    <li>End-to-end encryption in secret chats.</li>
                    <li>Powerful moderation tools.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>⚙️ Group Settings Overview</h4>
                  <ul>
                    <li><strong>Group Type:</strong> Private or Public.</li>
                    <li><strong>Username:</strong> Only for public groups.</li>
                    <li><strong>Description:</strong> Optional, shown on group profile.</li>
                    <li><strong>Permissions:</strong> Restrict media, links, messages, and more.</li>
                    <li><strong>Slow Mode:</strong> Limit message frequency to reduce spam.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>👥 Managing Group Members</h4>
                  <ul>
                    <li>Add via contacts or invite link.</li>
                    <li>Use "Join Requests" for manual approval.</li>
                    <li>Remove spammers easily.</li>
                    <li>Promote moderators/admins with specific rights.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>📏 Telegram Limitations</h4>
                  <ul>
                    <li>Max 200,000 members per group.</li>
                    <li>Max file size for uploads: <strong>2 GB (or 4 GB for Premium users)</strong>.</li>
                    <li>Unlimited chat history.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>🤝 Group Etiquette Tips</h4>
                  <ul>
                    <li>Respect all members.</li>
                    <li>Stay on topic.</li>
                    <li>Avoid excessive promotion or spam.</li>
                    <li>Use pinned messages and announcements wisely.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>❓ FAQs</h4>
                  <div className="faq-item">
                    <p><strong>Q1:</strong> <em>How to submit a Telegram group to multilinks.cloud?</em></p>
                    <p>→ Use the group submission form and paste your public invite link or @username.</p>
                  </div>
                  <div className="faq-item">
                    <p><strong>Q2:</strong> <em>Can I remove my group from the site later?</em></p>
                    <p>→ Yes, contact support via the site or email.</p>
                  </div>
                  <div className="faq-item">
                    <p><strong>Q3:</strong> <em>Is my Telegram link safe on this platform?</em></p>
                    <p>→ Yes, but it's public. You can revoke or change it anytime from Telegram settings.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Group Popup */}
            {showExistingPopup && (
              <div className="existing-group-popup">
                <div className="popup-content">
                  <h3>Group/Channel Exists</h3>
                  <p>This Telegram group/channel is already listed in our directory.</p>
                  <div className="popup-buttons">
                    <button 
                      className="popup-close"
                      onClick={() => setShowExistingPopup(false)}
                    >
                      Close
                    </button>
                    <button 
                      className="popup-open"
                      onClick={() => window.open(existingGroup, '_blank')}
                    >
                      Open Group
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTelegramGroup;