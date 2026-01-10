import React from 'react';
import '../App.css';
import './Legal.css';
import SectionHeader from '../components/ui/SectionHeader';

const Legal: React.FC = () => {
  return (
    <div className="legal-page fade-in">
      <SectionHeader 
        title="Legal Information" 
        subtitle="Privacy Policy & Terms of Use" 
      />

      <div className="legal-container">
        
        {/* --- PRIVACY POLICY --- */}
        <section className="legal-document">
          <h2 className="doc-title">Privacy Policy</h2>
          <p className="doc-meta">Last Updated: January 10, 2026</p>

          <div className="doc-content">
            <h3>1. Introduction</h3>
            <p>
              Welcome to <strong>The Gamut</strong>, operated by <strong>Stalingrad Technologies (OPC) Pvt Ltd</strong> ("Company", "we", "our", or "us"). 
              We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you visit our application.
            </p>

            <h3>2. Information We Collect</h3>
            <h4>A. Personal Data</h4>
            <ul>
              <li><strong>Identity Data:</strong> Name, email address, and profile pictures (facilitated via Google Sign-In or manual upload).</li>
              <li><strong>Account Credentials:</strong> Passwords (encrypted and stored via Firebase Authentication).</li>
              <li><strong>Emergency Contacts:</strong> Names and phone numbers of contacts you designate for our safety/emergency features.</li>
            </ul>

            <h4>B. Usage and Device Data</h4>
            <ul>
              <li><strong>Activity Logs:</strong> We track your interactions, such as articles read, saved, or shared, and time spent on specific narratives to improve content recommendations.</li>
              <li><strong>Device Information:</strong> IP address, browser type, and operating system.</li>
            </ul>

            <h4>C. Location Data</h4>
            <p>
              We may request access to your device’s location to provide local weather updates (via our Weather Widget). 
              You can enable or disable this access at any time through your device settings.
            </p>

            <h3>3. How We Use Your Information</h3>
            <p>We use the data we collect to:</p>
            <ul>
              <li><strong>Provide Services:</strong> Deliver personalized news feeds, generate audio narratives, and manage your user account.</li>
              <li><strong>AI Processing:</strong> Your reading preferences and search queries are processed by AI models (Google Gemini) to summarize news and generate "Smart Briefs."</li>
              <li><strong>Notifications:</strong> Send push notifications regarding breaking news or daily briefings.</li>
              <li><strong>Emergency Services:</strong> If you trigger an emergency alert, we use your stored contacts to facilitate immediate communication.</li>
            </ul>

            <h3>4. Third-Party Service Providers</h3>
            <p>We share specific data with trusted third-party services to function:</p>
            <ul>
              <li><strong>Authentication:</strong> Google Firebase handles secure login and identity management.</li>
              <li><strong>Database & Hosting:</strong> MongoDB stores user data; Railway hosts our backend services.</li>
              <li><strong>AI & Content:</strong> Google Gemini processes text for summaries; GNews provides aggregated news content.</li>
              <li><strong>Media:</strong> Cloudinary stores and streams audio files.</li>
            </ul>

            <h3>5. Data Retention</h3>
            <p>
              We retain your personal information only for as long as is necessary to legitimate business purposes or to comply with legal obligations. 
              You may request deletion of your account and data within the "Account Settings" section of the app.
            </p>

            <h3>6. Data Security</h3>
            <p>
              We use administrative, technical, and physical security measures to help protect your personal information. 
              While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, 
              no security measures are perfect or impenetrable.
            </p>

            <h3>7. Children's Privacy</h3>
            <p>
              The Gamut is not intended for children under the age of 13. We do not knowingly collect personal information from children.
            </p>

            <h3>8. Jurisdiction</h3>
            <p>This Privacy Policy is governed by the laws of India.</p>

            <h3>9. Contact Us</h3>
            <p>If you have questions or comments about this Privacy Policy, please contact us at: <strong>support@thegamut.app</strong></p>
          </div>
        </section>

        <hr className="legal-divider" />

        {/* --- TERMS OF USE --- */}
        <section className="legal-document">
          <h2 className="doc-title">Terms of Use</h2>
          <p className="doc-meta">Last Updated: January 10, 2026</p>

          <div className="doc-content">
            <h3>1. Agreement to Terms</h3>
            <p>
              These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") 
              and <strong>Stalingrad Technologies (OPC) Pvt Ltd</strong> ("Company," "we," "us," or "our"), concerning your access to and use of 
              <strong>The Gamut</strong> application. By accessing the application, you agree that you have read, understood, and agreed to be bound by all of these Terms of Use.
            </p>

            <h3>2. Intellectual Property Rights</h3>
            <p>
              Unless otherwise indicated, the application is our proprietary property. The source code, databases, functionality, software, 
              website designs, audio, video, text, and graphics on the application are owned or controlled by us or licensed to us.
            </p>
            <p>
              <strong>News Content:</strong> Articles and news summaries displayed are aggregated from third-party sources (e.g., GNews). 
              Stalingrad Technologies does not claim ownership of the original news articles.
            </p>

            <h3>3. User Representations</h3>
            <p>By using the application, you represent and warrant that:</p>
            <ul>
              <li>All registration information you submit will be true, accurate, current, and complete.</li>
              <li>You will maintain the accuracy of such information.</li>
              <li>You are not a minor in the jurisdiction in which you reside.</li>
            </ul>

            <h3>4. Prohibited Activities</h3>
            <p>
              You may not access or use The Gamut for any purpose other than that for which we make the application available. 
              Specifically, you agree not to:
            </p>
            <ul>
              <li>Systematically retrieve data (scraping) to create or compile a collection or database without written permission.</li>
              <li>Use the application to harass, abuse, or harm another person.</li>
              <li>Attempt to bypass any measures of the application designed to prevent or restrict access.</li>
              <li>Misuse the "Emergency" features for non-emergency situations.</li>
            </ul>

            <h3>5. AI-Generated Content Disclaimer</h3>
            <p>The Gamut utilizes Artificial Intelligence (Google Gemini) to summarize articles and generate audio.</p>
            <ul>
              <li><strong>Accuracy:</strong> While we strive for accuracy, AI-generated summaries may occasionally contain errors or hallucinations. We recommend verifying critical information with original sources.</li>
              <li><strong>Bias:</strong> AI models may inherently reflect biases present in their training data. We provide tools (like the "Bias Map") to help visualize this, but we do not guarantee total neutrality.</li>
            </ul>

            <h3>6. Third-Party Websites and Content</h3>
            <p>
              The application contains links to third-party websites (original news sources) and content. 
              We are not responsible for the content, accuracy, or opinions expressed in such websites.
            </p>

            <h3>7. Modifications and Interruptions</h3>
            <p>
              We reserve the right to change, modify, or remove the contents of the application at any time or for any reason at our sole discretion without notice. 
              We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the application.
            </p>

            <h3>8. Governing Law and Jurisdiction</h3>
            <p>
              These Terms shall be governed by and defined following the laws of <strong>India</strong>. 
              Any dispute arising out of or in relation to these Terms shall be subject to the exclusive jurisdiction of the courts located in 
              <strong>Pune, Maharashtra</strong>.
            </p>

            <h3>9. Contact Us</h3>
            <p>
              In order to resolve a complaint regarding the application or to receive further information regarding use of the application, please contact us at:<br/>
              <strong>Stalingrad Technologies (OPC) Pvt Ltd</strong><br/>
              Pune, Maharashtra, India<br/>
              Email: support@thegamut.app
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Legal;
