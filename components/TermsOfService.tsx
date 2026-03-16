import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, FileText, AlertTriangle, Scale, Users } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ isOpen, onClose }) => {
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
                    <FileText className="w-6 h-6 text-accent-primary" />
                  </AnimatedIcon>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">Terms of Service</h2>
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
                  <Scale className="w-5 h-5 text-accent-primary" />
                  Agreement to Terms
                </h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    By accessing and using this website and services provided by Ian Smith ("we," "us," or "our"), 
                    you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                  <p>
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </div>
              </section>

              {/* Services */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent-primary" />
                  Services Provided
                </h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>We provide the following professional services:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Full-stack web development using Laravel and modern frameworks</li>
                    <li>Custom software architecture and development</li>
                    <li>Technical consulting and code review services</li>
                    <li>API development and integration services</li>
                    <li>Database design and optimization</li>
                    <li>DevOps and deployment solutions</li>
                  </ul>
                </div>
              </section>

              {/* User Responsibilities */}
              <section>
                <h3 className="text-xl font-bold mb-4">User Responsibilities</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>When using our services, you agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate and complete information when requested</li>
                    <li>Maintain the confidentiality of any login credentials</li>
                    <li>Use our services only for lawful purposes</li>
                    <li>Respect intellectual property rights</li>
                    <li>Not attempt to gain unauthorized access to our systems</li>
                    <li>Not use our services to transmit harmful or malicious content</li>
                  </ul>
                </div>
              </section>

              {/* Project Terms */}
              <section>
                <h3 className="text-xl font-bold mb-4">Project Engagement Terms</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>For development projects, the following terms apply:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Scope:</strong> Project scope will be defined in a separate project agreement</li>
                    <li><strong>Timeline:</strong> Delivery timelines are estimates and may vary based on project complexity</li>
                    <li><strong>Payment:</strong> Payment terms will be specified in individual project contracts</li>
                    <li><strong>Revisions:</strong> Reasonable revisions are included; major scope changes may incur additional costs</li>
                    <li><strong>Intellectual Property:</strong> Upon full payment, clients receive rights to custom-developed code</li>
                    <li><strong>Support:</strong> Post-launch support terms will be defined per project</li>
                  </ul>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h3 className="text-xl font-bold mb-4">Intellectual Property Rights</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    The service and its original content, features, and functionality are and will remain the 
                    exclusive property of Ian Smith and its licensors.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Website design, code, and content are protected by copyright and trademark laws</li>
                    <li>You may not reproduce, distribute, or create derivative works without permission</li>
                    <li>Custom development work becomes client property upon full payment</li>
                    <li>We retain rights to general methodologies and non-proprietary techniques</li>
                  </ul>
                </div>
              </section>

              {/* Limitations */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-accent-primary" />
                  Limitations of Liability
                </h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    In no event shall Ian Smith, nor its directors, employees, partners, agents, suppliers, 
                    or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Services are provided "as is" without warranties of any kind</li>
                    <li>We do not guarantee uninterrupted or error-free service</li>
                    <li>Maximum liability is limited to the amount paid for services</li>
                    <li>Client is responsible for data backup and security</li>
                  </ul>
                </div>
              </section>

              {/* Privacy */}
              <section>
                <h3 className="text-xl font-bold mb-4">Privacy & Data Protection</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy, which also governs 
                    your use of the service, to understand our practices.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We collect only necessary information for service provision</li>
                    <li>Personal data is protected according to applicable privacy laws</li>
                    <li>We do not sell or share personal information with third parties</li>
                    <li>Cookies may be used to enhance user experience</li>
                  </ul>
                </div>
              </section>

              {/* Termination */}
              <section>
                <h3 className="text-xl font-bold mb-4">Termination</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    We may terminate or suspend access immediately, without prior notice or liability, 
                    for any reason whatsoever, including without limitation if you breach the Terms.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Either party may terminate ongoing projects with appropriate notice</li>
                    <li>Completed work and payments remain valid after termination</li>
                    <li>Confidentiality obligations survive termination</li>
                  </ul>
                </div>
              </section>

              {/* Changes */}
              <section>
                <h3 className="text-xl font-bold mb-4">Changes to Terms</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                    If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h3 className="text-xl font-bold mb-4">Governing Law</h3>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    These Terms shall be interpreted and governed by the laws of the jurisdiction in which 
                    Ian Smith operates, without regard to its conflict of law provisions.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <div className="text-white/70 leading-relaxed">
                  <p className="mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:leemeeya851@gmail.com?subject=Terms of Service Inquiry" className="text-accent-primary hover:underline transition-all">leemeeya851@gmail.com</a></p>
                    <p><strong>Response Time:</strong> Within 48 hours</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <p className="text-white/40 text-sm">
                These terms are effective as of {new Date().toLocaleDateString()} and may be updated periodically.
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

export default TermsOfService;