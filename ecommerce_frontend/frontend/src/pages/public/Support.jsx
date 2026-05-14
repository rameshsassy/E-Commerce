import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Phone, FileText, ChevronDown, CheckCircle, HelpCircle, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Support = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ticket');
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Ticket Form State
  const [formData, setFormData] = useState({
    subject: '',
    issueType: 'Order Issue',
    message: '',
    orderId: ''
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchTickets();
    }
  }, [user, activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/support');
      setMyTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('subject', formData.subject);
    data.append('issueType', formData.issueType);
    data.append('message', formData.message);
    if (formData.orderId) data.append('orderId', formData.orderId);
    
    attachments.forEach(file => {
      data.append('attachments', file);
    });

    try {
      await api.post('/support', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg("Your support ticket has been created successfully. Our team will contact you shortly.");
      setFormData({ subject: '', issueType: 'Order Issue', message: '', orderId: '' });
      setAttachments([]);
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in flex flex-col gap-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-black mb-4">How can we help you today?</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">We're here to assist you with your orders, account, or any questions you might have about Aashansh.</p>
      </div>

      {/* Contact Methods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform group cursor-pointer border border-glass-border hover:border-success/50">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MessageCircle size={32} />
          </div>
          <h3 className="font-bold text-lg mb-2">WhatsApp Support</h3>
          <p className="text-sm text-text-muted mb-4">Instant chat support available 9 AM - 6 PM IST</p>
          <span className="text-success font-medium">Chat Now &rarr;</span>
        </a>
        
        <a href="mailto:support@aashansh.com" className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform group cursor-pointer border border-glass-border hover:border-primary/50">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Mail size={32} />
          </div>
          <h3 className="font-bold text-lg mb-2">Email Us</h3>
          <p className="text-sm text-text-muted mb-4">Drop us an email. We reply within 24 hours.</p>
          <span className="text-primary font-medium">support@aashansh.com</span>
        </a>

        <Link to="/faq" className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-transform group cursor-pointer border border-glass-border hover:border-secondary/50">
          <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <HelpCircle size={32} />
          </div>
          <h3 className="font-bold text-lg mb-2">Help Center & FAQ</h3>
          <p className="text-sm text-text-muted mb-4">Find quick answers to common questions.</p>
          <span className="text-secondary font-medium">Browse FAQs &rarr;</span>
        </Link>
      </div>

      {/* Ticket System */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-glass-border">
        <div className="flex border-b border-glass-border">
          <button 
            className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'ticket' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
            onClick={() => setActiveTab('ticket')}
          >
            Raise a Ticket
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
            onClick={() => setActiveTab('history')}
          >
            My Support History
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'ticket' ? (
            <div className="max-w-2xl mx-auto">
              {!user ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-bold mb-4">Please log in to raise a ticket</h3>
                  <Link to="/login" className="btn btn-primary">Log In</Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {successMsg && (
                    <div className="bg-success/20 text-success p-4 rounded-xl flex items-center gap-3 font-medium">
                      <CheckCircle size={20} /> {successMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-muted">Issue Type</label>
                      <div className="relative">
                        <select 
                          className="input-field appearance-none"
                          value={formData.issueType}
                          onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                        >
                          <option value="Order Issue">Order Issue (Status, Tracking)</option>
                          <option value="Payment Issue">Payment Issue (Failed, Double Charge)</option>
                          <option value="Return/Refund">Return or Refund Request</option>
                          <option value="Account Issue">Account Issue (Login, Profile)</option>
                          <option value="Other">Other Query</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-text-muted">Order ID (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 64abc123..." 
                        className="input-field"
                        value={formData.orderId}
                        onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Subject</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Brief summary of your issue" 
                      className="input-field"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Message Details</label>
                    <textarea 
                      required
                      rows="5"
                      placeholder="Please describe your issue in detail so we can help you faster..." 
                      className="input-field resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-muted">Attachments (Optional)</label>
                    <div className="border-2 border-dashed border-glass-border rounded-xl p-6 text-center hover:bg-surface-hover transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileText size={32} className="mx-auto mb-2 text-text-muted" />
                      <p className="text-sm font-medium">Click to upload files or drag and drop</p>
                      <p className="text-xs text-text-muted mt-1">PNG, JPG or PDF (Max 3 files)</p>
                      {attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          {attachments.map((file, i) => (
                            <span key={i} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-md">{file.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-lg flex justify-center items-center gap-2 shadow-glow">
                    {loading ? 'Submitting...' : <><Send size={20} /> Submit Ticket</>}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {loading ? (
                <div className="text-center py-12 text-text-muted">Loading your tickets...</div>
              ) : myTickets.length === 0 ? (
                <div className="text-center py-12 text-text-muted flex flex-col items-center">
                  <FileText size={48} className="opacity-30 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Support Tickets</h3>
                  <p>You haven't raised any support tickets yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTickets.map(ticket => (
                    <div key={ticket._id} className="bg-surface border border-glass-border p-6 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`badge ${
                            ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-success/20 text-success' :
                            ticket.status === 'In Progress' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className="text-xs text-text-muted font-mono">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-lg mb-1">{ticket.subject}</h4>
                        <p className="text-sm text-text-muted">Ticket ID: #{ticket._id.toString().slice(-8)} &bull; Type: {ticket.issueType}</p>
                      </div>
                      <button className="text-primary text-sm font-bold hover:underline shrink-0">View Details &rarr;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
