import { Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";

export const ContactSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const body = encodeURIComponent(`From: ${name} <${email}>\n\n${message}`);
    window.location.href = `mailto:mkkeshwania@gmail.com?subject=Family%20Archive%20Inquiry&body=${body}`;
    setSent(true);
  };

  return (
    <section className="contact-section" aria-label="Contact us">
      <div className="contact-inner">
        <p className="about-eyebrow" data-reveal>Get in Touch</p>
        <h2 className="contact-title" data-reveal>Contact Us</h2>
        <div className="about-divider" aria-hidden="true" data-reveal>
          <span /><span className="about-divider-dot" /><span />
        </div>
        <p className="contact-lead" data-reveal>
          Have a story to add, a correction, or a question about the lineage?
          Reach out to the family archivists.
        </p>

        <div className="contact-grid">
          <div className="contact-info" data-reveal>
            <div className="contact-info-item">
              <span className="contact-icon" aria-hidden="true"><Mail size={18} /></span>
              <div>
                <strong>Email</strong>
                <a href="mailto:mkkeshwania@gmail.com">mkkeshwania@gmail.com</a>
              </div>
            </div>
            <div className="contact-info-item">
              <span className="contact-icon" aria-hidden="true"><Phone size={18} /></span>
              <div>
                <strong>Phone</strong>
                <a href="tel:+919416382783">+91 94163 82783</a>
              </div>
            </div>
            <div className="contact-info-item">
              <span className="contact-icon contact-icon--whatsapp" aria-hidden="true"><MessageCircle size={18} /></span>
              <div>
                <strong>WhatsApp</strong>
                <a href="https://wa.me/919416382783" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
              </div>
            </div>
            <div className="contact-info-item">
              <span className="contact-icon" aria-hidden="true"><MapPin size={18} /></span>
              <div>
                <strong>Ancestral Home</strong>
                <span>Keshwani Family Trust, India</span>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} data-reveal>
            <label className="login-field">
              <span>Your Name</span>
              <input
                className="simple-input"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSent(false); }}
                required
              />
            </label>
            <label className="login-field">
              <span>Email</span>
              <input
                className="simple-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSent(false); }}
                required
              />
            </label>
            <label className="login-field">
              <span>Message</span>
              <textarea
                className="simple-input contact-textarea"
                rows={4}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setSent(false); }}
                required
              />
            </label>
            <button type="submit" className="primary-button contact-submit">
              <Send size={15} /> Send Message
            </button>
            {sent && <p className="contact-sent">Opening your mail client…</p>}
          </form>
        </div>

        <p className="contact-footer-line" data-reveal>
          &#x0936;&#x094D;&#x0930;&#x0940; &#x0915;&#x0947;&#x0936;&#x094D;&#x0935;&#x093E;&#x0928;&#x093F;&#x092F;&#x093E; &#x0935;&#x0902;&#x0936;
        </p>
      </div>
    </section>
  );
};
