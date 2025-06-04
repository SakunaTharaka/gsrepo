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
    if ((value.endsWith(',') || value.endsWith(' ')) && value.trim().length > 0) {
      const newTag = value.slice(0, -1).trim().substring(0, 15);
      if (newTag && tags.length < 20) {
        setTags(prev => [...prev, newTag]);
        setTagInput('');
      }
    } else {
      setTagInput(value.substring(0, 15));
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
      // Validate required fields
      const requiredFields = ['name', 'category', 'country', 'language', 'link', 'description'];
      const allRequiredFilled = requiredFields.every(field => formData[field].trim());

      if (!allRequiredFilled || tags.length === 0) {
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
        setExistingGroup(formData.link);
        setShowExistingPopup(true);
        return;
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

  return (
    <div className="add-whatsapp-container">
      <header className="main-header">
  <div className="header-content">
    <h1 
      style={{ cursor: 'pointer' }} 
      onClick={() => navigate('/')}
    >
      Multilinks.cloud
    </h1>
    <h2>Find your community</h2>
  </div>
</header>
      <div className="add-whatsapp-form-container">
        <div className="form-content">
          <h1 className="form-header">Add WhatsApp Group</h1>

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

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Description * ({250 - formData.description.length} characters remaining)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-input textarea"
                placeholder="Group description..."
                maxLength={250}
                required
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags * (Max 20 tags, 15 characters each)</label>
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
                    placeholder="Type tags separated by commas..."
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
                  <li><strong>Private Groups:</strong> Only admins can add members. Group name/description is not publicly visible.</li>
                  <li><strong>Public Groups:</strong> Anyone can join using a public invite link. Group info is publicly visible.</li>
                </ol>
              </div>

              <div className="guide-subsection">
                <h4>🛠️ How to Create a WhatsApp Group</h4>
                <ol>
                  <li>Open <strong>WhatsApp</strong> &gt; go to the <strong>Chats</strong> tab.</li>
                  <li>Tap <strong>"New Group"</strong>.</li>
                  <li>Select contacts to add.</li>
                  <li>Tap <strong>Next</strong>, enter a <strong>Group Name</strong> (max 25 characters).</li>
                  <li>Optionally, add a <strong>Group Description</strong>.</li>
                  <li>Tap <strong>Create</strong>.</li>
                </ol>
              </div>

              <div className="guide-subsection">
                <h4>🚫 How to Deactivate or Revoke a Group Link</h4>
                <div className="method">
                  <h5><strong>Method 1: Group Info</strong></h5>
                  <ol>
                    <li>Open the group chat.</li>
                    <li>Tap the group name at the top.</li>
                    <li>Tap <strong>Invite via link</strong>.</li>
                    <li>Tap <strong>Revoke link</strong>.</li>
                  </ol>
                </div>
                <div className="method">
                  <h5><strong>Method 2: Group Settings</strong></h5>
                  <ol>
                    <li>Open the group.</li>
                    <li>Tap the three-dot menu (⋮) &gt; <strong>Group settings</strong>.</li>
                    <li>Tap <strong>Group link</strong> &gt; <strong>Revoke link</strong>.</li>
                  </ol>
                </div>
                <p className="note">This will disable the current invite link. A new one can be generated anytime.</p>
              </div>

              <div className="guide-subsection">
                <h4>👑 Group Admin Features</h4>
                <ul>
                  <li>Add or remove members.</li>
                  <li>Change the group name, icon, or description.</li>
                  <li>Control who can send messages.</li>
                  <li>Promote or demote other admins.</li>
                  <li>Revoke or share invite links.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h4>💡 General WhatsApp Group Features</h4>
                <ul>
                  <li>Chat with up to <strong>256 members</strong>.</li>
                  <li>Share files, images, videos (max 100MB).</li>
                  <li>End-to-end encrypted communication.</li>
                  <li>Invite members via links or contacts.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h4>⚙️ Group Settings Overview</h4>
                <ul>
                  <li><strong>Group Name:</strong> Up to 25 characters.</li>
                  <li><strong>Group Description:</strong> Optional, visible to new joiners.</li>
                  <li><strong>Group Icon:</strong> Upload an image to represent the group.</li>
                  <li><strong>Message Permissions:</strong> All members or admins only.</li>
                  <li><strong>Edit Permissions:</strong> Decide who can change group info.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h4>👥 Managing Group Members</h4>
                <ul>
                  <li>Add via contact or shareable link.</li>
                  <li>Remove members anytime (admin only).</li>
                  <li>Promote members to admin.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h4>📏 WhatsApp Limitations</h4>
                <ul>
                  <li>Max 1,024 members per group.</li>
                  <li>Max 2GB file size for sharing.</li>
                  <li>Message overload can lead to account issues.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h4>🤝 Group Etiquette Tips</h4>
                <ul>
                  <li>Be respectful and inclusive.</li>
                  <li>Stay on topic based on the group's purpose.</li>
                  <li>No spam or excessive promotion.</li>
                  <li>Use group settings to manage chaos.</li>
                </ul>
              </div>

              <div className="guide-subsection">
                <h4>❓ FAQs</h4>
                <div className="faq-item">
                  <p><strong>Q1:</strong> <em>How to submit a group to multilinks.cloud?</em></p>
                  <p>→ Use the submission form and paste your public group link.</p>
                </div>
                <div className="faq-item">
                  <p><strong>Q2:</strong> <em>Can I delete my group from the site?</em></p>
                  <p>→ Yes, contact support via the website or email.</p>
                </div>
                <div className="faq-item">
                  <p><strong>Q3:</strong> <em>Is my group link safe here?</em></p>
                  <p>→ Yes, but it's public. Revoke it anytime if needed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Group Popup */}
          {showExistingPopup && (
            <div className="existing-group-popup">
              <div className="popup-content">
                <h3>Group Exists</h3>
                <p>This group is already listed in our directory.</p>
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
  );
};

export default AddWhatsappGroup;