import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/AddWhatsappGroup.css';

const AddWhatsappGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    country: '',
    language: '',
    link: '',
    description: '',
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

  // Refs for dropdown containers
  const categoryRef = useRef(null);
  const countryRef = useRef(null);
  const languageRef = useRef(null);

  const whatsappLinkPattern = /^https:\/\/chat\.whatsapp\.com\/(invite\/)?[a-zA-Z0-9]{22}$/i;

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
    setFilteredCategories(
      value ? categories.filter(c => c.toLowerCase().includes(value.toLowerCase())) 
      : categories
    );
  };

  const handleCountrySearch = (value) => {
    setCountryInputValue(value);
    setFilteredCountries(
      value ? countries.filter(c => c.toLowerCase().includes(value.toLowerCase())) 
      : countries
    );
  };

  const handleLanguageSearch = (value) => {
    setLanguageInputValue(value);
    setFilteredLanguages(
      value ? languages.filter(l => l.toLowerCase().includes(value.toLowerCase())) 
      : languages
    );
  };

  // Dropdown selection handlers
  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
    setShowCategoryDropdown(false);
    setFilteredCategories(categories);
  };

  const handleCountrySelect = (country) => {
    setFormData(prev => ({ ...prev, country }));
    setShowCountryDropdown(false);
    setFilteredCountries(countries);
  };

  const handleLanguageSelect = (language) => {
    setFormData(prev => ({ ...prev, language }));
    setShowLanguageDropdown(false);
    setFilteredLanguages(languages);
  };

  // Input focus handlers
  const handleCategoryFocus = () => {
    setShowCategoryDropdown(true);
    setFilteredCategories(categories);
  };

  const handleCountryFocus = () => {
    setShowCountryDropdown(true);
    setFilteredCountries(countries);
  };

  const handleLanguageFocus = () => {
    setShowLanguageDropdown(true);
    setFilteredLanguages(languages);
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
    const q = query(collection(db, 'whatsapp'), where('link', '==', normalizedLink));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields (description is now optional)
      const requiredFields = ['name', 'category', 'country', 'language', 'link'];
      const allRequiredFilled = requiredFields.every(field => formData[field].trim());

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

      // Validate WhatsApp link format
      if (!whatsappLinkPattern.test(formData.link)) {
        alert('Invalid WhatsApp link format!\nMust be: https://chat.whatsapp.com/...');
        return;
      }

      // Check for existing group
      if (await checkExistingGroup(formData.link)) {
      // Find the existing group document
      const normalizedLink = formData.link.toLowerCase();
      const q = query(collection(db, 'whatsapp'), where('link', '==', normalizedLink));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingGroupDoc = querySnapshot.docs[0];
        setExistingGroup({
          link: existingGroupDoc.data().link,
          id: existingGroupDoc.id
        });
        setShowExistingPopup(true);
        setIsSubmitting(false);
        return;
      }
    }

      // Submit to Firestore
      await addDoc(collection(db, 'whatsapp'), {
        ...formData,
        tags,
        iconUrl: '',
        createdAt: new Date(),
        approved: 0,
        views: 0,
        members: 0
      });

      alert('Group submitted for review!');
      navigate('/');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWhatsAppGroup = () => {
    // Already on this page
    setShowAddGroupPopup(false);
  };

  const handleAddTelegramGroup = () => {
    const currentOrigin = window.location.origin;
    const fullUrl = `${currentOrigin}/add-telegram-group`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
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
            <button className="nav-btn nav-btn-outline" onClick={() => navigate('/')}>
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

      <div className="add-whatsapp-container">
        <div className="add-whatsapp-form-container">
          <div className="form-content">
            <h1 className="form-header">
              <span className="form-header-icon">
                <img src="/whatsapp.png" alt="" />
              </span>
              Add WhatsApp Group
            </h1>

            <form onSubmit={handleSubmit} className="form-main">
              {/* Group Name */}
              <div className="form-group">
                <label className="form-label">Group Name </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="Enter group name"
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
                    className="form-input"
                    placeholder="Search category..."
                    required
                  />
                  <span className="dropdown-arrow"></span>
                </div>
                {showCategoryDropdown && (
                  <div className="dropdown-list">
                    {filteredCategories.map((cat, i) => (
                      <div
                        key={i}
                        className="dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCategorySelect(cat);
                        }}
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
                    className="form-input"
                    placeholder="Search country..."
                    required
                  />
                  <span className="dropdown-arrow"></span>
                </div>
                {showCountryDropdown && (
                  <div className="dropdown-list">
                    {filteredCountries.map((country, i) => (
                      <div
                        key={i}
                        className="dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCountrySelect(country);
                        }}
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
                    className="form-input"
                    placeholder="Search language..."
                    required
                  />
                  <span className="dropdown-arrow"></span>
                </div>
                {showLanguageDropdown && (
                  <div className="dropdown-list">
                    {filteredLanguages.map((lang, i) => (
                      <div
                        key={i}
                        className="dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleLanguageSelect(lang);
                        }}
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

              {/* WhatsApp Link */}
              <div className="form-group">
                <label className="form-label">WhatsApp Group Link </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  className="form-input"
                  placeholder="https://chat.whatsapp.com/..."
                  required
                />
                {formData.link && !whatsappLinkPattern.test(formData.link) && (
                  <p className="form-error">Invalid link format! Must start with https://chat.whatsapp.com/</p>
                )}
              </div>

              {/* Description - Now Optional */}
              <div className="form-group">
                <label className="form-label-optional">
                  Description ({250 - formData.description.length} characters remaining)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input textarea"
                  placeholder="Group description..."
                  maxLength={250}
                />
              </div>

              {/* Tags - Now Optional */}
              <div className="form-group">
                <label className="form-label-optional">Tags (Max 20 tags, 30 characters each)</label>
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
                ) : 'Submit Group'}
              </button>
            </form>

            {/* Guide Section */}
            <div className="guide-section">
              <div className="note-section">
                <h3>📢 Note:</h3>
                <p><strong>Your group is visible to the public worldwide. Anyone can view and join using your shared invite link. Please follow the rules below before submitting.</strong></p>
              </div>

              <div className="rules-section">
                <h3>✅ Group Publisher Rules</h3>
                <ol>
                  <li>Only submit groups you own or manage.</li>
                  <li>No adult, illegal, or spam content.</li>
                  <li>Group names and descriptions must match their actual purpose.</li>
                  <li>Refrain from repeatedly submitting the same group.</li>
                  <li>Violators will be blacklisted permanently.</li>
                </ol>
              </div>

              <div className="whatsapp-guide">
                <h3>📘 WhatsApp Group Guide</h3>

                <div className="guide-subsection">
                  <h4>🔹 WhatsApp Group Types</h4>
                  <ol>
                    <li><strong>Private Group:</strong> Invite-only. Only existing members can add new participants (unless changed by admin).</li>
                    <li><strong>Group with Invite Link:</strong> Anyone with the invite link can join without being added by a member.</li>
                  </ol>
                </div>

                <div className="guide-subsection">
                  <h4>🛠️ How to Create a WhatsApp Group</h4>
                  <ol>
                    <li>Open <strong>WhatsApp</strong>.</li>
                    <li>Tap the <strong>menu</strong> (⋮) or <strong>New Chat</strong> icon &gt; choose <strong>New Group</strong>.</li>
                    <li>Select at least one contact to add.</li>
                    <li>Enter a <strong>Group Name</strong> (up to 100 characters) and optionally set a <strong>Group Icon</strong>.</li>
                    <li>Tap <strong>Create</strong>.</li>
                  </ol>
                </div>

                <div className="guide-subsection">
                  <h4>🌐 How to Get a WhatsApp Invite Link</h4>
                  <ol>
                    <li>Open the group chat.</li>
                    <li>Tap the group name at the top.</li>
                    <li>Scroll down and tap <strong>Invite via Link</strong>.</li>
                    <li>Choose <strong>Copy Link</strong>, <strong>Share Link</strong>, or <strong>QR Code</strong>.</li>
                  </ol>
                </div>

                <div className="guide-subsection">
                  <h4>🚫 How to Revoke a WhatsApp Group Link</h4>
                  <div className="method">
                    <h5><strong>To Reset the Invite Link:</strong></h5>
                    <ol>
                      <li>Open the group chat.</li>
                      <li>Tap the group name &gt; <strong>Invite via Link</strong>.</li>
                      <li>Tap <strong>Reset Link</strong>.</li>
                    </ol>
                  </div>
                  <p className="note">Resetting the link will disable the old one instantly. A new link is generated automatically.</p>
                </div>

                <div className="guide-subsection">
                  <h4>👑 Group Admin Features</h4>
                  <ul>
                    <li>Add/remove members.</li>
                    <li>Promote other members to admin.</li>
                    <li>Control who can send messages (All Members or Admins Only).</li>
                    <li>Control who can edit group info (name, icon, description).</li>
                    <li>Approve new member requests (with approval mode).</li>
                    <li>Remove or block members.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>💡 General WhatsApp Group Features</h4>
                  <ul>
                    <li>Up to <strong>1,024 members</strong> per group.</li>
                    <li>Send messages, images, videos, documents, polls, and voice notes.</li>
                    <li>Pin important messages (up to 3 at a time).</li>
                    <li>Mention members with @name.</li>
                    <li>Reply to specific messages.</li>
                    <li>Create announcements-only groups.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>⚙️ Group Settings Overview</h4>
                  <ul>
                    <li><strong>Group Name:</strong> Up to 100 characters.</li>
                    <li><strong>Description:</strong> Optional, visible in group info.</li>
                    <li><strong>Send Messages:</strong> All Members or Admins Only.</li>
                    <li><strong>Edit Group Info:</strong> All Members or Admins Only.</li>
                    <li><strong>Add Members:</strong> All Members or Admins Only.</li>
                    <li><strong>Approve New Members:</strong> Enable to manually review join requests.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>👥 Managing Group Members</h4>
                  <ul>
                    <li>Add via contacts or share an invite link.</li>
                    <li>Enable "Approve New Members" for manual join control.</li>
                    <li>Remove spammers by tapping their name &gt; Remove.</li>
                    <li>Promote trusted members to admin roles.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>📏 WhatsApp Limitations</h4>
                  <ul>
                    <li>Max <strong>1,024 members</strong> per group.</li>
                    <li>Max file size for uploads: <strong>2 GB</strong>.</li>
                    <li>Max <strong>3 pinned messages</strong>.</li>
                    <li>Group name limit: <strong>100 characters</strong>.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>🤝 Group Etiquette Tips</h4>
                  <ul>
                    <li>Respect all members.</li>
                    <li>Stay on topic.</li>
                    <li>Avoid excessive forwarding or spam.</li>
                    <li>Use pinned messages and group description wisely.</li>
                  </ul>
                </div>

                <div className="guide-subsection">
                  <h4>❓ FAQs</h4>
                  <div className="faq-item">
                    <p><strong>Q1:</strong> <em>How to submit a WhatsApp group to multilinks.cloud?</em></p>
                    <p>→ Use the group submission form above and paste your WhatsApp invite link (starts with https://chat.whatsapp.com/).</p>
                  </div>
                  <div className="faq-item">
                    <p><strong>Q2:</strong> <em>Can I remove my group from the site later?</em></p>
                    <p>→ Yes, contact support via the site or email.</p>
                  </div>
                  <div className="faq-item">
                    <p><strong>Q3:</strong> <em>Is my WhatsApp link safe on this platform?</em></p>
                    <p>→ Yes, but it's public. You can reset it anytime from WhatsApp Group Settings.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Group Popup - Fixed Version */}
            {showExistingPopup && (
              <div className="existing-group-popup-overlay">
                <div className="existing-group-popup">
                  <div className="popup-content">
                    <h3>Group Already Exists</h3>
                    <p>This WhatsApp group is already listed in our directory.</p>
                    <div className="popup-buttons">
                      <button 
                        className="popup-button popup-close"
                        onClick={() => {
                          setShowExistingPopup(false);
                          setIsSubmitting(false);
                        }}
                      >
                        Close
                      </button>
                      <button 
                        className="popup-button popup-open"
                        onClick={() => {
                          window.open(existingGroup, '_blank');
                          setShowExistingPopup(false);
                          setIsSubmitting(false);
                        }}
                      >
                        Open Group
                      </button>
                    </div>
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

export default AddWhatsappGroup;