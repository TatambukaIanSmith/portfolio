import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Shield, Eye, Database, Lock } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-space-950/95 backdrop-blur-2xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-space-900/90 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-2xl flex items-center justify-center">
                  <AnimatedIcon>
                    <Shield className="w-6 h-6 text-accent-primary" />
                  </AnimatedIcon>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">Privacy Policy</h2>
                  <p className="text-white/40 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-120px)] space-y-8">
              {/* Introduction */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-accent-primary" />
                  Information We Collect
                </h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    When you interact with our platform, we may collect the following types of information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Contact Information:</strong> Name, email address, phone number when you submit contact forms</li>
                    <li><strong>Communication Data:</strong> Messages, project briefs, and correspondence through our contact systems</li>
                    <li><strong>Technical Information:</strong> IP address, browser type, device information, and usage analytics</li>
                    <li><strong>Interaction Data:</strong> Pages visited, time spent on site, and user engagement metrics</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Database className="w-5 h-5 text-accent-primary" />
                  How We Use Your Information
                </h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>We use the collected information for the following purposes:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Responding to your inquiries and project requests</li>
                    <li>Providing technical support and customer service</li>
                    <li>Improving our services and user experience</li>
                    <li>Sending relevant updates about projects and services (with your consent)</li>
                    <li>Analyzing website performance and user behavior</li>
                    <li>Complying with legal obligations and protecting our rights</li>
                  </ul>
                </div>
              </section>

              {/* Data Protection */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-accent-primary" />
                  Data Protection & Security
                </h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    We implement industry-standard security measures to protect your personal information:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encrypted data transmission using SSL/TLS protocols</li>
                    <li>Secure database storage with access controls</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Limited access to personal data on a need-to-know basis</li>
                    <li>Data backup and recovery procedures</li>
                  </ul>
                </div>
              </section>

              {/* Data Sharing */}
              <section>
                <h3 className="text-xl font-bold mb-4">Data Sharing & Third Parties</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>With your explicit consent</li>
                    <li>To comply with legal requirements or court orders</li>
                    <li>To protect our rights, property, or safety</li>
                    <li>With trusted service providers who assist in our operations (under strict confidentiality agreements)</li>
                  </ul>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h3 className="text-xl font-bold mb-4">Your Rights & Choices</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>You have the following rights regarding your personal information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                    <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
                  </ul>
                </div>
              </section>

              {/* Cookies */}
              <section>
                <h3 className="text-xl font-bold mb-4">Cookies & Tracking</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    We use cookies and similar technologies to enhance your browsing experience. These may include:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Essential cookies for website functionality</li>
                    <li>Analytics cookies to understand user behavior</li>
                    <li>Performance cookies to optimize loading times</li>
                  </ul>
                  <p>
                    You can control cookie settings through your browser preferences.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">
                    If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:leemeeya851@gmail.com?subject=Privacy Policy Inquiry" className="text-accent-primary hover:underline transition-all">leemeeya851@gmail.com</a></p>
                    <p><strong>Response Time:</strong> Within 48 hours</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <p className="text-white/40 text-sm">
                This policy is effective as of {new Date().toLocaleDateString()} and may be updated periodically.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-accent-primary text-white font-bold rounded-xl hover:bg-accent-primary/80 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Site
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrivacyPolicy;