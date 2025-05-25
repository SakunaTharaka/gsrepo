import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FaFlag, FaStar } from 'react-icons/fa';
import '../css/ViewGroup.css';

function ViewGroup() {
  const { platform, groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const collectionName = platform === 'whatsapp' ? 'whatsapp' : 'telegramGroups';
        const groupRef = doc(db, collectionName, groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          setGroup({ id: groupSnap.id, ...groupSnap.data() });
        } else {
          navigate('/404');
        }
      } catch (error) {
        console.error('Error fetching group:', error);
        navigate('/error');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [platform, groupId, navigate]);

  const handleReportSubmit = async () => {
    if (!reportText.trim() || reportText.length > 150) return;

    setIsSubmitting(true);
    try {
      const groupRef = doc(db, platform === 'whatsapp' ? 'whatsapp' : 'telegramGroups', groupId);
      
      await updateDoc(groupRef, {
        reports: arrayUnion({
          text: reportText.substring(0, 150),
          timestamp: new Date().toISOString(),
          status: 'pending'
        })
      });

      setReportStatus('Report submitted successfully!');
      setReportText('');
      setTimeout(() => setReportStatus(''), 3000);
      setShowReport(false);
    } catch (error) {
      console.error('Error submitting report:', error);
      setReportStatus('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container">Loading group details...</div>;

  if (!group) return <div className="error-container">Group not found</div>;

  const groupIcon = group.iconUrl || group.avatar;

  return (
    <div className="view-group-container">
      <header className="main-header">
        <div className="header-content">
          <h1>Multilinks.cloud</h1>
          <h2>Find your community</h2>
        </div>
      </header>

      <div className="group-icon-container">
        {groupIcon ? (
          <img src={groupIcon} alt={group.name} className="group-icon" />
        ) : (
          <div className={`default-group-icon ${platform}`}>
            {platform === 'whatsapp' ? 'WA' : 'TG'}
            <FaStar className="verified-star" />
          </div>
        )}
      </div>

      <div className="group-header">
        <h1 className="group-name">{group.name}</h1>
        <span className={`platform-tag ${platform}`}>
          {platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
        </span>
      </div>

      <button 
        className="report-button"
        onClick={() => setShowReport(!showReport)}
      >
        <FaFlag /> Report Group
      </button>

      {showReport && (
        <div className="report-section">
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Please describe the issue (max 150 characters)"
            maxLength={150}
            className="report-textarea"
          />
          <div className="report-controls">
            <span className="char-count">{150 - reportText.length} characters remaining</span>
            <button
              className="submit-report"
              onClick={handleReportSubmit}
              disabled={!reportText.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}

      {reportStatus && <div className="report-status">{reportStatus}</div>}

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

      {group.description && (
        <div className="group-description">
          <h3>Description</h3>
          <p>{group.description}</p>
        </div>
      )}

      {group.tags?.length > 0 && (
        <div className="group-tags">
          <h3>Tags</h3>
          <div className="tags-container">
            {group.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="action-section">
        <a 
          href={group.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`direct-link ${platform}`}
        >
          Join {platform === 'whatsapp' ? 'WhatsApp Group' : 'Telegram Channel'}
        </a>

        <div className="terms-conditions">
          <h4>Terms & Conditions:</h4>
          <ul>
            <li>You must be at least 13 years old to join</li>
            <li>Must comply with all applicable laws and group rules</li>
            <li>You're solely responsible for your interactions</li>
            <li>We don't monitor group content continuously</li>
            <li>Privacy practices may vary by group</li>
            <li>We're not responsible for any group activities</li>
            <li>False reports may lead to account suspension</li>
          </ul>
        </div>
      </div>

      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        &larr; Back to Groups
      </button>
    </div>
  );
}

export default ViewGroup;